/**
 * EL TOPE DIARIO DE GEMINI: CUÁNTO PUEDE GASTAR LA IA DE TEXTO EN UN DÍA.
 *
 * ══ POR QUÉ EXISTE (29 oct 2026) ══
 *
 * Richard vio en el banco un cobro de «Google Cloud» de $25 cada dos o tres
 * días, sin parar, desde el 3 de septiembre: unos $9 al día, $270 al mes. Era
 * el traductor. El 2 de septiembre el sitio estrenó su reloj propio, que late
 * cada minuto, y en cada latido le pedía a Gemini una tanda de títulos al
 * español, otra al inglés y a veces descripciones — 1.440 latidos al día,
 * **sin ningún tope**. Lo que nadie limita no deja de gastar: se descubre en
 * el extracto del banco.
 *
 * ══ CÓMO FUNCIONA ══
 *
 * Cada llamada a Gemini cuesta UNIDADES: una tanda de títulos es una, cada
 * descripción es una (pesan como una tanda de veinte títulos). El día UTC
 * tiene `UNIDADES_POR_DIA`; cuando se acaban, el traductor dice que no —con
 * el motivo— y sigue mañana. Con el modelo sin «pensar»
 * (`thinkingBudget: 0`) una unidad cuesta ~$0,0015: el tope son unos
 * centavos al día, no nueve dólares.
 *
 * Subir el tope es una decisión de Richard, con el costo al día escrito al
 * lado, igual que la lista de modelos (`modelo-permitido.ts`).
 *
 * Esto es lo puro, para probarlo sin base. La cuenta del día vive en
 * `configuracion` y la lleva `gasto.ts`.
 */

/** ~150 × $0,0015 ≈ $0,25 al día, unos $7 al mes. */
export const UNIDADES_POR_DIA = 150;

/** La llave de `configuracion` donde se lleva la cuenta: «AAAA-MM-DD:N». */
export const LLAVE_GASTO_IA = "ia_gasto_del_dia";

/** El día en UTC, que es como cuenta Google y como reinicia el reloj. */
export function diaUtc(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Cuántas unidades se gastaron HOY según lo guardado. Lo de otro día, o lo
 * que no se entienda, cuenta como cero: el día nuevo empieza limpio.
 */
export function unidadesGastadas(
  valor: string | null | undefined,
  hoy: string,
): number {
  const [dia, cuantas] = (valor ?? "").split(":");
  if (dia !== hoy) return 0;
  const n = Number(cuantas);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** ¿Alcanza lo que queda del día para gastar estas unidades? */
export function alcanza(
  gastadas: number,
  unidades: number,
  tope = UNIDADES_POR_DIA,
): boolean {
  return gastadas + unidades <= tope;
}

/** El motivo que ve el equipo cuando el tope frena una llamada. */
export const MOTIVO_TOPE =
  "Se acabó el presupuesto de hoy para la IA de Google (tope diario en src/lib/ia/presupuesto.ts). Sigue mañana sola.";

/**
 * ══ LAS DESCRIPCIONES SALEN DEL RELOJ (29 oct 2026) ══
 *
 * Traducir una descripción cuesta lo que veinte títulos, y el reloj las
 * traducía —y las traía de CJ para traducirlas— todo el día, para un
 * catálogo cuya venta en Estados Unidos está en pausa. Las fichas siguen con
 * su descripción en inglés, y el botón del panel sigue traduciendo cuando el
 * equipo lo pida. Volver a encenderlo es decisión de Richard.
 */
export const DESCRIPCIONES_EN_EL_RELOJ = false;
