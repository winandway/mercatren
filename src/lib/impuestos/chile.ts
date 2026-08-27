import type { Mercado } from "@/lib/mercado/mercados";

/**
 * EL IVA DE CHILE: el 19 % de las ventas que cruzan la frontera.
 *
 * ══ POR QUÉ EXISTE ESTE ARCHIVO ══
 *
 * Mercatren LLC está inscrita en el Portal de IVA Digital del SII desde el 18
 * de agosto de 2026 (usuario `59330700K`). Estar inscrito **obliga** a cobrarle
 * el 19 % al comprador chileno en el flujo de importación. Mientras esto no
 * exista, ese 19 % sale del bolsillo de Mercatren en cada venta.
 *
 * ══ LAS REGLAS SALEN DE LA NORMATIVA, NO DE SUPONER ══
 *
 * Las dos preguntas que estuvieron abiertas desde el 18 de agosto —qué entra en
 * el tope de USD 500 y qué compone la base del 19 %— están contestadas en la
 * fuente. Se citan aquí porque de esto sale un número que se le cobra a una
 * persona, y dentro de seis meses nadie va a acordarse de dónde salió:
 *
 * > «Se entenderá que un bien corporal mueble es de "bajo valor" cuando el
 * > precio del artículo o ítem, INDIVIDUALMENTE CONSIDERADO, no excede de
 * > USD 500. Dicho tope incluye los cargos asociados a la compra del bien,
 * > tales como su envío, seguro o empaque adicional […]. Cuando tales cargos
 * > accesorios no se cobren al comprador por cada ítem o artículo
 * > individualmente considerado, deberá PRORRATEARSE entre los distintos ítems
 * > […]. Para el cómputo de dicho tope se deben restar los descuentos […]. Los
 * > regalos o bienes dados al comprador, sin mediar el pago de una
 * > contraprestación, no deben considerarse en el cálculo del referido límite.»
 * > — Resolución Ex. SII N°93 de 2025, nota 1
 *
 * > «El valor de la operación en la venta de bienes situados en el extranjero,
 * > para efectos de la base imponible del IVA, incluye TODO CARGO ACCESORIO que
 * > sea cobrado al comprador en la operación. Por ende […] se incluyen dentro
 * > de la base imponible el valor del transporte, seguros, etc.»
 * > — Circular SII N°39 de 2025, apartado 3.6.4
 *
 * **De ahí sale la propiedad que hace simple todo este archivo: la cifra que se
 * compara contra las 500 y la cifra sobre la que se aplica el 19 % son LA
 * MISMA.** Un solo número, una sola función, un solo sitio donde equivocarse.
 *
 * ══ EL TIPO DE CAMBIO ENTRA COMO PARÁMETRO, NUNCA SE BUSCA AQUÍ ══
 *
 * > «Se estará al tipo de cambio publicado por el Banco Central a la fecha del
 * > devengo del impuesto; esto es, a la fecha del recargo en el medio de pago
 * > del tarjetahabiente comprador.»
 * > — Circular SII N°39 de 2025, apartado 3.4
 *
 * O sea: la tasa del día en que se cobra la tarjeta, no una guardada de ayer.
 * Este archivo es puro a propósito —se prueba sin red y sin base— así que quien
 * llama trae la tasa. Meterle aquí una consulta al Banco Central convertiría
 * una función de dinero en algo que falla cuando un servicio ajeno tose.
 */

/** Lo que hay que saber para cobrar el impuesto de un mercado. */
export type ReglaDeImpuesto = {
  /** Cómo se llama en la factura y en las pantallas. */
  codigo: "IVA";
  /** La tasa, en puntos base, como toda tasa del proyecto (1900 = 19 %). */
  puntosBase: number;
  /**
   * Hasta cuánto vale el régimen simplificado, en centavos de DÓLAR.
   *
   * Va en dólares y no en la moneda del país porque así lo escribe la ley
   * chilena. Convertirlo es trabajo de quien tiene la tasa del día.
   */
  topeUsdCentavos: number;
  /** El número que nos dio el SII al inscribirnos. Viaja con cada envío. */
  numeroDeUsuario: string;
};

/**
 * LA REGLA DE CHILE.
 *
 * El tope son USD 500,00 exactos: un artículo de USD 500,01 —incluyendo sus
 * cargos— ya NO es de bajo valor y paga IVA más arancel en la aduana.
 */
