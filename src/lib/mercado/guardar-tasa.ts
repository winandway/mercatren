/** Refrescar la fecha de una tasa que no cambió, como mucho una vez por hora. */
export const REFRESCAR_TASA_CADA_MS = 60 * 60_000;

/**
 * ¿Hay que escribir la tasa en la base? (8 nov 2026). Esto corre desde una
 * VISITA (la ficha de Chile), una vez por instancia cada 90 s: escribir siempre
 * eran dos upserts por instancia aunque la tasa fuera la misma. Solo se escribe
 * si cambió o si la fecha guardada tiene más de una hora.
 */
export function hayQueGuardarTasa(
  guardada: number | null,
  fecha: number | null,
  nueva: number,
  ahora: number,
): boolean {
  if (guardada !== nueva) return true;
  return fecha === null || ahora - fecha > REFRESCAR_TASA_CADA_MS;
}
