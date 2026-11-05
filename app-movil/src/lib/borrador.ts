/**
 * NINGÚN FORMULARIO PIERDE LO ESCRITO (regla de Richard). Las reglas puras del
 * borrador; el gancho que lo guarda en el teléfono es `hooks/use-borrador.ts`.
 *
 * - La llave lleva el formulario y la cuenta: en un teléfono compartido no
 *   aparece lo que escribió otra persona.
 * - Lo sensible NUNCA se guarda: contraseñas, PIN, códigos, tarjeta, CVV.
 */
export const PREFIJO_BORRADOR = "mercatren:borrador";

export function llaveDeBorrador(
  formulario: string,
  cuenta: string | null | undefined,
): string {
  return `${PREFIJO_BORRADOR}:${formulario}:${cuenta || "sin-cuenta"}`;
}

/* «codigo» es el código de un solo uso, NO el código postal: con «codigo» a
   secas, el borrador del pago tiraba el código postal y, al volver, había que
   escribirlo otra vez (5 nov 2026). */
const SENSIBLE =
  /clave|contrase|password|pin\b|codigo(?!postal)|code|otp|tarjeta|card|cvv|cvc/i;

export function sinSensibles<T extends Record<string, string>>(
  valores: T,
): Partial<T> {
  const limpio: Partial<T> = {};
  for (const [campo, valor] of Object.entries(valores) as Array<
    [keyof T, string]
  >) {
    if (!SENSIBLE.test(String(campo))) limpio[campo] = valor as T[keyof T];
  }
  return limpio;
}

/** ¿Hay algo escrito que valga la pena guardar? */
export function hayAlgoEscrito(
  valores: Record<string, string | undefined>,
): boolean {
  return Object.values(valores).some(
    (v) => typeof v === "string" && v.trim() !== "",
  );
}

/** Lo guardado, leído con cuidado: solo textos, y nada sensible aunque venga. */
export function leerBorrador(
  crudo: string | null,
): Record<string, string> | null {
  if (!crudo) return null;
  try {
    const v = JSON.parse(crudo) as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) return null;
    const textos = Object.fromEntries(
      Object.entries(v as Record<string, unknown>).filter(
        (par): par is [string, string] => typeof par[1] === "string",
      ),
    );
    const limpio = sinSensibles(textos) as Record<string, string>;
    return hayAlgoEscrito(limpio) ? limpio : null;
  } catch {
    return null;
  }
}
