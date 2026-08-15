import {
  COMISION_US_PB,
  PROCESADOR_FIJO_CENTAVOS,
  PROCESADOR_PORCENTAJE_PB,
} from "@/lib/dinero";

/**
 * EL PRECIO DE UN PRODUCTO DE ESTADOS UNIDOS.
 *
 * ══ EL ENVÍO VA GRATIS, CON SU COSTO DENTRO DEL PRECIO ══
 *
 * Decisión del dueño el 15 ago 2026. Un comprador estadounidense lo espera
 * —Amazon lo acostumbró— y en Google Merchant Center «envío gratis» es una
 * etiqueta visible que sube la conversión.
 *
 * «Gratis» no significa que no cueste: significa que **el costo va dentro del
 * precio publicado**, exactamente igual que el margen de Mercatren y la tarifa
 * de Stripe. Lo que el comprador ve es lo que paga, y no hay una sorpresa en el
 * último paso del checkout — que es donde se abandona una compra.
 *
 * ══ LA CUENTA ══
 *
 * Sobre lo que de verdad cuesta poner el producto en la puerta del comprador
 * —el producto MÁS su envío— se aplica la misma fórmula que ya rige para
 * Venezuela:
 *
 *   costo = producto + envío            (los dos los cobra CJ)
 *   V − 2.9%·V − $0.30 − 30%·V = costo
 *   V = (costo + $0.30) / 0.671
 *
 * ══ EL MARGEN AQUÍ ES 30 %, NO EL 3 % DE VENEZUELA ══
 *
 * Y no es un capricho: son dos negocios distintos. Allá el comercio pone la
 * mercancía y responde por ella; aquí **compramos, despachamos y asumimos la
 * devolución y el contracargo**. Eso es venta al por menor, no comisión de
 * mercado.
 *
 * Comprobado contra el mercado el 15 ago 2026: el estándar del dropshipping es
 * 15–30 % neto. Con el 3 %, un producto de $30 de costo dejaba 97 centavos y un
 * solo contracargo se comía treinta ventas.
 *
 * La constante vive en `dinero.ts` (`COMISION_US_PB`) junto a las otras, para
 * que las tres se miren de un vistazo y no se desincronicen — ya pasó en agosto
 * con las de Venezuela.
 *
 * ══ POR QUÉ NO SE COBRA EL ENVÍO APARTE ══
 *
 * Se puede, y para el comprador daría casi lo mismo. Pero Merchant Center
 * compara lo que se declara con lo que ve en la ficha: dos números que tienen
 * que cuadrar siempre, en 300 productos, cada vez que CJ cambie una tarifa.
 * Con el envío dentro hay un solo número que cuadrar.
 */

/** Lo que se descuenta del precio publicado, en puntos base sobre el total. */
const DESCUENTOS_PB = PROCESADOR_PORCENTAJE_PB + COMISION_US_PB;

/**
 * De lo que cuesta poner el producto en la puerta, al precio que se publica.
 *
 * Los dos costos llegan en centavos enteros y se suman antes de aplicar la
 * fórmula: aplicarla por separado y sumar después dejaría el fijo de $0.30 dos
 * veces, y el comprador pagaría un cargo que no existe.
 */
export function precioPublicadoUs(
  costoProductoCentavos: number,
  costoEnvioCentavos: number,
): number {
  const costo =
    Math.max(0, costoProductoCentavos) + Math.max(0, costoEnvioCentavos);
  if (costo === 0) return 0;

  /* Techo, nunca redondeo hacia abajo: un centavo de menos sale del margen en
     cada venta, y en 300 productos eso no se ve en ninguna pantalla. */
  return Math.ceil(
    ((costo + PROCESADOR_FIJO_CENTAVOS) * 10_000) / (10_000 - DESCUENTOS_PB),
  );
}

/**
 * El desglose, para poder enseñarlo en el panel al elegir los productos.
 *
 * Sin esto, decidir si un producto conviene es a ojo. Con esto se ve cuánto
 * queda de verdad después de que CJ, Stripe y el envío cobren lo suyo.
 */
export type DesgloseUs = {
  publicadoCentavos: number;
  costoProductoCentavos: number;
  costoEnvioCentavos: number;
  /** Lo que se lleva Stripe: 2.9 % del publicado + $0.30. */
  procesadorCentavos: number;
  /** Lo que queda para Mercatren. */
  margenCentavos: number;
};

export function desglosarUs(
  costoProductoCentavos: number,
  costoEnvioCentavos: number,
): DesgloseUs {
  const publicado = precioPublicadoUs(
    costoProductoCentavos,
    costoEnvioCentavos,
  );

  const procesador =
    Math.round((publicado * PROCESADOR_PORCENTAJE_PB) / 10_000) +
    PROCESADOR_FIJO_CENTAVOS;

  /* El margen es lo que sobra, NO un porcentaje calculado aparte. Así los
     cuatro renglones suman siempre el publicado exacto: un centavo que no
     cuadra en una pantalla de dinero rompe la confianza en todo lo demás. */
  const margen =
    publicado -
    procesador -
    Math.max(0, costoProductoCentavos) -
    Math.max(0, costoEnvioCentavos);

  return {
    publicadoCentavos: publicado,
    costoProductoCentavos: Math.max(0, costoProductoCentavos),
    costoEnvioCentavos: Math.max(0, costoEnvioCentavos),
    procesadorCentavos: procesador,
    margenCentavos: margen,
  };
}

/**
 * ¿Este producto deja suficiente para valer la pena?
 *
 * Con el 30 %, un producto de $30 de costo deja unos $13. Pero el fijo de $0.30
 * de Stripe sigue pesando en los baratos: en uno de $2, el 30 % son 90 centavos
 * y el fijo se lleva un tercio.
 *
 * **Dos dólares** es la línea. No es «lo que conviene» —conviene bastante más—:
 * es el punto por debajo del cual una sola devolución convierte el producto en
 * pérdida, y donde no cubre ni el tiempo de atender al comprador.
 *
 * No bloquea nada, porque el catálogo lo elige el dueño: la pantalla de
 * selección lo marca en rojo y él decide.
 */
export const MARGEN_MINIMO_CENTAVOS = 200;

export function dejaMargenSuficiente(
  costoProductoCentavos: number,
  costoEnvioCentavos: number,
): boolean {
  return (
    desglosarUs(costoProductoCentavos, costoEnvioCentavos).margenCentavos >=
    MARGEN_MINIMO_CENTAVOS
  );
}
