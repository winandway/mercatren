/**
 * LA FIRMA DE LOS AVISOS AL SISTEMA DEL COMERCIO.
 *
 * Vive aparte del envío y SIN `server-only` a propósito: es una función pura
 * que hay que poder probar, y el otro lado (el sistema del comercio) hace
 * exactamente lo mismo con el mismo secreto para comprobar que el aviso viene
 * de nosotros. Sin firma, cualquiera que averigüe su dirección podría decirle
 * que le pagaron una factura.
 */
export async function firmar(cuerpo: string, secreto: string): Promise<string> {
  const llave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign(
    "HMAC",
    llave,
    new TextEncoder().encode(cuerpo),
  );
  return [...new Uint8Array(firma)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
