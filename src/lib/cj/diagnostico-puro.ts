/**
 * LO PURO DEL DIAGNÓSTICO DE COMPRAS A CJ (5 sep 2026).
 *
 * Sin `server-only` a propósito: estas dos funciones no tocan red ni base y
 * son justo lo que hay que poder probar en un vitest. El resto del
 * diagnóstico —lo que le habla a CJ— sigue en `diagnostico.ts`.
 */

/** Saca el slug de una dirección de producto o de un slug pelado. */
export function slugDeLaUrl(entrada: string): string | null {
  const texto = entrada.trim();
  if (!texto) return null;
  /* Se admite el enlace completo Y el slug suelto: el dueño va a pegar lo que
     tenga a mano, y rechazar un slug porque no es una URL es una pared. */
  const conBarra = texto.match(/\/producto\/([^/?#]+)/);
  if (conBarra?.[1]) return decodeURIComponent(conBarra[1]);
  if (/^https?:\/\//i.test(texto)) return null;
  return texto.replace(/^\/+|\/+$/g, "") || null;
}

/**
 * ¿QUÉ ALMACENES NOMBRA CJ EN ESTA RESPUESTA?
 *
 * CJ no documenta un nombre fijo para el campo del almacén y cambia según el
 * endpoint (`countryCode`, `warehouseName`, `areaEn`…). En vez de adivinar
 * uno, se recogen TODOS los que aparezcan: lo que importa es poder ver si el
 * transporte elegido y el stock hablan del mismo sitio.
 */
export function almacenesNombrados(datos: unknown): string[] {
  const vistos = new Set<string>();
  const mirar = (v: unknown, hondo = 0) => {
    if (hondo > 4 || v === null || typeof v !== "object") return;
    if (Array.isArray(v)) {
      for (const x of v.slice(0, 60)) mirar(x, hondo + 1);
      return;
    }
    for (const [clave, valor] of Object.entries(v as Record<string, unknown>)) {
      if (
        /warehouse|almacen|areaEn|countryCode|fromCountry/i.test(clave) &&
        typeof valor === "string" &&
        valor.trim()
      ) {
        vistos.add(`${clave}=${valor.trim()}`);
      }
      mirar(valor, hondo + 1);
    }
  };
  mirar(datos);
  return [...vistos];
}
