/**
 * Reglas de dinero de Mercatren.
 *
 * REGLA DURA: el dinero se guarda y se calcula SIEMPRE en centavos enteros.
 * Nunca en decimales. Los decimales de coma flotante pierden centavos y en un
 * mercado con miles de pedidos eso se convierte en plata que no cuadra.
 */

import { divisorDe } from "@/lib/mercado/moneda";

export type Idioma = "es" | "en";

/**
 * Convierte lo guardado a texto de precio para mostrar en pantalla.
 *
 * ══ NO SIEMPRE SE DIVIDE ENTRE 100 (17 ago 2026) ══
 *
 * El dinero se guarda en la UNIDAD MENOR de su moneda. En dólares es el
 * centavo, así que 1050 son $10.50. Pero **el peso chileno no tiene
 * centavos**: su unidad menor es el peso, así que 5990 son $5.990 CLP.
 *
 * Dividir siempre entre 100 convertiría un producto de 5.990 pesos en uno de
 * 59 con 90 — un cero de menos en un precio no es un problema de pantalla,
 * es una venta a pérdida. El divisor sale de `mercado/moneda.ts`, que lo sabe
 * por moneda y no por país, para que Colombia y México (también sin centavos)
 * lo hereden sin tocar nada.
 *
 * Para el dólar el resultado es idéntico al de antes.
 */
export function formatearPrecio(
  centavos: number,
  idioma: Idioma = "es",
  moneda = "USD",
) {
  return new Intl.NumberFormat(idioma === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: moneda,
  }).format(centavos / divisorDe(moneda));
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
 *   2. El margen de Mercatren: 3% del precio de venta, que es como se calcula
 *      en la venta (ver COMISION_TARJETA_PB y el webhook de Stripe). Si la
 *      fórmula no lo incluyera, el margen saldría del bolsillo del proveedor.
 *
 * LA CUENTA ES HACIA ATRÁS, no hacia adelante. No es "precio + 4.9%": es
 * encontrar el publicado V tal que, después de quitarle todo, quede el precio
 * del proveedor completo:
 *
 *   V − 2.9%·V − $0.30 − 3%·V = base
 *   V · (1 − 0.029 − 0.03) = base + 0.30
 *   V = (base + $0.30) / 0.941
 *
 * Sumar los porcentajes hacia adelante deja corto: en $100, publicar $105.90
 * hace que el procesador cobre sobre 105.90 y falten centavos. Siempre faltan.
 *
 * Se redondea HACIA ARRIBA al centavo: el centavo de diferencia queda de
 * colchón a favor, nunca en contra.
 *
 * Todo entero: (base + 30) * 10000 / 9410, techo. Sin coma flotante, que
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
 * EL PRECIO CUANDO SE PAGA POR ZELLE: el 3%, sin el fee de la tarjeta.
 *
 * POR QUÉ EXISTE ESTA FUNCIÓN (6 ago 2026, corrección urgente).
 *
 * El precio publicado lleva incorporado el 2.9% + $0.30 del procesador de
 * tarjeta. Eso está bien cuando se paga con tarjeta — es lo que Stripe se
 * lleva. Pero **por Zelle no interviene ningún procesador: la transferencia es
 * gratis.** Cobrar ese porcentaje en un pago por Zelle es cobrarle al cliente
 * el costo de un servicio que no se usó.
 *
 * La cuenta es la misma de siempre, pero sin los dos términos del procesador:
 *
 *   V − 3%·V = base   →   V = base / 0.97
 *
 * Hacia atrás y con enteros, igual que la otra: el redondeo hacia arriba deja
 * el centavo de colchón a favor, nunca en contra.
 *
 * ES MÁS BARATO PARA EL CLIENTE, con el mismo margen para nosotros. En una
 * compra de $100 el precio con tarjeta es $106.59 y por Zelle $103.10; en una
 * de $2.000, $2,126.46 contra $2,061.86. La diferencia entera la hace el
 * 2.9% + $0.30 del procesador, que aquí no existe.
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
 * LA COMISIÓN DE MERCATREN — 3%, con tarjeta y por Zelle.
 *
 *   · Tarjeta — 3% de Mercatren + 2.9% + $0.30 que cobra Stripe. Son DOS
 *               costos distintos y al comercio se le enseñan por separado:
 *               uno es de un tercero y el otro es nuestro.
 *   · Zelle   — 3% de Mercatren y nada más. No hay procesador, pero sí hay
 *               una persona comprobando cada comprobante contra el banco.
 *
 * **Y el comprador paga menos por Zelle**, porque ahí no interviene el 2.9% +
 * $0.30 del procesador. Ver `precioZelleCentavos`.
 *
 * POR QUÉ ESTAS DOS CONSTANTES TIENEN QUE CUADRAR CON `tiendas.comision_puntos_base`
 * (que vale 300). El precio publicado es lo que se le COBRA al comprador; la
 * comisión de la tienda es lo que se le DESCUENTA al comercio al acreditar. Si
 * el precio cubre un porcentaje y al comercio se le descuenta otro, la
 * diferencia sale de su bolsillo, en silencio y en cada venta. Pasó del 5 al 7
 * de agosto de 2026. **Si se cambia una, se cambian las tres** — y se
 * recalculan los precios publicados antes de desplegar.
 */
