/**
 * LOS ENLACES FIRMADOS DE `/media` (1 nov 2026).
 *
 * Las capturas de los casos de ayuda viven en una carpeta privada
 * (`ayuda/`). Las abre quien tenga un enlace firmado: la persona en su chat
 * y el gerente de correo desde la lista de casos. La firma es un HMAC-SHA256
 * de la ruta y del vencimiento, con un prefijo propio para que esta llave no
 * sirva para firmar ninguna otra cosa. Vale `VIGENCIA_S` (8 días: el
 * contrato pide al menos 7).
 */

export const VIGENCIA_S = 8 * 24 * 60 * 60;

async function hmac(secreto: string, texto: string): Promise<string> {
  const llave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`media-firmada:${secreto}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = new Uint8Array(
    await crypto.subtle.sign("HMAC", llave, new TextEncoder().encode(texto)),
  );
  return btoa(String.fromCharCode(...firma))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** La parte de la dirección que firma una ruta: `?vence=…&firma=…`. */
export async function firmarRuta(
  ruta: string,
  secreto: string,
  ahoraS = Math.floor(Date.now() / 1000),
): Promise<string> {
  const vence = ahoraS + VIGENCIA_S;
  return `vence=${vence}&firma=${await hmac(secreto, `${ruta}|${vence}`)}`;
}

/** ¿La firma es buena y no venció? Se compara en tiempo constante. */
export async function firmaValida(
  ruta: string,
  vence: string | null,
  firma: string | null,
  secreto: string | null | undefined,
  ahoraS = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!secreto || !vence || !firma || !/^\d+$/.test(vence)) return false;
  if (Number(vence) < ahoraS) return false;
  const esperada = await hmac(secreto, `${ruta}|${vence}`);
  let diferencia = esperada.length ^ firma.length;
  for (let i = 0; i < Math.min(esperada.length, firma.length); i++) {
    diferencia |= esperada.charCodeAt(i) ^ firma.charCodeAt(i);
  }
  return diferencia === 0;
}

/** La llave para firmar: la del reloj, que el sitio siempre tiene cargada. */
export function secretoDeFirma(
  env: Record<string, string | undefined>,
): string | null {
  return (
    env.SINCRONIZAR_LLAVE?.trim() ||
    env.GERENTE_SECRETO?.trim() ||
    env.BETTER_AUTH_SECRET?.trim() ||
    null
  );
}
