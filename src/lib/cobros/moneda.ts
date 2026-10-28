/**
 * ¿EN QUÉ MONEDAS SE PUEDE COBRAR POR ENLACE? Hoy, solo en dólares.
 *
 * ══ POR QUÉ (27 oct 2026) ══
 *
 * El cobro por enlace nace en USD —la moneda va fija al crearlo y al pedirle
 * el pago a Stripe— y su neto se suma a la billetera del comercio. La
 * billetera habla la moneda del PAÍS de la tienda: en una tienda de España,
 * cien dólares cobrados por enlace se leerían como cien euros.
 *
 * Mientras el enlace no cobre en la moneda de la tienda (y no se pruebe con
 * un pago real, como manda `VERIFICAR-PAGOS.md`), en esas tiendas no se
 * crea: lo frenan el panel y la puerta de los sistemas de los comercios.
 */
export function cobroPorEnlaceAdmite(moneda: string | null | undefined) {
  return (moneda ?? "USD").trim().toUpperCase() === "USD";
}
