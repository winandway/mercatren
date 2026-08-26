import {
  COMISION_TARJETA_PB,
  COMISION_ZELLE_PB,
  PROCESADOR_FIJO_CENTAVOS,
  PROCESADOR_PORCENTAJE_PB,
  precioConAjusteCentavos,
  precioZelleCentavos,
} from "@/lib/dinero";

/**
 * CÓMO SE REPARTE UN COBRO POR ENLACE (26 ago 2026).
 *
 * ══ LA FUGA QUE ESTO CIERRA ══
 *
 * Hasta hoy, al acreditar un cobro se le descontaba al comercio **solo el 3%**
 * de Mercatren, sin importar por dónde entró el dinero. Con tarjeta, Stripe se
 * lleva además 2,9% + $0.30 — y ese costo salía del bolsillo de Mercatren.
 * Medido con la factura real del 26 ago:
 *
 * | Cobro con tarjeta | Stripe  | Al comercio | Margen REAL |
 * | ----------------- | ------- | ----------- | ----------- |
 * | $2.860,71         | $83,26  | $2.774,89   | **$2,56**   |
 * | $7.475,00         | $217,08 | $7.250,75   | **$7,17**   |
 * | $10,00            | $0,59   | $9,70       | **−$0,29**  |
 *
 * En la de siete mil dólares el margen se quedaba en siete, y por debajo de
 * unos once dólares **el sistema perdía dinero en cada cobro**. Lo vio el
 * dueño antes que nadie: «si el cliente le da la gana de pagar con tarjeta,
 * salimos peleando nosotros».
 *
 * ══ CÓMO SE REPARTE AHORA ══
 *
 * El monto del cobro es lo que paga el cliente. De ahí salen tres cosas, en
 * este orden:
 *
 * 1. **El procesador**, si lo hubo. Con tarjeta, 2,9% + $0.30 se los queda
 *    Stripe antes de que el dinero llegue a la cuenta. Por Zelle y por
 *    transferencia no interviene nadie: cero.
 * 2. **El margen de Mercatren**, el 3% del monto.
 * 3. **El resto es del comercio.**
 *
 * Es exactamente el mismo reparto que ya usa el catálogo desde el 7 de agosto
 * —donde el precio publicado lleva el costo de la tarjeta dentro— solo que
 * aquí el monto lo pone el comercio y por eso hay que decírselo antes.
 */

/** Por dónde entró el dinero. Decide si hubo procesador de por medio. */
export type MetodoDeCobro = "tarjeta" | "zelle" | "transferencia";

export type RepartoDelCobro = {
  /** Lo que paga el cliente: el monto del cobro. */
  pagaElCliente: number;
  /** Lo que se queda Stripe. Cero salvo con tarjeta. */
  procesador: number;
  /** El margen de Mercatren, el 3%. */
  margen: number;
  /** Lo que se le acredita al comercio. */
  recibeElComercio: number;
};

export function repartoDelCobro(
  montoCentavos: number,
  metodo: MetodoDeCobro,
): RepartoDelCobro {
  if (montoCentavos <= 0) {
    return { pagaElCliente: 0, procesador: 0, margen: 0, recibeElComercio: 0 };
  }

  const procesador =
    metodo === "tarjeta"
      ? Math.round((montoCentavos * PROCESADOR_PORCENTAJE_PB) / 10_000) +
        PROCESADOR_FIJO_CENTAVOS
      : 0;

  const puntosBase =
    metodo === "tarjeta" ? COMISION_TARJETA_PB : COMISION_ZELLE_PB;
  const margen = Math.round((montoCentavos * puntosBase) / 10_000);

  /**
   * NUNCA SE LE ACREDITA UN NEGATIVO AL COMERCIO.
   *
   * Con un cobro de un dólar, el fijo de $0.30 más el 2,9% se comen más que
   * el margen: la resta daría un número por debajo de cero y eso, escrito en
   * una billetera, es una deuda que el comercio nunca contrajo. Se acota en
   * cero y el descubierto lo absorbe Mercatren, que es quien eligió aceptar
   * ese método — pero eso ya no puede pasar sin que alguien lo vea, porque
   * `pierdeDinero()` lo dice antes de crear el cobro.
   */
  const recibeElComercio = Math.max(0, montoCentavos - procesador - margen);

  return { pagaElCliente: montoCentavos, procesador, margen, recibeElComercio };
}

/**
 * LA DIFERENCIA ENTRE COBRAR CON TARJETA Y SIN ELLA.
 *
 * Lo que el comercio deja de recibir por aceptar tarjeta en ese cobro. Es el
 * número que hace falta para decidir: en una factura de $7.475 son más de
 * doscientos dólares, y en una de veinte son ochenta centavos.
 */
export function loQueCuestaLaTarjeta(montoCentavos: number): number {
  return (
    repartoDelCobro(montoCentavos, "zelle").recibeElComercio -
    repartoDelCobro(montoCentavos, "tarjeta").recibeElComercio
  );
}

/**
 * CUÁNTO HAY QUE COBRAR PARA QUE AL COMERCIO LE LLEGUEN X LIMPIOS.
 *
 * Reusa las fórmulas del catálogo, que ya estaban resueltas y probadas:
 * `(base + $0.30) / 0,941` con tarjeta y `base / 0,97` sin procesador. No se
 * reescriben aquí — dos fórmulas para lo mismo se separan al primer arreglo.
 */
export function cuantoCobrarPara(
  netoDeseadoCentavos: number,
  metodo: MetodoDeCobro,
): number {
  if (netoDeseadoCentavos <= 0) return 0;
  return metodo === "tarjeta"
    ? precioConAjusteCentavos(netoDeseadoCentavos)
    : precioZelleCentavos(netoDeseadoCentavos);
}

/** Los tres métodos, en el orden en que se ofrecen. */
export const METODOS: MetodoDeCobro[] = ["transferencia", "zelle", "tarjeta"];

/**
 * ¿Se ofrece este método en este cobro?
 *
 * **Sin filas guardadas se aceptan TODOS**, y es deliberado: así se comportan
 * los cobros creados antes de que esto existiera. Nadie se queda sin poder
 * cobrar por un cambio de esquema.
 */
export function aceptaMetodo(
  guardados: string[],
  metodo: MetodoDeCobro,
): boolean {
  if (guardados.length === 0) return true;
  return guardados.includes(metodo);
}

/**
 * Los métodos que llegan del formulario, limpiados.
 *
 * Si no viene ninguno válido se devuelve la lista vacía —que significa
 * «todos»— en vez de un cobro que nadie puede pagar: un formulario mal
 * enviado no puede dejar una factura muerta.
 */
export function metodosDesdeFormulario(valores: unknown[]): MetodoDeCobro[] {
  const limpios = valores
    .map((v) => String(v ?? "").trim())
    .filter((v): v is MetodoDeCobro => (METODOS as string[]).includes(v));
  return [...new Set(limpios)];
}
