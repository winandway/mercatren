/**
 * Reglas de dinero de Mercatren.
 *
 * REGLA DURA: el dinero se guarda y se calcula SIEMPRE en centavos enteros.
 * Nunca en decimales. Los decimales de coma flotante pierden centavos y en un
 * mercado con miles de pedidos eso se convierte en plata que no cuadra.
 */

export type Idioma = "es" | "en";

/** Convierte centavos a texto de precio para mostrar en pantalla. */
export function formatearPrecio(
  centavos: number,
  idioma: Idioma = "es",
  moneda = "USD",
) {
  return new Intl.NumberFormat(idioma === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: moneda,
  }).format(centavos / 100);
}

/**
 * Cuanto se queda Mercatren de una venta.
 * La comision va en puntos base para no usar decimales: 1000 = 10%.
 */
export function calcularComisionCentavos(
  subtotalCentavos: number,
  comisionPuntosBase: number,
) {
  return Math.round((subtotalCentavos * comisionPuntosBase) / 10_000);
}

/** Lo que le queda al vendedor despues de la comision. */
export function calcularNetoVendedorCentavos(
  subtotalCentavos: number,
  comisionPuntosBase: number,
) {
  return (
    subtotalCentavos -
    calcularComisionCentavos(subtotalCentavos, comisionPuntosBase)
  );
}
