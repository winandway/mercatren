/**
 * «MIS DATOS»: las reglas de la pantalla, puras (las prueba el sitio en
 * `tests/unit/app-movil-mis-datos.test.ts`). Son las mismas del servidor
 * (`src/lib/cuenta/cambio-de-datos.ts`) y del cambio de contraseña de la web
 * (`components/cuenta/cambiar-clave.tsx`: mínimo 10 y repetida igual).
 */
export const NOMBRE_MINIMO = 2;
export const NOMBRE_MAXIMO = 100;
export const CLAVE_MINIMA = 10;

export function nombreValido(nombre: string): boolean {
  const limpio = nombre.trim();
  return limpio.length >= NOMBRE_MINIMO && limpio.length <= NOMBRE_MAXIMO;
}

/** El primer problema del cambio de contraseña, o `null`. */
export function problemaDeClave(
  actual: string,
  nueva: string,
  repetida: string,
): "faltaClave" | "claveCorta" | "clavesNoCoinciden" | null {
  if (!actual) return "faltaClave";
  if (nueva.length < CLAVE_MINIMA) return "claveCorta";
  if (nueva !== repetida) return "clavesNoCoinciden";
  return null;
}
