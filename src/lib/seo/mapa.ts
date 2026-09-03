/**
 * EL MAPA DEL SITIO, PARTIDO EN TROZOS (2 sep 2026).
 *
 * Google no admite más de 50.000 direcciones ni 50 MB por archivo. Con el
 * almacén completo de CJ dentro —cien mil fichas— un solo `sitemap.xml`
 * quedaba fuera de norma y Google lo descartaría ENTERO, con las páginas
 * fijas y las tiendas dentro.
 *
 * Ahora `/sitemap.xml` es un ÍNDICE que apunta a `/mapa/paginas.xml` (lo
 * fijo, el blog y la documentación), `/mapa/tiendas.xml`, `/mapa/videos.xml`
 * (un mapa de VIDEOS de verdad, con portada, título, archivo y duración) y a
 * `/mapa/productos-N.xml`, de 40.000 fichas cada uno CON su foto. La dirección que ya conoce Search Console no
 * cambia. Las funciones de este archivo no tocan red ni base: reciben datos
 * y devuelven XML, y por eso se prueban.
 */

/** Por debajo del tope de 50.000: deja margen y mantiene cada archivo lejos
 *  de los 50 MB (cada ficha lleva sus dos idiomas y el x-default). */
export const POR_PARTE = 40_000;

export type Frecuencia =
  "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export type EntradaMapa = {
  /** Sin idioma delante: «/producto/x». Se escribe con cada idioma. */
  ruta: string;
  prioridad: number;
  frecuencia: Frecuencia;
  modificado?: Date | null;
  /** La foto principal, absoluta: Google la indexa en Imágenes y la enseña
   *  en el resultado. Sin ella, una ficha de producto es texto suelto. */
  imagen?: string | null;
};

/** Un video para el mapa de videos de Google (`<video:video>`). */
export type EntradaVideo = {
  ruta: string;
  titulo: string;
  descripcion: string;
  /** Absolutas: la portada y el archivo. */
  portada: string;
  archivo: string;
  duracionSegundos: number;
  vistas: number;
  publicado: Date | null;
  modificado?: Date | null;
};

/**
 * Las páginas fijas, en orden de importancia. OJO al agregar una página
 * pública: si no entra aquí, Google no la encuentra por el mapa.
 */
export const FIJAS: ReadonlyArray<readonly [string, number, Frecuencia]> = [
  ["", 1, "daily"],
  ["/catalogo", 0.9, "daily"],
  ["/tiendas", 0.8, "daily"],
  ["/docs/modelo-de-negocio", 0.9, "monthly"],
  ["/docs", 0.8, "monthly"],
  ["/blog", 0.8, "weekly"],
  ["/videos", 0.8, "daily"],
  ["/vender", 0.8, "monthly"],
  ["/como-funciona", 0.7, "monthly"],
  ["/nosotros", 0.7, "monthly"],
  ["/transparencia", 0.7, "monthly"],
  ["/vender/comisiones", 0.6, "monthly"],
  ["/ayuda", 0.6, "monthly"],
  /* Entrega y devoluciones: Merchant Center las exige publicadas y
     encontrables. */
  ["/entrega", 0.6, "monthly"],
  ["/devoluciones", 0.6, "monthly"],
  ["/terminos", 0.4, "yearly"],
  ["/privacidad", 0.4, "yearly"],
];

/** Lo que XML no soporta crudo. `&` primero o se escaparía dos veces. */
export function escaparXml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function fecha(d: Date | null | undefined): string {
  const valida =
    d instanceof Date && Number.isFinite(d.getTime()) ? d : new Date();
  return valida.toISOString();
}

/**
 * Un `urlset` con cada dirección en sus idiomas: la principal es la del
 * idioma por defecto, y cada idioma (más `x-default`) va como `xhtml:link`.
 * Es lo que hace que Google entienda que /es/... y /en/... son la misma
 * página y no dos que compiten.
 */
