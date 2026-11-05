/**
 * EL IVA DE ESPAÑA (5 nov 2026, Fase 5).
 *
 * En España el precio que ve el consumidor ya lleva el IVA dentro (TRLGDCU
 * art. 97.1.e), así que aquí no se SUMA nada: se DESGLOSA, igual que el IVA de
 * Chile, para que el pedido y la factura digan cuánto del total es impuesto.
 * Ver `docs/paises/ESPANA-IMPUESTOS-Y-LEGAL.md`, sección 2.1.
 *
 * Tipo general del 21 % (Ley 37/1992, art. 90). Hay productos con tipo
 * reducido (art. 91: 10 % y 4 %); cuando un comercio venda alguno, el tipo por
 * producto lo confirma el contador y se agrega aquí. Pieza aparte de la de
 * Chile a propósito: la de Chile trae un tope de bajo valor que en España no
 * existe.
 */
export const IVA_GENERAL_ES_PB = 2100;

/** Neto e IVA de un total con el IVA dentro; las dos partes suman el total. */
export function ivaIncluidoEnEspana(
  bruto: number,
  puntosBase: number = IVA_GENERAL_ES_PB,
): { neto: number; impuesto: number } {
  const neto = Math.round((bruto * 10_000) / (10_000 + puntosBase));
  return { neto, impuesto: bruto - neto };
}
