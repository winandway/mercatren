/**
 * EL CÓDIGO QUE SE LE ENSEÑA AL COMPRADOR.
 *
 * ══ POR QUÉ NO SE PUEDE ENSEÑAR EL DE CJ TAL CUAL ══
 *
 * Los códigos del proveedor empiezan por sus siglas: `CJCS2493466`,
 * `CJZX2689829`. Puestos en la ficha, cualquiera los busca y llega al mismo
 * producto en el catálogo del mayorista — con nuestro margen a la vista y
 * nuestra tienda convertida en un intermediario evidente.
 *
 * No es un secreto vergonzoso: compramos y revendemos, y eso está escrito en
 * los términos. Pero enseñar el código del proveedor en la ficha es regalarle
 * al comprador el camino para saltárnosla, y ninguna tienda del mundo lo hace.
 *
 * ══ EL CÓDIGO SIGUE SIRVIENDO PARA LO QUE HACE FALTA ══
 *
 * Se mantienen los números, que son los que identifican el producto: con dos
 * artículos casi iguales, el código es lo que permite decir «el tal» y que
 * todos miren el mismo. Solo se cambia el prefijo por el nuestro.
 *
 *   CJCS2493466  →  MT-2493466
 *
 * ══ EL ORIGINAL NO SE BORRA ══
 *
 * En la base sigue guardado entero (`productos.sku`), porque el día que haya
 * que reclamarle algo a CJ **el código que ellos entienden es el suyo**. Esto
 * solo cambia lo que se dibuja en pantalla.
 */

/** Cómo se marcan los códigos de Mercatren. */
export const PREFIJO_MERCATREN = "MT-";

/**
 * El código como se enseña al público.
 *
 * Se quitan las letras del principio —las siglas del proveedor— y se deja lo
 * que identifica de verdad. Si el código no empieza por letras, se devuelve
 * como está: los de los comercios venezolanos son suyos y no se tocan.
 *
 * ══ EL 28 AGO 2026 SE CERRÓ PARA TODAS LAS PLAZAS ══
 *
 * Comparaba contra «US» a secas, así que la ficha chilena enseñaba
 * `CJFU2936798` crudo — lo encontró el dueño en mercatren.cl. La regla de
 * verdad es la de siempre: **lo que viene del proveedor se disfraza; lo de un
 * comercio venezolano es suyo y no se toca**. Y en Chile y Colombia el código
 * lleva su país (`MT-CL-2936798`): con tres vitrinas, un código sin país no
 * dice de cuál catálogo es. El de EE. UU. se queda `MT-2493466`, que es el
 * formato ya publicado e indexado — cambiárselo ahora sería churn sin ganancia.
 */
export function codigoVisible(
  sku: string | null | undefined,
  paisOrigen?: string | null,
): string | null {
  const limpio = (sku ?? "").trim();
  if (!limpio) return null;

  const pais = (paisOrigen ?? "").trim().toUpperCase();
  const esDeProveedor = pais === "US" || pais === "CL" || pais === "CO";

  /* El código de un comercio venezolano es SUYO: cambiárselo le rompería la
     referencia que usa en su propio sistema. */
  if (paisOrigen !== undefined && !esDeProveedor) {
    return limpio;
  }

  /* Ya lleva nuestro prefijo: no se le pone dos veces. */
  if (limpio.toUpperCase().startsWith(PREFIJO_MERCATREN)) return limpio;

  const soloNumeros = limpio.replace(/^[^0-9]+/, "");

  /* Un código sin un solo número no se puede recortar sin dejarlo vacío: se
     devuelve entero. Mejor un código feo que ninguno. */
  if (!soloNumeros) return limpio;

  const marcaPais = pais === "CL" || pais === "CO" ? `${pais}-` : "";
  return `${PREFIJO_MERCATREN}${marcaPais}${soloNumeros}`;
}
