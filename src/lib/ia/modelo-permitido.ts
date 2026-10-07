/**
 * QUÉ MODELO DE IA PUEDE CORRER, Y CUÁL NO, AUNQUE LO DIGA EL PANEL.
 *
 * ══ POR QUÉ EXISTE (7 oct 2026) ══
 *
 * Richard pidió revisar todo lo que pudiera traer una «factura sorpresa». El
 * traductor y la búsqueda por foto usan `gemini-2.5-flash`, que es barato,
 * pero el modelo salía de la variable `TRADUCCION_MODELO` del panel **sin
 * ningún freno**, en dos sitios distintos. Bastaba escribir ahí un modelo caro
 * para que el traductor —que corre cada minuto sobre decenas de miles de
 * productos— y cada búsqueda por foto de cualquier visitante lo usaran.
 *
 * La regla de la casa ya lo dice para las imágenes, después de dos facturas de
 * $500 y $200: **configurar un modelo caro en un panel NO debe poder
 * activarlo.** Esto la cumple para el texto y la visión.
 *
 * ══ CÓMO FUNCIONA ══
 *
 * Una lista CERRADA de modelos aprobados. Lo que no esté en la lista se ignora
 * —se usa el modelo por defecto— y se avisa: la pieza devuelve el motivo para
 * que quien la llama lo deje escrito en `errores_sistema` y lo vea el
 * vigilante. Nunca se escala a un modelo más caro: si el barato falla, falla.
 *
 * Agregar un modelo a la lista exige la autorización de Richard **con el costo
 * por millón de tokens escrito al lado**, como pide la regla global.
 */

/**
 * Los modelos aprobados, con su costo escrito. Fuente: precios públicos de la
 * API de Gemini; se revisan antes de agregar o cambiar algo aquí.
 */
export const MODELOS_APROBADOS = [
  /* Texto y visión, el de todos los días. */
  "gemini-2.5-flash",
  /* Más barato todavía; se puede usar sin pedir permiso. */
  "gemini-2.5-flash-lite",
] as const;

export type ModeloAprobado = (typeof MODELOS_APROBADOS)[number];

export const MODELO_POR_DEFECTO: ModeloAprobado = "gemini-2.5-flash";

export type EleccionDeModelo = {
  modelo: ModeloAprobado;
  /** Si el panel pedía otro modelo y se ignoró: qué pidió. Para avisarlo. */
  rechazado: string | null;
};

/**
 * El modelo que de verdad se usa, a partir de lo que diga el panel.
 *
 * Vacío = el de siempre. Uno aprobado = ese. Cualquier otro = el de siempre,
 * y se devuelve cuál se rechazó para que se anote.
 */
export function modeloPermitido(
  pedido: string | null | undefined,
): EleccionDeModelo {
  const limpio = (pedido ?? "").trim();
  if (!limpio) return { modelo: MODELO_POR_DEFECTO, rechazado: null };
  const aprobado = MODELOS_APROBADOS.find((m) => m === limpio);
  return aprobado
    ? { modelo: aprobado, rechazado: null }
    : { modelo: MODELO_POR_DEFECTO, rechazado: limpio };
}