const CHILE: ReglaDeImpuesto = {
  codigo: "IVA",
  puntosBase: 1900,
  topeUsdCentavos: 50_000,
  numeroDeUsuario: "59330700K",
};

/**
 * ¿Este mercado cobra impuesto en la venta?
 *
 * Devuelve `null` cuando no hay nada que cobrar, que es el caso de Estados
 * Unidos hoy. **Es una tabla y no un `if`** por el mismo motivo que la moneda:
 * Colombia va a entrar detrás, y un `if (mercado === "CL")` repartido por el
 * checkout, la ficha y la factura garantiza que el país siguiente nazca sin
 * impuesto en el sitio donde nadie se acordó.
 */
const POR_MERCADO: Record<string, ReglaDeImpuesto> = { CL: CHILE };

export function impuestoDelMercado(mercado: Mercado): ReglaDeImpuesto | null {
  return POR_MERCADO[mercado.codigo] ?? null;
}

/** Un artículo del carrito, ya en la unidad menor de la moneda del mercado. */
export type ArticuloGravable = {
  /** El precio de la mercancía. En Chile, pesos enteros. */
  mercancia: number;
  /**
   * Los cargos accesorios de ESTE artículo: envío, seguro, embalaje adicional.
   *
   * Si el flete se cobra por pedido y no por artículo, se reparte antes con
   * `prorratearCargos` — lo exige la propia norma.
   */
  cargos?: number;
  /** Descuentos hechos a este artículo. Restan del cómputo del tope. */
  descuento?: number;
  /**
   * Un regalo no entra ni en el tope ni en la base.
   *
   * «Los regalos o bienes dados al comprador, sin mediar el pago de una
   * contraprestación, no deben considerarse en el cálculo del referido límite.»
   */
  esRegalo?: boolean;
};

/** Lo que hay que cobrar y declarar por un artículo. */
export type ImpuestoDeArticulo = {
  /** Precio + cargos − descuentos. Es el tope Y la base, a la vez. */
  base: number;
  /** ¿Entra en el régimen simplificado, o se va a la aduana? */
  esBajoValor: boolean;
  /** El 19 %. **Cero cuando no es de bajo valor**: ese lo cobra la aduana. */
  impuesto: number;
  /** Lo que paga el comprador por este artículo. */
  total: number;
};

/**
 * El impuesto de UN artículo, individualmente considerado.
 *
 * ══ POR QUÉ LA FUNCIÓN ES DE UN ARTÍCULO Y NO DEL CARRITO ══
 *
 * Porque así lo manda la norma, y es la parte que más se presta a error: **el
 * tope es de cada artículo, no del pedido ni del paquete.** Un carrito de tres
 * artículos de USD 200 cada uno pasa entero, aunque sume 600. Escribir esto
 * sobre el total del carrito nos habría dejado rechazando ventas perfectamente
 * legales — y encima creyendo que estábamos siendo prudentes.
 *
 * @param tasaPorUsd Cuántas unidades de la moneda del mercado vale un dólar,
 *   según el Banco Central del día del cobro (p. ej. 967.42 pesos por dólar).
 */
export function impuestoDeArticulo(
  articulo: ArticuloGravable,
  regla: ReglaDeImpuesto,
  tasaPorUsd: number,
): ImpuestoDeArticulo {
  if (articulo.esRegalo) {
    return { base: 0, esBajoValor: true, impuesto: 0, total: 0 };
  }

  /* Un descuento no puede dejar la base en negativo: eso sería devolverle
     impuesto a alguien que no pagó nada. */
  const base = Math.max(
    0,
    articulo.mercancia + (articulo.cargos ?? 0) - (articulo.descuento ?? 0),
  );

  const esBajoValor = base <= topeEnMonedaLocal(regla, tasaPorUsd);

  /* Si NO es de bajo valor, aquí no se cobra nada: ese artículo paga IVA y
     arancel en la aduana, y lo asume quien recibe. Cobrarlo igual sería
     cobrárselo dos veces. */
  const impuesto = esBajoValor
    ? Math.round((base * regla.puntosBase) / 10_000)
    : 0;

  return { base, esBajoValor, impuesto, total: base + impuesto };
}

/**
 * El tope de USD 500 convertido a la moneda del país, redondeado HACIA ABAJO.
 *
 * Hacia abajo y no al más cercano a propósito: en la frontera exacta conviene
 * que el artículo se vaya a la aduana antes que colarlo en el régimen
 * simplificado. Equivocarse por abajo cuesta una venta; equivocarse por arriba
 * es declarar mal ante el SII.
 */
