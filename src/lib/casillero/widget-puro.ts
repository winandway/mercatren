/**
 * La parte PURA de los cerrojos del widget (9 sep 2026): sin base ni
 * «server-only», para poder probarla. Ver `widget.ts`.
 */

import { nanoid } from "nanoid";

/** Cuántas altas admite una misma IP con una misma clave, y en cuánto rato. */
export const TOPE_POR_VENTANA = 5;
export const VENTANA_MS = 10 * 60_000;
/** Un formulario llenado en menos de esto lo llenó una máquina. */
export const SEGUNDOS_MINIMOS = 3;

/** Compara el `Origin` con el dominio autorizado, sin dejarse engañar. */
export function dominioAutorizado(
  origen: string | null,
  dominio: string,
): boolean {
  if (!origen) return false;
  let host: string;
  try {
    host = new URL(origen).hostname.toLowerCase();
  } catch {
    return false;
  }
  const esperado = dominio
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  const limpio = host.replace(/^www\./, "");
  /* Subdominios sí, parecidos NO: «tienda.ejemplo.com» vale para
     «ejemplo.com», pero «ejemplo.com.malo.net» no. El punto delante es lo
     que marca la diferencia. */
  return limpio === esperado || limpio.endsWith(`.${esperado}`);
}

/** Crea un origen nuevo con su clave. La clave se enseña una sola vez. */
export function nuevaClavePublica(): string {
  return `pk_${nanoid(24).replace(/[^A-Za-z0-9]/g, "x")}`;
}
