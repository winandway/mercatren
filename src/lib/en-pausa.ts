/**
 * MERCATREN EN PAUSA: TODO LO QUE GASTA, APAGADO (29 oct 2026).
 *
 * Orden de Richard, al ver en el banco un cobro de «Google Cloud» de $25 cada
 * dos o tres días desde el 3 de septiembre: *«desactive todo por completo
 * hasta nuevo aviso… lleve a cero el gasto, porque Mercatren es un proyecto
 * que por ahora está parado y no produce nada»*.
 *
 * El sitio SIGUE en línea —la app está en revisión en Google Play y sus
 * revisores tienen que poder entrar—, pero nada trabaja solo ni le habla a una
 * IA de pago:
 *
 * - `IA_APAGADA`: ninguna llamada a Gemini (traductor, búsqueda por foto,
 *   índice visual) ni al asistente del panel. Es una constante del código y
 *   no una variable del panel, a propósito: lo que se apaga por dinero no se
 *   puede volver a encender escribiendo en una casilla.
 * - `RELOJ_APAGADO`: el latido de cada minuto, la sincronización y el
 *   vigilante contestan «apagado» sin tocar la base. Además el reloj se quitó
 *   de `yadominios.json` y los flujos programados de GitHub se desactivaron.
 *
 * Volver a encender es decisión de Richard. Cómo se hace, paso a paso, en
 * `AUDITORIA-GASTOS.md`.
 */
export const IA_APAGADA = true;
export const RELOJ_APAGADO = true;

export const MOTIVO_IA_APAGADA =
  "La IA de Google está apagada: Mercatren está en pausa por orden de Richard (29 oct 2026). Ver src/lib/en-pausa.ts.";