export function topeEnMonedaLocal(
  regla: ReglaDeImpuesto,
  tasaPorUsd: number,
): number {
  return Math.floor((regla.topeUsdCentavos / 100) * tasaPorUsd);
}

/**
 * REPARTIR UN FLETE DE PEDIDO ENTRE SUS ARTÍCULOS.
 *
 * «Cuando tales cargos accesorios no se cobren al comprador por cada ítem o
 * artículo individualmente considerado, deberá prorratearse entre los distintos
 * ítems o artículos comprendidos en la compra.»
 *
 * Se reparte en proporción al valor de cada artículo —que es lo razonable y lo
 * que hace cualquier aduana— y **el resto se reparte de a una unidad entre los
 * primeros**, nunca todo junto al último: así la suma de las partes es SIEMPRE
 * el total exacto. Es la misma mecánica que ya usan las partes de un cobro.
 */
export function prorratearCargos(
  cargosTotales: number,
  valores: number[],
): number[] {
  if (valores.length === 0) return [];
  const suma = valores.reduce((a, b) => a + b, 0);

  /* Sin valores sobre los que repartir (todo en cero), se reparte parejo: es
     lo único que no inventa una proporción que no existe. */
  if (suma <= 0) {
    const base = Math.floor(cargosTotales / valores.length);
    const resto = cargosTotales - base * valores.length;
    return valores.map((_, i) => base + (i < resto ? 1 : 0));
  }

  const partes = valores.map((v) => Math.floor((cargosTotales * v) / suma));
  let resto = cargosTotales - partes.reduce((a, b) => a + b, 0);
  for (let i = 0; resto > 0; i = (i + 1) % partes.length, resto--) {
    partes[i] = (partes[i] ?? 0) + 1;
  }
  return partes;
}

/** Lo que hay que cobrar y declarar por un carrito entero. */
export type ImpuestoDelCarrito = {
  /** Uno por artículo, en el mismo orden que entraron. */
  articulos: ImpuestoDeArticulo[];
  /** La suma de las bases. */
  base: number;
  /** La suma del 19 % de los que sí son de bajo valor. */
  impuesto: number;
  /** Lo que paga el comprador. */
  total: number;
  /**
   * ¿Hay algún artículo que se pasa del tope?
   *
   * No es un detalle informativo: a ese comprador le van a cobrar IVA **más
   * arancel** en la aduana, de sorpresa. Lo correcto es no publicar en Chile lo
   * que se pase, y esta bandera es lo que deja avisarlo antes de cobrar.
   */
  hayArticulosSobreElTope: boolean;
};

/** El impuesto de todo un carrito, artículo por artículo. */
export function impuestoDelCarrito(
  articulos: ArticuloGravable[],
  regla: ReglaDeImpuesto,
  tasaPorUsd: number,
): ImpuestoDelCarrito {
  const calculados = articulos.map((a) =>
    impuestoDeArticulo(a, regla, tasaPorUsd),
  );
  return {
    articulos: calculados,
    base: calculados.reduce((s, a) => s + a.base, 0),
    impuesto: calculados.reduce((s, a) => s + a.impuesto, 0),
    total: calculados.reduce((s, a) => s + a.total, 0),
    hayArticulosSobreElTope: calculados.some((a) => !a.esBajoValor),
  };
}

/**
 * DESGLOSAR UN PRECIO QUE YA LLEVA EL IVA DENTRO.
 *
 * En Chile los precios se muestran con IVA incluido: es lo que espera
 * cualquiera que compre ahí, y enseñar un precio al que después le crece un
 * 19 % en el último paso es de las formas más caras de perder una venta.
 *
 * **La resta garantiza que las dos partes sumen SIEMPRE el bruto exacto.**
 * Calcular las dos por separado deja un centavo suelto una de cada tantas, y un
 * centavo que no cuadra en una pantalla de dinero rompe la confianza en todo.
 */
export function desglosarDesdeBruto(
  bruto: number,
  regla: ReglaDeImpuesto,
): { neto: number; impuesto: number; bruto: number } {
  const neto = Math.round((bruto * 10_000) / (10_000 + regla.puntosBase));
  return { neto, impuesto: bruto - neto, bruto };
}

/** El precio a enseñar en la vitrina: el neto con su IVA ya sumado. */
export function precioConImpuesto(
  neto: number,
  regla: ReglaDeImpuesto,
): number {
  return neto + Math.round((neto * regla.puntosBase) / 10_000);
}
