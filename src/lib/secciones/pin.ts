/**
 * EL PIN DE 4 DÍGITOS DEL ENLACE DE SUBIDA.
 *
 * Vive aparte y **sin `server-only`** para poder probarlo, igual que la firma
 * de los webhooks. Usa la criptografía del runtime, así que corre en el borde.
 *
 * ══ POR QUÉ PBKDF2 Y NO UN SHA A SECAS ══
 *
 * Un PIN de cuatro dígitos son diez mil combinaciones: con SHA-256 pelado,
 * quien consiga una copia de la base las prueba todas en un parpadeo. Con
 * PBKDF2 y su sal, cada intento cuesta, y el ataque en la puerta lo corta el
 * límite de intentos. Ninguna de las dos cosas basta sola.
 */

const ITERACIONES = 100_000;

function aHex(datos: ArrayBuffer): string {
  return [...new Uint8Array(datos)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Una sal nueva, en hexadecimal. */
export function nuevaSal(): string {
  return aHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export async function derivarPin(pin: string, sal: string): Promise<string> {
  const llave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(sal),
      iterations: ITERACIONES,
      hash: "SHA-256",
    },
    llave,
    256,
  );
  return aHex(bits);
}

/**
 * ¿Es este el PIN?
 *
 * La comparación va **dígito a dígito hasta el final**, sin cortar en cuanto
 * encuentra una diferencia: si cortara, el tiempo que tarda en decir «no»
 * revelaría cuántos caracteres acertó.
 */
export async function pinCoincide(
  pin: string,
  hashGuardado: string | null,
  sal: string | null,
): Promise<boolean> {
  if (!hashGuardado || !sal) return false;
  const calculado = await derivarPin(pin, sal);
  if (calculado.length !== hashGuardado.length) return false;
  let diferencia = 0;
  for (let i = 0; i < calculado.length; i++) {
    diferencia |= calculado.charCodeAt(i) ^ hashGuardado.charCodeAt(i);
  }
  return diferencia === 0;
}

/**
 * La llave del enlace de subida: 24 bytes al azar.
 *
 * Es lo único que separa a cualquiera de la herramienta, así que se genera con
 * el generador criptográfico y no con `Math.random()`, que es predecible.
 */
export function nuevaLlaveDeSubida(): string {
  return aHex(crypto.getRandomValues(new Uint8Array(24)).buffer);
}
