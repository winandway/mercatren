/**
 * La parte PURA de la lista de prioridad del afinado (9 sep 2026): sin base
 * ni «server-only», para que se pueda probar. Ver `prioridad.ts`.
 */
/** Tope de la lista: es para «este y este», no para reordenar el catálogo. */
export const TOPE_PRIORIDAD = 50;

/** Puro: agrega al final sin repetir y sin pasarse del tope (lo más viejo sale). */
export function agregarAPrioridad(
  lista: readonly string[],
  id: string,
  tope = TOPE_PRIORIDAD,
): string[] {
  const limpio = id.trim();
  if (!limpio) return [...lista];
  const sinEl = lista.filter((x) => x !== limpio);
  const nueva = [...sinEl, limpio];
  return nueva.slice(Math.max(0, nueva.length - tope));
}

/** Puro: lee la lista guardada; cualquier basura vale como lista vacía. */
export function leerLista(crudo: string | null | undefined): string[] {
  if (!crudo) return [];
  try {
    const v = JSON.parse(crudo) as unknown;
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "")
      : [];
  } catch {
    return [];
  }
}
