"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, isNotNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { imagenesProducto } from "@/lib/db/schema";

/**
 * Trae a nuestro almacenamiento las fotos que viven en el servidor del
 * comercio de origen.
 *
 * POR QUE HACE FALTA: el catalogo importado apunta a las fotos del sistema
 * viejo del comercio. El dia que esa tienda se apague o cambie de dominio,
 * Mercatren se queda sin fotos de un dia para otro, con el catalogo entero
 * en blanco. Copiarlas corta esa dependencia para siempre.
 *
 * VA POR TANDAS a proposito. Son cientos de imagenes y cada una es una
 * descarga: hacerlas todas en una sola peticion la mataria por tiempo. Cada
 * llamada trae unas pocas y devuelve cuantas faltan, para que la pantalla
 * siga sola hasta terminar.
 *
 * Es idempotente: solo mira las que todavia tienen `url` y no tienen `clave`.
 * Repetirlo no duplica nada.
 */

/** Pocas por tanda: cada una es una descarga y una subida. */
const POR_TANDA = 8;

export type ResultadoTanda = {
  ok: boolean;
  copiadas: number;
  fallidas: number;
  faltan: number;
  mensaje?: string;
};

/** La extension segun lo que diga el servidor de origen. */
function extensionDe(tipo: string | null) {
  if (tipo?.includes("png")) return "png";
  if (tipo?.includes("webp")) return "webp";
  if (tipo?.includes("avif")) return "avif";
  if (tipo?.includes("gif")) return "gif";
  return "jpg";
}

/** Cuantas fotos siguen dependiendo del servidor de origen. */
export async function contarFotosPendientes() {
  await exigirEquipoInterno();
  const db = getDb();

  const [fila] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(imagenesProducto)
    .where(isNotNull(imagenesProducto.url));

  return Number(fila?.n ?? 0);
}

/**
 * Copia una tanda. Devuelve cuantas quedan para que quien llama siga.
 *
 * Si una foto concreta falla (el servidor de origen no responde, o borro esa
 * imagen), se cuenta como fallida y se sigue con las demas: una foto rota no
 * puede detener la migracion de las otras seiscientas.
 */
export async function traerTandaDeFotos(): Promise<ResultadoTanda> {
  try {
    await exigirEquipoInterno();
  } catch {
    return {
      ok: false,
      copiadas: 0,
      fallidas: 0,
      faltan: 0,
      mensaje: "Esta parte es solo para el equipo de Mercatren.",
    };
  }

  const db = getDb();
  const { env } = getCloudflareContext();

  const pendientes = await db
    .select({
      id: imagenesProducto.id,
      productoId: imagenesProducto.productoId,
      url: imagenesProducto.url,
    })
    .from(imagenesProducto)
    .where(isNotNull(imagenesProducto.url))
    .limit(POR_TANDA);

  let copiadas = 0;
  let fallidas = 0;

  for (const foto of pendientes) {
    if (!foto.url) continue;

    try {
      const respuesta = await fetch(foto.url);
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

      const tipo = respuesta.headers.get("content-type");
      const clave = `productos/${foto.productoId}/${nanoid()}.${extensionDe(tipo)}`;

      await env.BUCKET.put(clave, await respuesta.arrayBuffer(), {
        httpMetadata: { contentType: tipo ?? "image/jpeg" },
      });

      // La direccion vieja se borra en el mismo paso: mientras `url` siga
      // puesta, la foto se sigue sirviendo desde el servidor de origen.
      await db
        .update(imagenesProducto)
        .set({ clave, url: null })
        .where(eq(imagenesProducto.id, foto.id));

      copiadas++;
    } catch (e) {
      console.error(`[fotos] no se pudo traer ${foto.url}:`, e);
      fallidas++;
    }
  }

  const faltan = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(imagenesProducto)
    .where(isNotNull(imagenesProducto.url))
    .then((r) => Number(r[0]?.n ?? 0));

  if (copiadas > 0) {
    revalidatePath("/[locale]/catalogo", "page");
    revalidatePath("/[locale]/panel", "layout");
  }

  return { ok: true, copiadas, fallidas, faltan };
}
