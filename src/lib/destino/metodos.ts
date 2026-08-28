import type { Destino } from "@/lib/destino/reglas";

/**
 * QUÉ MÉTODOS DE PAGO SE LE OFRECEN A CADA DESTINO (28 ago 2026).
 *
 * Decisión del dueño, con sus palabras: «Mercatren de Chile no usa Zelle.
 * Va a ser pura tarjeta y ya está. Mercatren de Colombia también: solo
 * tarjeta.» Y tiene toda la razón operativa: Zelle es una red entre bancos
 * de ESTADOS UNIDOS — un comprador chileno o colombiano no la tiene, no la
 * conoce y no puede pagar por ahí.
 *
 * ══ SE FILTRA, NO SE DESHABILITA ══
 *
 * Antes el checkout dibujaba «Zelle» en gris para un pedido chileno. Para
 * Venezuela con monto bajo el gris es correcto (la opción existe, hoy no le
 * toca); para un chileno es ruido de otro país: no sabe qué es Zelle y verlo
 * ahí hace dudar de si le falta algo. Lo que no existe en su país **no se
 * dibuja**.
 *
 * ══ POR QUÉ ES UNA TABLA PURA Y NO UN `if` EN EL FORMULARIO ══
 *
 * La misma regla de `direccion.ts` y de las plazas: la decisión escrita UNA
 * vez, probada sola, y el próximo país la hereda. El candado de verdad sigue
 * en el SERVIDOR (`crearPedido` rechaza Zelle fuera de VE/US): esto es la
 * pantalla contando la misma historia.
 */

export type MetodoOfrecible = "stripe" | "zelle" | "billetera";

/** Los destinos donde Zelle existe: la casa (compradores en EE. UU. pagando
    mercancía que se retira en Venezuela) y EE. UU. mismo. */
const CON_ZELLE: ReadonlySet<Destino> = new Set(["VE", "US"] as Destino[]);

/**
 * Los métodos que el checkout puede ofrecer para un destino, en el orden en
 * que se dibujan. Fuera de VE/US la respuesta es UNA: tarjeta.
 */
export function metodosDelDestino(destino: Destino): MetodoOfrecible[] {
  if (!CON_ZELLE.has(destino)) return ["stripe"];
  return ["stripe", "zelle", "billetera"];
}
