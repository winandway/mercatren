/**
 * EL PRECIO DE UN PRODUCTO DE CJ VENDIDO EN COLOMBIA.
 *
 * ══ LA MISMA CADENA DE CHILE, CON DOS DIFERENCIAS ══
 *
 * 1. **Sin IVA nuestro.** En Colombia no hay régimen simplificado registrado
 *    como el del SII chileno: los impuestos de entrada los maneja la aduana y
 *    los asume quien corresponda según lo que el dueño decida ANTES de abrir
 *    la venta (está en PENDIENTES como decisión de negocio). Aquí no se cobra
 *    ni se declara nada — inventar un impuesto que nadie nos mandó a cobrar
 *    sería tan grave como no cobrar el que sí.
 * 2. **Sin tope de USD 500.** El tope es la frontera del régimen chileno; en
 *    Colombia no aplica.
 *
 * Lo demás es idéntico y a propósito: costo + flete en dólares, 30 % de
 * margen y procesador dentro con la fórmula de EE. UU., y pesos colombianos
 * ENTEROS (el COP no tiene centavos, igual que el CLP — `mercado/moneda.ts`
 * ya lo sabe).
 */

import { COMISION_CL_PB } from "@/lib/destino/precio-chile";

/** El mismo 30 %: quien compra, despacha y responde es Mercatren. */
export const COMISION_CO_PB = COMISION_CL_PB;

/** Bajo 1.000 COP por dólar no es una tasa: es un dedo de menos. El peso
 * colombiano ronda los 4.000 por dólar; una tasa rota multiplicaría el
 * catálogo entero a precio de regalo. En centésimas: 100000 = $1.000,00. */
const TASA_MINIMA_CENTESIMAS = 100_000;

export type DesgloseColombia = {
  /** Lo que se publica: PESOS COLOMBIANOS enteros. */
  publicadoCop: number;
  /** La base en dólares (costo + flete + margen + procesador). */
  baseUsdCentavos: number;
};

export function desglosarColombia(
  costoProductoUsdCentavos: number,
  costoEnvioUsdCentavos: number,
  tasaCopCentesimas: number,
): DesgloseColombia | null {
  if (
    !Number.isFinite(tasaCopCentesimas) ||
    tasaCopCentesimas < TASA_MINIMA_CENTESIMAS
  ) {
    return null;
  }

  const costo =
    Math.max(0, costoProductoUsdCentavos) + Math.max(0, costoEnvioUsdCentavos);
  if (costo === 0) return null;

  const PROCESADOR_PB = 290;
  const FIJO_CENTAVOS = 30;
  const baseUsd = Math.ceil(
    ((costo + FIJO_CENTAVOS) * 10_000) /
      (10_000 - COMISION_CO_PB - PROCESADOR_PB),
  );

  /* Centavos/100 = dólares; centésimas/100 = pesos por dólar → /10.000.
     Con techo: un peso de menos sale del margen en cada venta. */
  const publicadoCop = Math.ceil((baseUsd * tasaCopCentesimas) / 10_000);

  return { publicadoCop, baseUsdCentavos: baseUsd };
}
