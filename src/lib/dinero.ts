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

/**
 * EL PRECIO CUANDO SE PAGA POR ZELLE: solo el 2%, sin el fee de la tarjeta.
 *
 * POR QUÉ EXISTE ESTA FUNCIÓN (6 ago 2026, corrección urgente).
 *
 * El precio publicado lleva incorporado el 2.9% + $0.30 del procesador de
 * tarjeta. Eso está bien cuando se paga con tarjeta — es lo que Stripe se
 * lleva. Pero **por Zelle no interviene ningún procesador: la transferencia es
 * gratis.** Cobrar ese porcentaje en un pago por Zelle es cobrarle al cliente
 * el costo de un servicio que no se usó.
 *
 * En una compra de $2.000 eran **$62,55 de más**. En una de $100, $3,42.
 *
 * La cuenta es la misma de siempre, pero sin los dos términos del procesador:
 *
 *   V − 2%·V = base   →   V = base / 0.98
 *
 * Hacia atrás y con enteros, igual que la otra: el redondeo hacia arriba deja
 * el centavo de colchón a favor, nunca en contra.
 */
export function precioZelleCentavos(baseCentavos: number): number {
  if (baseCentavos <= 0) return 0;
  return Math.ceil((baseCentavos * 10_000) / (10_000 - COMISION_ZELLE_PB));
}

/**
 * Lo que se le ahorra el cliente pagando por Zelle en vez de con tarjeta.
 *
 * Se le enseña en el checkout: es un beneficio real y verlo es lo que hace que
 * elija el método que además nos sale más barato a nosotros.
 */
export function ahorroPorZelleCentavos(baseCentavos: number): number {
  if (baseCentavos <= 0) return 0;
  return Math.max(
    0,
    precioConAjusteCentavos(baseCentavos) - precioZelleCentavos(baseCentavos),
  );
}

/** El ajuste solo, para enseñárselo al comercio: "tu precio + $0.61". */
export function ajusteCentavos(baseCentavos: number): number {
  if (baseCentavos <= 0) return 0;
  return precioConAjusteCentavos(baseCentavos) - baseCentavos;
}

/**
 * LA COMISIÓN POR MÉTODO.
 *
 * **Las dos son 2%.** Lo que cambia entre un método y otro no es lo que se
 * lleva Mercatren: es lo que se lleva el procesador.
 *
 *   · Tarjeta — 2% de Mercatren + 2.9% + $0.30 que cobra Stripe.
 *   · Zelle   — 2% de Mercatren y nada más. La transferencia es gratis, así
 *               que no hay ningún costo de procesamiento que cubrir.
 *
 * CORREGIDO EL 6 AGO 2026. Antes el precio publicado llevaba SIEMPRE el fee de
 * la tarjeta, se pagara como se pagara, y quien pagaba por Zelle cubría el
 * costo de un procesador que no se había usado: $62,55 de más en una compra de
 * $2.000. Lo levantó el dueño.
 */
export const COMISION_TARJETA_PB = 200;
export const COMISION_ZELLE_PB = 200;
export const ZELLE_MINIMO_CENTAVOS = 20_000;

/**
 * HASTA CUÁNTO SE LE PUEDE PAGAR A UN COMERCIO POR ZELLE: $500.
 *
 * No es un capricho ni una desconfianza al comercio. Es lo que protege la
 * cuenta del banco de Windoce, LLC, que es de donde sale TODO el dinero de
 * TODOS los comercios. Si esa cuenta se restringe, no cobra nadie.
 *
 * LO QUE ENCONTRAMOS AL INVESTIGARLO (6 ago 2026):
 *
 * - Los bancos vigilan Zelle con un umbral MÁS BAJO que ACH. Un pago que
 *   como ACH no levanta ninguna alerta, por Zelle y al mismo destinatario a
 *   veces sí dispara una restricción — y la reacción automática del banco es
 *   mucho más rápida.
 * - Zelle está pensado para pagar a gente que conoces, no para pagarle a
 *   proveedores todos los días. Ese patrón —muchos envíos, recurrentes, a
 *   distintas empresas— es justo el que marcan las revisiones de
 *   cumplimiento.
 * - El límite diario del banco es UNO SOLO y se comparte entre todos. Los
 *   límites de negocio van de $5,000 al día (Chase, U.S. Bank) a $15,000
 *   (Bank of America, Wells Fargo). Con un tope de $500 caben diez pagos en
 *   un día sin acercarse al borde; con uno de $3,000, el tercer comercio del
 *   día se queda sin cobrar.
 * - Zelle NO SE DEVUELVE. Un dedo de más en el monto o un correo mal escrito
 *   son dinero perdido, y a $500 el error duele mucho menos.
 *
 * Por encima de esto va ACH sí o sí, que es la vía que los bancos esperan
 * para pagos de empresa y que además deja mejor rastro para la contabilidad.
 *
 * SI SE SUBE, que sea con los límites del banco delante y sabiendo que se
 * está gastando margen de seguridad. Nunca por encima de $1,000 sin haberlo
 * hablado con el banco.
 */
export const ZELLE_RETIRO_MAXIMO_CENTAVOS = 50_000;

/**
 * CUÁNTO TIEMPO UN PRODUCTO ES "NUEVO": una semana.
 *
 * Lo pidió el dueño el 5 ago 2026, y con un motivo concreto: un comercio que
 * sube su primer producto, entra a la tienda y no lo ve por ningún lado, se
 * desanima. El sello dice "recién llegó" y además lo empuja al principio.
 *
 * SE CALCULA, NO SE GUARDA. La tentación es poner una columna `es_nuevo` y un
 * robotito que la apague cada noche — y eso es exactamente lo que no hay que
 * hacer: si el robotito falla una noche, quedan productos "nuevos" de hace un
 * mes, y nadie se entera hasta que un cliente lo nota. Comparando la fecha de
 * creación con la de hoy, el sello se apaga solo, siempre, sin nada que
 * mantener y sin nada que se pueda romper.
 */
export const DIAS_PRODUCTO_NUEVO = 7;

/**
 * Si un producto creado en esa fecha todavía lleva el sello de nuevo.
 *
 * Acepta Date, número o TEXTO: las tandas del scroll llegan por JSON y ahí
 * una fecha viaja como "2026-08-05T...". Sin esto, el sello aparecía en la
 * primera pantalla y desaparecía en las siguientes tandas del mismo listado.
 */
export function esProductoNuevo(
  creadoEn: Date | number | string | null,
): boolean {
  if (!creadoEn) return false;
  const fecha =
    creadoEn instanceof Date
      ? creadoEn.getTime()
      : typeof creadoEn === "string"
        ? Date.parse(creadoEn)
        : creadoEn;
  if (!Number.isFinite(fecha)) return false;
  return Date.now() - fecha < DIAS_PRODUCTO_NUEVO * 24 * 60 * 60 * 1000;
}
