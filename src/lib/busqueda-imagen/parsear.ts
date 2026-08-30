/**
 * El parseo de lo que contesta Gemini — puro, para poder probarlo.
 *
 * ══ NADA DE LO QUE DEVUELVE EL MODELO SE CREE SIN COMPROBAR ══
 * (la misma regla del traductor): un JSON roto, términos vacíos o una
 * parrafada convertida en "término" no pasan. Mejor decir «no se pudo leer
 * la foto» que buscar basura en el catálogo.
 */

export type TerminosDeLaFoto =
  | { ok: true; es: string[]; en: string[]; descripcion: string }
  | { ok: false; motivo: string };

function limpiarLista(cruda: unknown): string[] {
  if (!Array.isArray(cruda)) return [];
  return (
    cruda
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      /* Un "término" de más de 60 letras es una descripción, no una búsqueda. */
      .filter((t) => t.length > 0 && t.length <= 60)
      .slice(0, 5)
  );
}

export function extraerTerminos(texto: string): TerminosDeLaFoto {
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: "La respuesta del ojo no fue un JSON." };
  }
  const objeto = crudo as { es?: unknown; en?: unknown; descripcion?: unknown };
  const es = limpiarLista(objeto.es);
  const en = limpiarLista(objeto.en);
  if (es.length === 0 && en.length === 0) {
    return { ok: false, motivo: "El ojo no devolvió ningún término usable." };
  }
  const descripcion =
    typeof objeto.descripcion === "string"
      ? objeto.descripcion.trim().slice(0, 300)
      : "";
  return { ok: true, es, en, descripcion };
}

/**
 * ¿El enlace que pegó el equipo es una ficha NUESTRA?
 *
 * El correo del aviso sale con nuestra firma: un link ajeno ahí es phishing
 * firmado por nosotros. Solo fichas de producto de los tres dominios.
 */
export function esEnlaceDeProductoNuestro(enlace: string): boolean {
  return /^https:\/\/(mercatren\.com|mercatren\.cl|mercatren\.com\.co)\/(es|en)\/producto\/[a-z0-9-]+$/.test(
    enlace.trim(),
  );
}