export function urlsetXml(o: {
  base: string;
  idiomas: readonly string[];
  porDefecto: string;
  entradas: EntradaMapa[];
}): string {
  const urls = o.entradas.map((e) => {
    const principal = `${o.base}/${o.porDefecto}${e.ruta}`;
    const alternos = o.idiomas
      .map(
        (idioma) =>
          `<xhtml:link rel="alternate" hreflang="${idioma}" href="${escaparXml(`${o.base}/${idioma}${e.ruta}`)}"/>`,
      )
      .join("");
    return [
      "<url>",
      `<loc>${escaparXml(principal)}</loc>`,
      `<lastmod>${fecha(e.modificado)}</lastmod>`,
      `<changefreq>${e.frecuencia}</changefreq>`,
      `<priority>${e.prioridad}</priority>`,
      alternos,
      `<xhtml:link rel="alternate" hreflang="x-default" href="${escaparXml(principal)}"/>`,
      e.imagen
        ? `<image:image><image:loc>${escaparXml(e.imagen)}</image:loc></image:image>`
        : "",
      "</url>",
    ].join("");
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
}

/**
 * EL MAPA DE VIDEOS, con lo que Google pide para indexar un video como
 * video (y no como una página más): portada, título, descripción, el
 * archivo, la duración y las vistas. Sin esto, los Shorts eran direcciones
 * sueltas y Google no sabía que había un video detrás.
 */
export function videosXml(o: {
  base: string;
  idiomas: readonly string[];
  porDefecto: string;
  videos: EntradaVideo[];
}): string {
  const urls = o.videos.map((v) => {
    const principal = `${o.base}/${o.porDefecto}${v.ruta}`;
    const alternos = o.idiomas
      .map(
        (idioma) =>
          `<xhtml:link rel="alternate" hreflang="${idioma}" href="${escaparXml(`${o.base}/${idioma}${v.ruta}`)}"/>`,
      )
      .join("");
    return [
      "<url>",
      `<loc>${escaparXml(principal)}</loc>`,
      `<lastmod>${fecha(v.modificado ?? v.publicado)}</lastmod>`,
      alternos,
      "<video:video>",
      `<video:thumbnail_loc>${escaparXml(v.portada)}</video:thumbnail_loc>`,
      `<video:title>${escaparXml(v.titulo.slice(0, 100))}</video:title>`,
      `<video:description>${escaparXml(v.descripcion.slice(0, 2048))}</video:description>`,
      `<video:content_loc>${escaparXml(v.archivo)}</video:content_loc>`,
      `<video:duration>${Math.max(1, Math.round(v.duracionSegundos))}</video:duration>`,
      `<video:view_count>${Math.max(0, Math.round(v.vistas))}</video:view_count>`,
      v.publicado
        ? `<video:publication_date>${fecha(v.publicado)}</video:publication_date>`
        : "",
      "<video:family_friendly>yes</video:family_friendly>",
      "<video:live>no</video:live>",
      "</video:video>",
      "</url>",
    ].join("");
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join("\n")}
</urlset>`;
}

/** El índice: una entrada por trozo. */
export function indiceXml(
  partes: Array<{ loc: string; modificado?: Date | null }>,
): string {
  const filas = partes.map(
    (p) =>
      `<sitemap><loc>${escaparXml(p.loc)}</loc><lastmod>${fecha(p.modificado)}</lastmod></sitemap>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${filas.join("\n")}
</sitemapindex>`;
}

/** Cuántos trozos hacen falta para `total` productos. Cero productos, cero. */
export function partesDeProductos(total: number): number {
  if (!(total > 0)) return 0;
  return Math.ceil(total / POR_PARTE);
}

/** Qué trozo se está pidiendo: «paginas.xml» o «productos-N.xml». */
export function leerParte(
  nombre: string,
):
  | { tipo: "paginas" }
  | { tipo: "tiendas" }
  | { tipo: "videos" }
  | { tipo: "productos"; indice: number }
  | null {
  if (nombre === "paginas.xml") return { tipo: "paginas" };
  if (nombre === "tiendas.xml") return { tipo: "tiendas" };
  if (nombre === "videos.xml") return { tipo: "videos" };
  const m = /^productos-(\d{1,4})\.xml$/.exec(nombre);
  if (!m) return null;
  return { tipo: "productos", indice: Number(m[1]) };
}
