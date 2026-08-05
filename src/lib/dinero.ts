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

/* -------------------------------------------------------------------------- */
/* El ajuste por procesamiento (el "robotito" de los precios)                 */
/* -------------------------------------------------------------------------- */

/**
 * Lo que cobra el procesador de tarjetas por transacción: 2.9% + $0.30.
 * En puntos base y centavos, como todo el dinero de este proyecto.
 */
export const PROCESADOR_PORCENTAJE_PB = 290;
export const PROCESADOR_FIJO_CENTAVOS = 30;

/**
 * EL PRECIO QUE SE PUBLICA: el del comercio más el ajuste por procesamiento.
 *
 * Decisión del 4 ago 2026. El fee de la tarjeta no se le recarga al cliente
 * en el checkout (se ve feo y los recargos por tarjeta están penados en
 * varios estados): va INCORPORADO en el precio de la etiqueta. El comercio
 * escribe SU precio y el sistema publica el precio con el ajuste; el cliente
 * ve un solo número y paga exactamente ese.
 *
 * LA CUENTA ES HACIA ATRÁS, no hacia adelante. No es "precio + 2.9%": es
 * encontrar el publicado V tal que, después de que el procesador cobre su
 * 2.9% de V y sus 30 centavos, quede el precio del comercio completo:
 *
 *   V − 2.9%·V − $0.30 = base   →   V = (base + $0.30) / 0.971
 *
 * Sumar el 2.9% hacia adelante deja corto: en $100, publicar $103.20 hace
 * que el procesador cobre sobre 103.20 y falten centavos. Siempre faltan.
 *
 * Se redondea HACIA ARRIBA al centavo: el centavo de diferencia queda de
 * colchón a favor, nunca en contra.
 *
 * Todo entero: (base + 30) * 1000 / 971, techo. Sin coma flotante, que
 * pierde centavos (932.76 * 100 = 93275.99999999999).
 */
export function precioConAjusteCentavos(baseCentavos: number): number {
  if (baseCentavos <= 0) return 0;
  return Math.ceil(
    ((baseCentavos + PROCESADOR_FIJO_CENTAVOS) * 10_000) /
      (10_000 - PROCESADOR_PORCENTAJE_PB),
  );
}

/** El ajuste solo, para enseñárselo al comercio: "tu precio + $0.61". */
export function ajusteCentavos(baseCentavos: number): number {
  if (baseCentavos <= 0) return 0;
  return precioConAjusteCentavos(baseCentavos) - baseCentavos;
}

/**
 * LA COMISIÓN POR MÉTODO (decisión del 4 ago 2026).
 *
 * La tarjeta es el método protagonista y lleva la comisión más baja: 2%.
 * Zelle queda para montos grandes — desde $200 — y mantiene su 3% de siempre
 * (ese vive en `tiendas.comisionPuntosBase`).
 */
export const COMISION_TARJETA_PB = 200;
export const ZELLE_MINIMO_CENTAVOS = 20_000;
