/**
 * EL NOMBRE DE UNA FOTO NUEVA, COMO LO PIDE GOOGLE (6 sep 2026).
 *
 * Google, en su guía de imágenes para buscadores: «usa nombres de archivo
 * cortos pero descriptivos» — `my-new-black-kitten.jpg` es mejor que
 * `IMG00023.JPG` — y aclara que el nombre da «pistas muy ligeras»: lo que
 * pesa es el texto alternativo y el contexto de la página. Se hace igual,
 * porque cuesta nada y porque lo que se descarga de una ficha tiene que decir
 * qué es. El dueño bajó las cuatro fotos del POS y eran `ySbdthKtli-….webp`.
 *
 * Solo vale para lo NUEVO. Lo ya subido (54.000 fotos con caché de un año y
 * ya indexadas) se queda como está: renombrarlo serían 54.000 redirecciones
 * a cambio de una pista muy ligera.
 *
 * Es puro a propósito: se prueba sin bucket y lo usan el formulario y el
 * copiador de fotos de CJ, que son dos caminos distintos al mismo bucket.
 */

/** Google pide «corto». Sesenta caracteres de base, sin contar el sufijo. */
export const LARGO_MAXIMO_BASE = 60;

/** Un texto alternativo largo lo cortan los lectores de pantalla y Google lo
 *  trata como relleno. Ciento veinticinco es el tope habitual. */
export const LARGO_MAXIMO_ALT = 125;

function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** `punto-de-venta-pos-2-1-x8k2q1`: el slug del producto, el número de la
 *  foto dentro del producto, y un sufijo corto para que dos subidas del mismo
 *  producto nunca choquen ni pisen la caché de un año. Sin la extensión: la
 *  pone quien sabe el tipo del archivo. */
export function nombreDeFoto(entrada: {
  slug: string | null | undefined;
  numero: number;
  sufijo: string;
}): string {
  let base = sinAcentos(entrada.slug ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!base) base = "producto";
  if (base.length > LARGO_MAXIMO_BASE) {
    const corte = base.lastIndexOf("-", LARGO_MAXIMO_BASE);
    base = base.slice(0, corte > 0 ? corte : LARGO_MAXIMO_BASE);
  }
  const numero = Number.isFinite(entrada.numero)
    ? Math.max(1, Math.floor(entrada.numero))
    : 1;
  const sufijo =
    sinAcentos(entrada.sufijo)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "0";
  return `${base}-${numero}-${sufijo}`;
}

/** Lo que escribió el comercio, limpio: espacios de más fuera, tope de
 *  largo, y vacío se guarda como nulo (la galería cae al título). */
export function limpiarTextoAlt(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.replace(/\s+/g, " ").trim();
  if (!limpio) return null;
  return limpio.length > LARGO_MAXIMO_ALT
    ? limpio.slice(0, LARGO_MAXIMO_ALT).trim()
    : limpio;
}
