/**
 * EL CONCEPTO QUE EL COMPRADOR ESCRIBE EN SU ZELLE.
 *
 * ══ POR QUÉ ESTO IMPORTA TANTO (12 ago 2026) ══
 *
 * Zelle no manda un cobro: manda una transferencia suelta con una nota. Del
 * lado de aquí llega dinero de un banco cualquiera, a nombre de una persona que
 * muchas veces **no es la que compró** (paga el hijo, el socio, un amigo en
 * Estados Unidos). Sin el número de factura en la nota, quien valida tiene
 * delante un monto y un nombre que no cuadra con ningún pedido, y solo puede
 * adivinar.
 *
 * Hasta hoy esto se le pedía al comprador en una línea gris de once píxeles al
 * final de la pantalla. Nadie la lee.
 *
 * ══ VA LA MARCA Y EL NÚMERO, NO SOLO EL NÚMERO ══
 *
 * `Mercatren MT-000002`, no `MT-000002` a secas. Dos razones:
 *
 *  1. En el extracto del comprador, semanas después, «MT-000002» no le dice
 *     nada y llama al banco a preguntar qué es ese cargo — que es el primer
 *     paso de un contracargo. Con el nombre delante lo reconoce.
 *  2. Es exactamente lo que ya hace Stripe con el descriptor de la tarjeta, así
 *     que el comprador ve lo mismo pague como pague.
 *
 * ══ LA NOTA DE ZELLE ES CORTA ══
 *
 * Los bancos rondan los 140 caracteres y algunos se quedan mucho más abajo.
 * `Mercatren MT-000002` son 19: entra en todos con sitio de sobra. Por eso el
 * concepto **no** lleva el nombre del comprador ni el del producto, por mucho
 * que ayudaría: lo que se corta a la mitad no sirve para buscar nada.
 */

/** El nombre que ve el comprador, aquí y en el descriptor de la tarjeta. */
export const MARCA_CONCEPTO = "Mercatren";

/**
 * Lo que hay que escribir en la nota de la transferencia.
 *
 * Sin número de pedido devuelve `null` y **no se inventa nada**: una pantalla
 * que enseña un concepto a medias es peor que una que no enseña ninguno,
 * porque el comprador lo copia igual y el pago queda sin identificar.
 */
export function conceptoDelPago(numeroPedido: string | null | undefined) {
  const numero = (numeroPedido ?? "").trim();
  if (!numero) return null;

  /* Si ya viene con la marca delante, no se repite: `Mercatren Mercatren
     MT-000002` es justo el tipo de cosa que el comprador copia tal cual. */
  if (numero.toLowerCase().startsWith(MARCA_CONCEPTO.toLowerCase())) {
    return numero.replace(/\s+/g, " ");
  }

  return `${MARCA_CONCEPTO} ${numero.replace(/\s+/g, " ")}`;
}