/**
 * ══ EL 3 % ES EL MISMO EN LOS DOS MÉTODOS (10 ago 2026) ══
 *
 * Hasta hoy la tarjeta iba al 2 % y Zelle al 3 %. Se igualaron en 3 % después
 * de mirar lo que cobra el mercado: Amazon el 15 % en la mayoría de categorías
 * (8 % en electrónica, con un rango de 5 % a 45 %), y Mercado Libre entre
 * 11,8 % y 20 % según país y tipo de publicación. Aun en 3 %, Mercatren cobra
 * cinco veces menos que Amazon.
 *
 * **Y por Zelle el comprador SIGUE pagando menos**, ahora con una explicación
 * más limpia: el margen es el mismo, pero por Zelle no hay procesador. En una
 * compra de $100 son $103.10 contra $106.59.
 *
 * ══ CAMBIAR ESTO SIN RECALCULAR LOS PRECIOS LE CUESTA AL COMERCIO ══
 *
 * El precio publicado se calcula hacia atrás con este número dentro
 * (`precioConAjusteCentavos`). Si la constante sube y los precios guardados se
 * quedan como estaban, se cobra el precio viejo y se descuenta el margen
 * nuevo: **la diferencia sale del bolsillo del comercio, en silencio y en cada
 * venta**. Pasó del 5 al 7 de agosto de 2026.
 *
 * Al subir al 3 % se recalcularon los 714 productos publicados ANTES de
 * desplegar el cambio, para que si algo salía mal el error costara de nuestro
 * lado y no del suyo. El plan entero está en `PLAN-COMISION.md`.
 */
export const COMISION_TARJETA_PB = 300;

/**
 * EL MARGEN DEL CATÁLOGO DE ESTADOS UNIDOS: 30 %.
 *
 * ══ POR QUÉ NO ES EL 3 % DE VENEZUELA ══
 *
 * Son dos negocios distintos y confundirlos costaría dinero en cada venta.
 *
 * En Venezuela, Mercatren es un mercado: **el comercio pone la mercancía, la
 * despacha y responde por ella**. Nosotros cobramos y facturamos. El 3 % ahí es
 * limpio porque no ponemos capital ni asumimos el riesgo de la cosa vendida.
 *
 * En Estados Unidos, Mercatren **compra el producto, paga su envío, atiende al
 * comprador y asume la devolución y el contracargo**. Eso no es comisión de
 * mercado: es venta al por menor, y las márgenes de venta al por menor son otra
 * escala.
 *
 * ══ LO QUE SE USA DE VERDAD EN ESTE NEGOCIO (comprobado 15 ago 2026) ══
 *
 * El estándar del dropshipping es **15–30 % neto**, con margen bruto de 30–50 %
 * antes de publicidad. Por debajo del 10 % se considera insostenible en cuanto
 * aparecen devoluciones. Se elige el 30 % —el techo de la banda neta— porque
 * aquí no hay presupuesto de publicidad que se coma la diferencia, y porque
 * un solo contracargo cuesta la venta más la multa de Stripe.
 *
 * Con el 3 % anterior, un producto de $30 de costo dejaba **97 centavos**: un
 * contracargo se comía treinta ventas.
 *
 * ══ CÓMO SE CAMBIA ══
 *
 * Esta línea, y después `node scripts/recalcular-precios.ts` para que los
 * precios ya publicados se rehagan. El orden importa y está en el ROADMAP: los
 * precios PRIMERO, la constante después.
 */
export const COMISION_US_PB = 3000;
export const COMISION_ZELLE_PB = 300;
export const ZELLE_MINIMO_CENTAVOS = 20_000;

/**
 * QUÉ PORCENTAJE SE LE DESCUENTA AL COMERCIO, SEGÚN CÓMO SE PAGÓ.
 *
 * ══ EL FALLO QUE ARREGLA (10 ago 2026) ══
 *
 * Al crear el pedido, la comisión de cada renglón se guardaba SIEMPRE con la
 * tarifa de la tienda (300 = 3%, la de Zelle), sin mirar cómo se iba a pagar.
 * Pero el webhook de Stripe acreditaba con el 2%. El mismo pedido terminaba
 * con dos números: la orden de compra decía una cosa y la billetera otra.
 *
 * Pasó de verdad con la primera venta real con tarjeta, la MT-000002: la orden
 * de compra salió por $30.91 y a la billetera entraron $31.23. Treinta y dos
 * centavos de diferencia en el documento que respalda la reventa.
 *
 * **El número correcto es siempre el del método**: el que se usó para calcular
 * el precio que pagó el comprador (`precioConAjusteCentavos`). Descontarle al
 * comercio un porcentaje distinto del que cubría el precio es cobrarle algo
 * que nadie le cobró al comprador.
 *
 * Hoy los dos métodos van al 3 %, así que los números coinciden — pero la
 * función se queda: el día que vuelvan a separarse, o que se le acuerde otra
 * tarifa a un comercio, esto es lo que impide que la diferencia se la coma él.
 *
 * ══ POR QUÉ ZELLE USA LA TARIFA DE LA TIENDA Y LA TARJETA NO ══
 *
 * No es una asimetría por descuido. La tarifa de la tienda existe para poder
 * acordar una comisión distinta con un comercio, y en Zelle el precio se
 * calcula con esa misma tarifa. En la tarjeta no se puede: el precio publicado
 * sale de una constante, así que si aquí se usara otra cifra, el descuento
 * dejaría de cuadrar con el precio y la diferencia saldría del comercio.
 */
export function puntosBaseDelMetodo(
  metodoPago: string,
  puntosBaseDeLaTienda: number,
): number {
  return metodoPago === "zelle" ? puntosBaseDeLaTienda : COMISION_TARJETA_PB;
}

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
