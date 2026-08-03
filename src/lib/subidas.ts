import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { nanoid } from "nanoid";

/**
 * Subida de imagenes al almacenamiento del sitio.
 *
 * Lo usan el logo y la portada del comercio, y las fotos de producto. Los
 * comprobantes de pago tienen su propio camino (src/lib/pedidos/comprobante.ts)
 * porque ademas hay que protegerlos de otros clientes.
 *
 * Se comprueba SIEMPRE tipo y tamano aqui, en el servidor. Lo que valide el
 * navegador es una comodidad para la persona, no una defensa: cualquiera
 * puede saltarselo.
 */

export const TIPOS_IMAGEN = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** 5 MB. Una foto de producto decente pesa mucho menos. */
export const TAMANO_MAXIMO = 5 * 1024 * 1024;

export type ResultadoSubida =
  { ok: true; clave: string } | { ok: false; mensaje: string };

/** La extension, sacada del tipo declarado y no del nombre del archivo. */
function extensionDe(tipo: string) {
  if (tipo === "image/png") return "png";
  if (tipo === "image/webp") return "webp";
  if (tipo === "image/avif") return "avif";
  return "jpg";
}

/**
 * Guarda una imagen y devuelve su clave.
 *
 * `carpeta` agrupa (por ejemplo "tiendas/mi-tienda"). El nombre del archivo
 * lo pone el sistema, nunca la persona: un nombre subido tal cual puede traer
 * barras y salirse de su carpeta.
 */
export async function subirImagen(
  archivo: unknown,
  carpeta: string,
): Promise<ResultadoSubida> {
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, mensaje: "Elige una imagen." };
  }
  if (!TIPOS_IMAGEN.includes(archivo.type as (typeof TIPOS_IMAGEN)[number])) {
    return {
      ok: false,
      mensaje: "El archivo tiene que ser una imagen (JPG, PNG, WEBP o AVIF).",
    };
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return { ok: false, mensaje: "La imagen pesa demasiado. Máximo 5 MB." };
  }

  const limpia = carpeta.replace(/[^a-z0-9/-]/gi, "").replace(/^\/+|\/+$/g, "");
  const clave = `${limpia}/${nanoid()}.${extensionDe(archivo.type)}`;

  const { env } = getCloudflareContext();
  await env.BUCKET.put(clave, await archivo.arrayBuffer(), {
    httpMetadata: { contentType: archivo.type },
  });

  return { ok: true, clave };
}

/** Borra una imagen del almacenamiento. Se usa al reemplazar logo o portada. */
export async function borrarImagen(clave: string | null | undefined) {
  if (!clave) return;
  try {
    const { env } = getCloudflareContext();
    await env.BUCKET.delete(clave);
  } catch (e) {
    // Que quede un archivo huerfano no puede tumbar la operacion.
    console.error("[subidas] no se pudo borrar", clave, e);
  }
}
