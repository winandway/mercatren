"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { copiarFotoAlBucket } from "@/lib/catalogo/copiar-foto";
import { getDb } from "@/lib/db";
import { mensajes } from "@/lib/mensajes";
import { fotosRotas, imagenesProducto } from "@/lib/db/schema";

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
  const t = await mensajes();

  try {
    await exigirEquipoInterno();
  } catch {
    return {
      ok: false,
      copiadas: 0,
      fallidas: 0,
      faltan: 0,
      mensaje: t("soloEquipo"),
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

    /* El mismo copiador que usa el reloj (`copiar-foto.ts`): una sola pieza. */
    const r = await copiarFotoAlBucket(env.BUCKET, {
      id: foto.id,
      productoId: foto.productoId,
      url: foto.url,
    });
    if (r.ok) {
      await db.delete(fotosRotas).where(eq(fotosRotas.imagenId, foto.id));
      copiadas++;
    } else {
      console.error(
        `[fotos] no se pudo traer ${foto.url}:`,
        r.status ?? r.error,
      );
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
