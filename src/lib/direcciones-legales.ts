/**
 * LAS DIRECCIONES LEGALES VAN EN INGLÉS (7 nov 2026, regla de Richard para
 * Estados Unidos): `/privacy`, `/terms`, `/support`, `/returns` y `/shipping`.
 *
 * Las viejas (`/privacidad`, `/terminos`, `/ayuda`, `/devoluciones`, `/entrega`) estaban declaradas en Google Play
 * Console y en App Store Connect y circularon por correo y por Google: NUNCA
 * pueden romperse. Se redirigen con un 301 explícito (permanente, no 307 ni
 * 308) conservando el idioma y lo que venga después. Va en el middleware —el
 * único sitio que devuelve un código real; una redirección de página sale
 * como 200 con la dirección dentro del HTML— y ANTES del cierre de la tienda:
 * una dirección declarada en las tiendas no depende de que la tienda esté
 * abierta.
 *
 * Puro, para probarlo sin levantar nada. Candado:
 * `tests/unit/direcciones-legales-en-ingles.test.ts`.
 */

/** Lo viejo → lo nuevo. Lista cerrada. */
export const DIRECCIONES_LEGALES_VIEJAS: Readonly<Record<string, string>> = {
  privacidad: "privacy",
  terminos: "terms",
  ayuda: "support",
  devoluciones: "returns",
  entrega: "shipping",
};

const VIEJA =
  /^(\/(?:es|en))?\/(privacidad|terminos|ayuda|devoluciones|entrega)(\/.*)?$/;

/** La dirección nueva si esta es una vieja; `null` si no hay nada que mudar. */
export function direccionLegalNueva(ruta: string): string | null {
  const m = VIEJA.exec(ruta);
  if (!m) return null;
  const nueva = DIRECCIONES_LEGALES_VIEJAS[m[2] as string];
  if (!nueva) return null;
  return `${m[1] ?? ""}/${nueva}${m[3] ?? ""}`;
}
