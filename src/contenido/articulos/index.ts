import { ARTICULOS_EN } from "./en";
import { ARTICULOS_ES } from "./es";
import type { Articulo, TipoArticulo } from "./tipos";

/**
 * De dónde salen los artículos, en el idioma que toque.
 *
 * Los dos idiomas comparten `slug` a propósito: así una misma página tiene una
 * sola dirección con sus dos versiones, y Google entiende que son la misma cosa
 * en otro idioma en vez de contarlas como duplicados.
 */
export function articulosDe(idioma: string): Articulo[] {
  const lista = idioma === "en" ? ARTICULOS_EN : ARTICULOS_ES;
  // El más nuevo primero, siempre.
  return [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function articulosPorTipo(
  idioma: string,
  tipo: TipoArticulo,
): Articulo[] {
  return articulosDe(idioma).filter((a) => a.tipo === tipo);
}

export function buscarArticulo(
  idioma: string,
  slug: string,
): Articulo | undefined {
  return articulosDe(idioma).find((a) => a.slug === slug);
}

/**
 * Todos los slugs, sin repetir.
 *
 * Los usa el mapa del sitio y la generación de páginas. Sale de los DOS
 * idiomas: si un artículo solo existiera en uno, su dirección tiene que
 * existir igual — mejor que caiga en el idioma que hay que en un 404.
 */
export function todosLosSlugs(): string[] {
  return [...new Set([...ARTICULOS_ES, ...ARTICULOS_EN].map((a) => a.slug))];
}

/** La dirección pública de un artículo, según lo que sea. */
export function rutaDeArticulo(articulo: Articulo): string {
  return articulo.tipo === "novedad"
    ? `/blog/${articulo.slug}`
    : `/docs/${articulo.slug}`;
}
