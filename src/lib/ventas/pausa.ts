/**
 * LA PAUSA DE LAS VENTAS DE ESTADOS UNIDOS.
 *
 * ══ POR QUÉ EXISTE ══
 *
 * El catálogo de Estados Unidos está publicado y se puede navegar, pero
 * **todavía no se puede despachar**: la billetera del proveedor está en cero y
 * la pieza que le manda la orden no está construida. Un comprador que pagara
 * hoy se quedaría con el cobro hecho y sin mercancía — y eso no es un error de
 * programación, es un contracargo y un cliente perdido.
 *
 * Decisión del dueño el 15 ago 2026, y es la correcta: **antes de vender lo que
 * no se puede entregar, se pone el cartel de mantenimiento.** Primero se prueba
 * el proveedor con compras propias, se mide cuánto tarda, cómo llega y qué
 * papel trae dentro de la caja; después se abre la venta.
 *
 * ══ QUÉ SE PAUSA Y QUÉ NO ══
 *
 * **Solo la COMPRA, y solo de los productos de Estados Unidos.** El catálogo se
 * sigue viendo, se busca, se navega y Google lo sigue leyendo: apagar las
 * fichas tiraría a la basura el trabajo de posicionamiento que ya está
 * corriendo, y volver a levantarlas después cuesta semanas de indexación.
 *
 * Venezuela **no se toca**. Ahí hay comercios reales despachando de verdad, y
 * su venta no tiene por qué pagar por una prueba que es nuestra.
 *
 * ══ CÓMO SE QUITA ══
 *
 * Una línea: `EN_PAUSA = false`, y un push. Va como constante y no como
 * variable de entorno a propósito — el día que se levante hay que probar que
 * de verdad se puede despachar, y eso pasa por una publicación mirada, no por
 * alguien tocando un panel a las dos de la mañana.
 */

/** Mientras esté en `true`, los productos de Estados Unidos no se venden. */
export const EN_PAUSA = true;

/** El país cuyas ventas están detenidas. */
export const PAIS_EN_PAUSA = "US";

/**
 * ¿Se puede comprar este producto?
 *
 * Recibe el país de la tienda, no el producto entero: así la misma función
 * sirve en el servidor —donde se conoce la fila de `tiendas`— y en la ficha,
 * donde solo viaja el país. Puro, para poder probarlo sin base de datos.
 */
export function ventaPausada(paisOrigen: string | null | undefined): boolean {
  if (!EN_PAUSA) return false;
  /* Se compara en mayúsculas y sin espacios: el país entra a mano en el panel
     y un « us » con espacio dejaría la venta abierta justo donde no debe. */
  return (paisOrigen ?? "").trim().toUpperCase() === PAIS_EN_PAUSA;
}

/**
 * ¿Hay algo pausado en este carrito?
 *
 * Un carrito puede mezclar productos de los dos países. Basta UNO pausado para
 * que el pedido no se pueda crear: despachar la mitad y cobrar el total sería
 * peor que no vender nada.
 */
export function carritoPausado(
  paises: Array<string | null | undefined>,
): boolean {
  return paises.some((p) => ventaPausada(p));
}
