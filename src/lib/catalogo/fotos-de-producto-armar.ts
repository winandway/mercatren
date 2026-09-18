/**
 * LA FOTO DE TURNO, ELEGIDA EN CÓDIGO (emergencia de costo, 18 sep 2026).
 *
 * Antes la elegía SQL con funciones de ventana por cada fila de cada
 * listado. Ahora la lista de fotos sanas de cada producto viene guardada
 * (`fotos_de_producto`) y aquí se elige cuál toca, con la misma regla de
 * siempre: rota con la semilla, así que las tarjetas no clavan la primera
 * foto (pedido del dueño, 23 ago 2026). Puro: se prueba sin base.
 */

export type FotoGuardada = {
  url: string | null;
  clave: string | null;
  altEs: string | null;
  altEn: string | null;
};

/** Cuántas fotos se guardan por producto. Más no aportan a una tarjeta. */
export const FOTOS_GUARDADAS_MAXIMO = 12;

/**
 * La misma elección que hacía el SQL: `ORDER BY (fila + semilla) % total`
 * con la fila contada desde 1. La que cae en cero es la elegida.
 */
export function elegirFoto(
  fotos: readonly FotoGuardada[] | null | undefined,
  semilla: number,
): FotoGuardada | null {
  if (!fotos || fotos.length === 0) return null;
  const total = fotos.length;
  const s = Math.trunc(Math.abs(semilla)) || 0;
  let fila = (total - (s % total)) % total;
  if (fila === 0) fila = total;
  return fotos[fila - 1] ?? null;
}

export type ImagenCruda = {
  productoId: string;
  url: string | null;
  clave: string | null;
  textoAltEs: string | null;
  textoAltEn: string | null;
};

/**
 * Agrupa las imágenes (ya ordenadas por producto, orden y rowid, y ya sin
 * las rotas) en la lista guardable de cada producto.
 */
export function agruparFotos(
  imagenes: readonly ImagenCruda[],
): Map<string, FotoGuardada[]> {
  const porProducto = new Map<string, FotoGuardada[]>();
  for (const i of imagenes) {
    if (!i.url && !i.clave) continue;
    const lista = porProducto.get(i.productoId) ?? [];
    if (lista.length >= FOTOS_GUARDADAS_MAXIMO) continue;
    lista.push({
      url: i.url,
      clave: i.clave,
      altEs: i.textoAltEs,
      altEn: i.textoAltEn,
    });
    porProducto.set(i.productoId, lista);
  }
  return porProducto;
}

/** Lee la columna JSON sin dejar que una fila rara tumbe el listado. */
export function leerFotosGuardadas(
  crudo: string | null | undefined,
): FotoGuardada[] {
  if (!crudo) return [];
  try {
    const v = JSON.parse(crudo) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (f): f is FotoGuardada =>
          typeof f === "object" && f !== null && ("url" in f || "clave" in f),
      )
      .map((f) => ({
        url: typeof f.url === "string" ? f.url : null,
        clave: typeof f.clave === "string" ? f.clave : null,
        altEs: typeof f.altEs === "string" ? f.altEs : null,
        altEn: typeof f.altEn === "string" ? f.altEn : null,
      }));
  } catch {
    return [];
  }
}
