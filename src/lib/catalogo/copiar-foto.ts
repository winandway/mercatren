import "server-only";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { imagenesProducto } from "@/lib/db/schema";

/**
 * COPIAR UNA FOTO DEL SERVIDOR DE ORIGEN A NUESTRO BUCKET.
 *
 * Una sola pieza para el botón del panel y para el reloj: escrita dos veces,
 * una de las dos se queda atrás al primer arreglo (la extensión, el tipo, el
 * borrado de la dirección vieja).
 *
 * Devuelve el estado HTTP cuando el origen contestó, para que quien llama
 * distinga «ya no existe» (404) de «ahora no» (429, 5xx, corte de red).
 */

type Bucket = {
  put: (
    clave: string,
    cuerpo: ArrayBuffer,
    opciones: { httpMetadata: { contentType: string } },
  ) => Promise<unknown>;
};

export type ResultadoCopia =
  | { ok: true; clave: string }
  | { ok: false; status: number | null; error?: unknown };

/** La extensión según lo que diga el servidor de origen. */
export function extensionDe(tipo: string | null): string {
  if (tipo?.includes("png")) return "png";
  if (tipo?.includes("webp")) return "webp";
  if (tipo?.includes("avif")) return "avif";
  if (tipo?.includes("gif")) return "gif";
  return "jpg";
}

/** Tiempo máximo esperando al origen: un servidor colgado no puede comerse
 *  el latido entero del reloj. */
const ESPERA_MS = 12_000;

export async function copiarFotoAlBucket(
  bucket: Bucket,
  foto: { id: string; productoId: string; url: string },
): Promise<ResultadoCopia> {
  try {
    const respuesta = await fetch(foto.url, {
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (!respuesta.ok) return { ok: false, status: respuesta.status };

    const tipo = respuesta.headers.get("content-type");
    /* Un origen que contesta 200 con HTML (una página de error disfrazada)
       no es una foto: se trata como fallo pasajero, no se guarda basura. */
    if (tipo && !tipo.startsWith("image/")) {
      return { ok: false, status: null, error: new Error(`tipo ${tipo}`) };
    }

    const clave = `productos/${foto.productoId}/${nanoid()}.${extensionDe(tipo)}`;
    await bucket.put(clave, await respuesta.arrayBuffer(), {
      httpMetadata: { contentType: tipo ?? "image/jpeg" },
    });

    /* La dirección vieja se borra en el mismo paso: mientras `url` siga
       puesta, la foto se sigue sirviendo desde el servidor de origen. */
    await getDb()
      .update(imagenesProducto)
      .set({ clave, url: null })
      .where(eq(imagenesProducto.id, foto.id));

    return { ok: true, clave };
  } catch (error) {
    return { ok: false, status: null, error };
  }
}
