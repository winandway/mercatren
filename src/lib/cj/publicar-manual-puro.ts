/**
 * La parte pura de «publicar con flete manual» (9 sep 2026), sin base ni
 * «server-only», para poder probarla. Ver `publicar-manual.ts`.
 */

/** El nombre del transporte cuando el envío lo puso una persona. No es
 *  regional (ver REGIONALES en riesgo.ts): el barrido no lo retira. */
export const TRANSPORTE_MANUAL = "Manual (persona)";

/** Tope: $500 el envío. Más que eso no es un flete, es un error de tecleo. */
export const FLETE_MANUAL_MAX_CENTAVOS = 50_000;

export function fleteManualValido(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0 &&
    valor <= FLETE_MANUAL_MAX_CENTAVOS
  );
}
