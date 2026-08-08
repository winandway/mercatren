/**
 * LOS TOKENS DE LAS PLATAFORMAS SOCIAS.
 *
 * Hay dos credenciales distintas y conviene no confundirlas:
 *
 *  - **La llave de socio** (`SOCIO_LLAVE`), una sola para toda la plataforma.
 *    Solo sirve para VINCULAR una tienda. Es la más peligrosa: quien la tenga
 *    puede pedir tokens de cualquier tienda.
 *  - **El token por tienda**, que se entrega al vincular y solo sirve para el
 *    catálogo de ESA tienda.
 *
 * ══ POR QUÉ SE GUARDA HASHEADO ══
 *
 * El token deja escribir en el catálogo de un comercio: cambiar precios,
 * despublicar productos. Guardarlo en claro convierte una copia de la base —un
 * respaldo, un volcado para depurar— en la llave de todas las tiendas. Se
 * guarda el SHA-256 y el token en claro se enseña UNA sola vez, al vincular.
 *
 * ══ POR QUÉ LA COMPARACIÓN ES DE TIEMPO CONSTANTE ══
 *
 * Comparar con `===` corta en la primera letra distinta, y esa diferencia de
 * microsegundos se puede medir desde fuera: se adivina el token letra por
 * letra sin conocerlo. Aquí se comparan los 64 caracteres siempre, tarde lo
 * que tarde.
 */

/** Un token nuevo. 32 bytes de azar del sistema, en hexadecimal. */
export function generarToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** El SHA-256 de un token, que es lo único que se guarda. */
export async function hashDeToken(token: string): Promise<string> {
  const datos = new TextEncoder().encode(token);
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(resumen)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compara dos textos sin delatar en qué letra se diferencian.
 *
 * Si son de largo distinto se responde `false`, pero recorriendo igual el
 * primero: devolver de inmediato ya diría cuánto mide el bueno.
 */
export function igualesEnTiempoConstante(a: string, b: string): boolean {
  let diferencia = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i % (b.length || 1));
  }
  return diferencia === 0;
}

/** El token que viene en la cabecera, o `null` si no viene bien puesto. */
export function tokenDeLaPeticion(peticion: Request): string | null {
  const cabecera = peticion.headers.get("authorization") ?? "";
  const [tipo, valor] = cabecera.split(" ");
  if (tipo?.toLowerCase() !== "bearer") return null;
  const token = valor?.trim();
  return token ? token : null;
}
