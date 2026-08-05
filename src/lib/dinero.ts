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
 * EL PRECIO QUE SE PUBLICA: el del proveedor, más lo que hay que cubrir.
 *
 * El precio publicado tiene que aguantar DOS cosas y aún dejarle al proveedor
 * su precio completo:
 *
 *   1. Lo que se lleva el procesador de tarjeta: 2.9% + $0.30 (tarifa
 *      estándar de Stripe en Estados Unidos, comprobada el 5 ago 2026).
 *   2. El margen de Mercatren: 2% del precio de venta, que es como se calcula
 *      en la venta (ver COMISION_TARJETA_PB y el webhook de Stripe). Si la
 *      fórmula no lo incluyera, el margen saldría del bolsillo del proveedor.
 *
 * LA CUENTA ES HACIA ATRÁS, no hacia adelante. No es "precio + 4.9%": es
 * encontrar el publicado V tal que, después de quitarle todo, quede el precio
 * del proveedor completo:
 *
 *   V − 2.9%·V − $0.30 − 2%·V = base
 *   V · (1 − 0.029 − 0.02) = base + 0.30
 *   V = (base + $0.30) / 0.951
 *
 * Sumar los porcentajes hacia adelante deja corto: en $100, publicar $104.90
 * hace que el procesador cobre sobre 104.90 y falten centavos. Siempre faltan.
 *
 * Se redondea HACIA ARRIBA al centavo: el centavo de diferencia queda de
 * colchón a favor, nunca en contra.
 *
 * Todo entero: (base + 30) * 10000 / 9510, techo. Sin coma flotante, que
 * pierde centavos (932.76 * 100 = 93275.99999999999).
 *
 * OJO — EL AJUSTE SE APLICA UNA SOLA VEZ, SOBRE LA BASE. Aplicarlo sobre un
 * precio que ya lo tiene infla el precio en cada guardado: 500 → 525 → 552…
 * Pasó de verdad el 5 ago 2026 (un producto llegó a 595 partiendo de 500)
 * porque el formulario no recibía la base y caía en el precio publicado.
 * Por eso existe `baseDesdePublicado`: para volver atrás sin adivinar.
 */
export function precioConAjusteCentavos(baseCentavos: number): number {
  if (baseCentavos <= 0) return 0;
  return Math.ceil(
    ((baseCentavos + PROCESADOR_FIJO_CENTAVOS) * 10_000) /
      (10_000 - PROCESADOR_PORCENTAJE_PB - COMISION_TARJETA_PB),
  );
}

/**
 * EL CAMINO DE VUELTA: del precio publicado al precio del proveedor.
 *
 * Hace falta para rellenar el formulario cuando no se guardó la base —los
 * productos viejos y los que llegaron por sincronización— sin tener que
 * adivinar. Es la fórmula al revés, redondeada hacia abajo para que al
 * volver a aplicar el ajuste se llegue al MISMO publicado y el precio deje
 * de moverse. Está comprobado en las pruebas: ida y vuelta es estable.
 */
export function baseDesdePublicado(publicadoCentavos: number): number {
  if (publicadoCentavos <= 0) return 0;
  const base =
    Math.floor(
      (publicadoCentavos *
        (10_000 - PROCESADOR_PORCENTAJE_PB - COMISION_TARJETA_PB)) /
        10_000,
    ) - PROCESADOR_FIJO_CENTAVOS;
  return Math.max(0, base);
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
