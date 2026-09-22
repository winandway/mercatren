/**
 * QUÉ FORMAS DE PAGO VE QUIEN ABRE UN ENLACE DE COBRO.
 *
 * ══ EL CALLEJÓN SIN SALIDA DE $6.483,77 (22 sep 2026) ══
 *
 * El dueño emitió el cobro MT-C-000004 sin tarjeta —para no regalarle $190 al
 * procesador— y abrió el enlace como lo ve su cliente. Encontró una sola
 * instrucción de ACH: ni la segunda cuenta, ni el cable. Y la pantalla le
 * decía **«esta ruta es SOLO para ACH; si vas a mandar un cable, no uses
 * esta»**… sin ofrecerle a dónde mandarlo.
 *
 * La causa: tres decisiones distintas mirando solo `zelle` y `transferencia`,
 * escritas antes de que existieran el cable y la segunda cuenta, y que nadie
 * volvió a tocar al agregarlos:
 *
 *   1. «¿No hay ningún método?» no miraba el cable: un cobro que solo
 *      aceptara cable decía «no hay forma de pagar» teniéndola.
 *   2. El atajo de «una sola forma se enseña directa» se disparaba con
 *      `transferencia` a secas y **se tragaba el cable y la segunda cuenta**.
 *   3. El método preseleccionado salía de la misma cuenta corta: sin tarjeta
 *      y con solo cable arrancaba en «zelle», y debajo del selector no se
 *      dibujaba **nada**.
 *
 * ══ POR QUÉ ES PURO Y VIVE AQUÍ ══
 *
 * Es la pieza que decide qué puede hacer alguien que tiene que pagar seis mil
 * dólares. Se prueba sin navegador y sin base, y el día que se agregue un
 * método nuevo hay UN sitio que enterarse: si aparece en esta lista, las tres
 * decisiones lo ven.
 */

/** Las formas de pago, en el orden en que se le ofrecen a quien paga. */
export const METODOS_EN_ORDEN = [
  "tarjeta",
  "zelle",
  "transferencia",
  "wire",
] as const;

export type MetodoVisible = (typeof METODOS_EN_ORDEN)[number];

/**
 * Lo que de verdad se puede pagar en este cobro.
 *
 * La tarjeta va primera y por eso queda preseleccionada: se confirma sola,
 * sin que una persona tenga que mirar un comprobante.
 */
export function metodosDisponibles(hay: {
  tarjeta: boolean;
  zelle: boolean;
  transferencia: boolean;
  wire: boolean;
}): MetodoVisible[] {
  return METODOS_EN_ORDEN.filter((m) => hay[m]);
}

/**
 * ¿Se enseña la forma de pago directa, sin obligar a elegir?
 *
 * Solo cuando de verdad hay UNA. Un «elige método» con una sola opción es una
 * pantalla de más; pero enseñar una sola cuando hay dos —el cable, o la
 * segunda cuenta— es dejar a quien paga sin la salida que sí existía.
 *
 * `haySegundaCuenta` cuenta como opción aunque no sea un método aparte: se
 * elige dentro de la transferencia, y si no se dibuja el selector no hay
 * dónde elegirla.
 */
export function seEnsenaDirecto(
  disponibles: readonly MetodoVisible[],
  haySegundaCuenta: boolean,
): boolean {
  return disponibles.length === 1 && !haySegundaCuenta;
}
