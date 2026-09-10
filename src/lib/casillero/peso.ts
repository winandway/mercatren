/**
 * ══ PESO FACTURABLE: SE COBRA LO QUE OCUPA, NO LO QUE PESA ══
 *
 * En carga aérea el espacio manda. Una caja de almohadas pesa poco y ocupa
 * media bodega del avión, así que se cobra por el mayor entre el peso real
 * y el volumétrico. 166 es el divisor estándar internacional en pulgadas y
 * libras; se deja configurable porque cada agente usa el suyo.
 *
 * **El redondeo va explícito porque cambia lo que se cobra**: una caja de
 * 24×18×12 pulgadas da 31,23 libras exactas, que son 31,3 o 32 según el
 * modo. Y el cálculo se le enseña al cliente, o reclama — con razón.
 */

export const DIVISOR_VOLUMETRICO_AEREO = 166;
export const LB_POR_KG = 2.20462;
export const DIAS_ALMACENAJE_GRATIS = 30;

export type Medidas = {
  largoIn: number;
  anchoIn: number;
  altoIn: number;
};

/** exacto: el número real · decima: sube a 0,1 lb · libra: sube a la entera. */
export type ModoRedondeo = "exacto" | "decima" | "libra";

export type OpcionesPeso = {
  divisor?: number;
  minimoLb?: number;
  modo?: ModoRedondeo;
};

export function redondearLb(lb: number, modo: ModoRedondeo = "decima"): number {
  switch (modo) {
    case "exacto":
      return Math.round(lb * 100) / 100;
    case "libra":
      return Math.ceil(lb);
    case "decima":
    default:
      /* El épsilon evita que 31.2999999 suba a 31.4 por el binario. */
      return Math.ceil(lb * 10 - 1e-9) / 10;
  }
}

export function pesoVolumetricoLb(
  medidas: Medidas,
  opciones: OpcionesPeso = {},
): number {
  const { divisor = DIVISOR_VOLUMETRICO_AEREO, modo = "decima" } = opciones;
  if (divisor <= 0) throw new Error("El divisor volumétrico debe ser positivo");
  const { largoIn, anchoIn, altoIn } = medidas;
  if ([largoIn, anchoIn, altoIn].some((v) => v <= 0)) return 0;
  return redondearLb((largoIn * anchoIn * altoIn) / divisor, modo);
}

/**
 * El mayor entre el peso real y el volumétrico, nunca bajo el mínimo.
 *
 * El volumétrico se calcula EXACTO y se redondea una sola vez al final:
 * redondear dos veces sube el cobro sin motivo, y eso el cliente lo nota.
 */
export function pesoFacturableLb(
  pesoRealLb: number,
  medidas: Medidas | null,
  opciones: OpcionesPeso = {},
): number {
  const { minimoLb = 1, modo = "decima" } = opciones;
  const volumetrico = medidas
    ? pesoVolumetricoLb(medidas, { ...opciones, modo: "exacto" })
    : 0;
  return redondearLb(Math.max(pesoRealLb, volumetrico, minimoLb), modo);
}

export function kgALb(kg: number, modo: ModoRedondeo = "decima"): number {
  return redondearLb(kg * LB_POR_KG, modo);
}
