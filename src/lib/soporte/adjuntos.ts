/**
 * LAS REGLAS DE LAS CAPTURAS DE UN CASO (1 nov 2026): hasta 3 por mensaje,
 * jpg, png, webp o heic, 10 MB cada una. Puro, para probarlo sin base.
 */

export const MAX_ADJUNTOS = 3;
export const MAX_BYTES = 10 * 1024 * 1024;

const EXTENSION_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heic",
};

/** El iPhone a veces manda la foto HEIC sin tipo: se mira la extensión. */
export function tipoDe(nombre: string, tipo: string): string | null {
  const t = tipo.trim().toLowerCase();
  if (EXTENSION_POR_TIPO[t]) return t === "image/heif" ? "image/heic" : t;
  const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

export function extensionDe(tipo: string): string {
  return EXTENSION_POR_TIPO[tipo] ?? "bin";
}

export type ProblemaAdjunto = "demasiados" | "tipo" | "grande" | "vacio";

/** ¿Se pueden guardar estos archivos? Devuelve el primer problema, o null. */
export function revisarAdjuntos(
  archivos: { name: string; type: string; size: number }[],
): ProblemaAdjunto | null {
  if (archivos.length > MAX_ADJUNTOS) return "demasiados";
  for (const a of archivos) {
    if (a.size === 0) return "vacio";
    if (!tipoDe(a.name, a.type)) return "tipo";
    if (a.size > MAX_BYTES) return "grande";
  }
  return null;
}

/** El nombre que se guarda: sin rutas ni caracteres raros, y corto. */
export function nombreLimpio(nombre: string): string {
  const base = nombre.split(/[\\/]/).pop() ?? "captura";
  return base.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 120) || "captura";
}
