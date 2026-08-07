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

/**
 * LOS DOCUMENTOS: como las imágenes, pero además admiten PDF.
 *
 * Existe aparte de `subirImagen` a propósito. La factura que nos manda un
 * comercio casi siempre es un PDF, y a veces la foto del papel; pero el logo
 * de una tienda **nunca** puede ser un PDF. Si se ampliara la lista de
 * `subirImagen` para que sirviera aquí, mañana alguien sube un PDF de logo y
 * la tienda se ve rota.
 *
 * El tope sube a 10 MB: un escaneo de varias páginas pesa más que una foto de
 * producto.
 */
export const TIPOS_DOCUMENTO = [...TIPOS_IMAGEN, "application/pdf"] as const;

export const TAMANO_MAXIMO_DOCUMENTO = 10 * 1024 * 1024;

export async function subirDocumento(
  archivo: unknown,
  carpeta: string,
): Promise<ResultadoSubida> {
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, mensaje: "Elige un archivo." };
  }
  if (
    !TIPOS_DOCUMENTO.includes(archivo.type as (typeof TIPOS_DOCUMENTO)[number])
  ) {
    return {
      ok: false,
      mensaje: "El archivo tiene que ser un PDF o una imagen.",
    };
  }
  if (archivo.size > TAMANO_MAXIMO_DOCUMENTO) {
    return { ok: false, mensaje: "El archivo pesa demasiado. Máximo 10 MB." };
  }

  const limpia = carpeta.replace(/[^a-z0-9/-]/gi, "").replace(/^\/+|\/+$/g, "");
  const extension =
    archivo.type === "application/pdf" ? "pdf" : extensionDe(archivo.type);
  const clave = `${limpia}/${nanoid()}.${extension}`;

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
