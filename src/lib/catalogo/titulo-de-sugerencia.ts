/**
 * El título que se enseña en el desplegable del buscador según el idioma de
 * la página (8 nov 2026: en /en salían los títulos en español). Sin inglés,
 * el español. Pura y sin base: la usa el componente del navegador.
 */
export function tituloDeSugerencia(
  s: { titulo: string; tituloEn?: string | null },
  idioma: string,
): string {
  const en = s.tituloEn?.trim();
  return idioma === "en" && en ? en : s.titulo;
}
