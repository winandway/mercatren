import type { Mercado } from "@/lib/mercado/mercados";

/**
 * LA MONEDA DE CADA PAÍS, Y CUÁNTAS PARTES TIENE.
 *
 * ══ EL PESO CHILENO NO TIENE CENTAVOS ══
 *
 * Y eso no es un detalle de formato: cambia la aritmética. Todo el dinero del
 * proyecto se guarda en la UNIDAD MENOR de su moneda (regla dura: enteros,
 * nunca decimales). En dólares la unidad menor es el centavo, así que $10.50
 * son 1050. En pesos chilenos **la unidad menor es el peso**, así que $5.990
 * son 5990 — no 599000.
 *
 * Dividir siempre entre 100 —que es lo que hacía `formatearPrecio`— convertiría
 * un producto de 5.990 pesos en uno de 59 pesos con 90. Un cero de más o de
 * menos en un precio no es un error de pantalla: es una venta a pérdida o un
 * cliente que se va.
 *
 * ══ POR QUÉ SALE DE UNA TABLA Y NO DE UN `if` ══
 *
 * Porque la lista va a crecer: Colombia y México también manejan monedas sin
 * centavos. Con un `if (moneda === "CLP")` repartido por las pantallas, el
 * primer país nuevo repite el fallo en los sitios donde nadie se acordó.
 *
 * La lista es la del estándar ISO 4217, que es lo que entiende `Intl`. Se
 * declaran solo las que NO tienen dos decimales: dos es lo normal y sería
 * ruido escribirlo cien veces.
 */

/** Monedas cuya unidad menor NO es la centésima parte. */
const DECIMALES_ESPECIALES: Record<string, number> = {
  /* Chile, Colombia, Paraguay, Japón, Corea: la unidad menor es la moneda. */
  CLP: 0,
  COP: 0,
  PYG: 0,
  JPY: 0,
  KRW: 0,
  ISK: 0,
  VND: 0,
  /* Dinares: tres decimales. */
  BHD: 3,
  JOD: 3,
  KWD: 3,
  TND: 3,
};

/** Cuántos decimales tiene esta moneda. Dos, salvo que diga lo contrario. */
export function decimalesDe(moneda: string): number {
  return DECIMALES_ESPECIALES[moneda.toUpperCase()] ?? 2;
}

/**
 * Por cuánto hay que dividir lo guardado para llegar al número que se enseña.
 *
 * En dólares es 100 (los centavos de siempre); en pesos chilenos es 1, porque
 * lo guardado YA son pesos.
 */
export function divisorDe(moneda: string): number {
  return 10 ** decimalesDe(moneda);
}

/** La moneda de cada mercado. */
const MONEDA_POR_MERCADO: Record<string, string> = {
  US: "USD",
  /* Decidido por el dueño el 17 ago 2026: Chile vende en pesos chilenos. */
  CL: "CLP",
};

/**
 * En qué moneda vende este país.
 *
 * Un mercado sin moneda declarada cae en dólares, que es lo que hay hoy: es
 * el respaldo con datos de verdad detrás, y un precio en la moneda equivocada
 * se nota enseguida — mucho mejor que una pantalla en blanco.
 */
export function monedaDelMercado(mercado: Mercado): string {
  return MONEDA_POR_MERCADO[mercado.codigo] ?? "USD";
}
