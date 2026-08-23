/**
 * EL RASTRO DE NAVEGACIÓN: qué página se vio antes que esta, dentro del sitio.
 *
 * Existe por una trampa concreta: dentro del sitio Next navega SIN recargar la
 * página, y en esas navegaciones `document.referrer` NO se actualiza — se queda
 * con el de la primera carga (vacío si se entró por un enlace directo). Así que
 * una flecha «← Volver» que mire solo el referrer nunca sabe que la persona
 * venía de la tienda o de una búsqueda.
 *
 * Se anota en `sessionStorage` (vive por pestaña y muere con ella: no hay
 * nada que limpiar, y dos pestañas no se pisan) la página actual y la
 * anterior. Son rutas del propio sitio, sin datos de nadie.
 *
 * Las funciones reciben el almacén como parámetro para poder probarlas sin
 * navegador; el componente `RastroDeNavegacion` les pasa `sessionStorage`.
 */
export const LLAVE_RASTRO = "mercatren-rastro";

export type AlmacenMinimo = Pick<Storage, "getItem" | "setItem">;

type Rastro = { actual: string; anterior: string | null };

function leer(almacen: AlmacenMinimo): Rastro | null {
  try {
    const crudo = almacen.getItem(LLAVE_RASTRO);
    if (!crudo) return null;
    const r = JSON.parse(crudo) as Partial<Rastro>;
    if (typeof r.actual !== "string") return null;
    return {
      actual: r.actual,
      anterior: typeof r.anterior === "string" ? r.anterior : null,
    };
  } catch {
    return null;
  }
}

/** Se llama en cada cambio de ruta. Repetir la misma ruta no mueve nada. */
export function anotarRuta(almacen: AlmacenMinimo, ruta: string): void {
  const r = leer(almacen);
  if (r?.actual === ruta) return;
  try {
    almacen.setItem(
      LLAVE_RASTRO,
      JSON.stringify({
        actual: ruta,
        anterior: r?.actual ?? null,
      } satisfies Rastro),
    );
  } catch {
    /* Sin almacén (modo privado estricto) la flecha cae al referrer. */
  }
}

/**
 * La página anterior a `rutaActual`, si se conoce.
 *
 * Sirve igual ANTES y DESPUÉS de que el rastro haya anotado la página actual:
 * si lo anotado como «actual» ya es esta ruta, la anterior es `anterior`; si
 * todavía es la página de donde se vino (el efecto que anota corre después
 * del primer dibujo), esa es la anterior.
 */
export function rutaAnteriorA(
  almacen: AlmacenMinimo,
  rutaActual: string,
): string | null {
  const r = leer(almacen);
  if (!r) return null;
  if (r.actual === rutaActual) return r.anterior;
  return r.actual;
}
