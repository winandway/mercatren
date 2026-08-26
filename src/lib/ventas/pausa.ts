/**
 * LA PAUSA DE LAS VENTAS DE ESTADOS UNIDOS — LEVANTADA EL 26 AGO 2026.
 *
 * ══ QUÉ PASÓ ══
 *
 * Se puso el 15 ago 2026 por un motivo concreto y correcto: el catálogo de
 * Estados Unidos estaba publicado pero **no se podía despachar** — la billetera
 * del proveedor estaba en cero y la pieza que le manda la orden no existía. Un
 * comprador que pagara ese día se quedaba con el cobro hecho y sin mercancía, y
 * eso no es un error de programación: es un contracargo y un cliente perdido.
 *
 * Las dos cosas que faltaban ya están:
 *
 * 1. **El pedido al proveedor se crea solo** (16 ago 2026, `src/lib/cj/pedidos.ts`):
 *    entra la venta, se abre el pedido en CJ con la dirección del comprador y
 *    queda el botón de pagarlo con tarjeta. Probado de punta a punta con la
 *    MT-000004, incluido el arreglo del `variantSku` del 18 ago.
 * 2. **El dinero llegó a Payoneer** para cargar la cuenta de CJ (26 ago 2026,
 *    confirmado por el dueño).
 *
 * ══ CÓMO SE VUELVE A PONER ══
 *
 * `EN_PAUSA = true` y un push. Toda la mecánica se queda montada a propósito:
 * el día que el proveedor falle, que se agote un almacén o que haya que parar
 * una plaza, la tienda se cierra en un minuto **sin apagar las fichas** — que
 * es lo que tiraría a la basura el posicionamiento que ya está corriendo.
 *
 * Sigue siendo constante y no variable de entorno: cerrar o abrir la venta de
 * un país es una decisión que pasa por una publicación mirada, no por alguien
 * tocando un panel a las dos de la mañana.
 *
 * ══ QUÉ PAUSA Y QUÉ NO, CUANDO ESTÁ PUESTA ══
 *
 * **Solo la COMPRA, y solo de los productos de Estados Unidos.** El catálogo se
 * sigue viendo, se busca, se navega y Google lo sigue leyendo.
 *
 * Venezuela **no se toca nunca**. Ahí hay comercios reales despachando de
 * verdad, y su venta no tiene por qué pagar por una prueba que es nuestra.
 */

/** Mientras esté en `true`, los productos de Estados Unidos no se venden. */
export const EN_PAUSA = false;

/** El país cuyas ventas se detienen al encender la pausa. */
export const PAIS_EN_PAUSA = "US";

/**
 * ¿Se puede comprar este producto?
 *
 * Recibe el país de la tienda, no el producto entero: así la misma función
 * sirve en el servidor —donde se conoce la fila de `tiendas`— y en la ficha,
 * donde solo viaja el país. Puro, para poder probarlo sin base de datos.
 *
 * ══ EL EQUIPO SÍ PUEDE COMPRAR ══
 *
 * Y no es un privilegio: es la ÚNICA forma de probar el circuito completo
 * —venta, pedido al proveedor, pago con tarjeta, entrega— sin abrirle la
 * tienda al público antes de saber que se puede despachar. La alternativa era
 * quitar la pausa unas horas y cruzar los dedos para que nadie comprara.
 *
 * Se pasa explícito y por defecto es `false`: si algún día alguien olvida
 * pasarlo, el candado se queda puesto. Al revés —abrir por defecto y cerrar a
 * mano— el olvido abre la venta, que es el fallo caro.
 */
export function ventaPausada(
  paisOrigen: string | null | undefined,
  opciones?: { esEquipoInterno?: boolean },
): boolean {
  if (!EN_PAUSA) return false;
  if (opciones?.esEquipoInterno === true) return false;
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
  opciones?: { esEquipoInterno?: boolean },
): boolean {
  return paises.some((p) => ventaPausada(p, opciones));
}
