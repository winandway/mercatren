import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  FIJAS,
  POR_PARTE,
  escaparXml,
  indiceXml,
  leerParte,
  partesDeProductos,
  urlsetXml,
  videosXml,
} from "@/lib/seo/mapa";

/**
 * EL MAPA DEL SITIO PARTIDO (2 sep 2026): con cien mil fichas de CJ, un solo
 * sitemap pasaba del tope de Google (50.000 direcciones) y se descartaba
 * ENTERO. Ahora `/sitemap.xml` es un índice y los productos van en trozos.
 */
describe("los trozos", () => {
  it("cada trozo queda por debajo del tope de Google", () => {
    expect(POR_PARTE).toBeLessThanOrEqual(50_000);
    expect(partesDeProductos(0)).toBe(0);
    expect(partesDeProductos(1)).toBe(1);
    expect(partesDeProductos(POR_PARTE)).toBe(1);
    expect(partesDeProductos(POR_PARTE + 1)).toBe(2);
    expect(partesDeProductos(100_000)).toBe(3);
  });

  it("solo se sirven los nombres que existen", () => {
    expect(leerParte("paginas.xml")).toEqual({ tipo: "paginas" });
    expect(leerParte("tiendas.xml")).toEqual({ tipo: "tiendas" });
    expect(leerParte("videos.xml")).toEqual({ tipo: "videos" });
    expect(leerParte("productos-0.xml")).toEqual({
      tipo: "productos",
      indice: 0,
    });
    expect(leerParte("productos-12.xml")).toEqual({
      tipo: "productos",
      indice: 12,
    });
    expect(leerParte("productos-x.xml")).toBeNull();
    expect(leerParte("productos-1")).toBeNull();
    expect(leerParte("../etc/passwd")).toBeNull();
  });
});

describe("el XML", () => {
  it("cada dirección lleva sus dos idiomas y el x-default, como antes", () => {
    const xml = urlsetXml({
      base: "https://mercatren.cl",
      idiomas: ["es", "en"],
      porDefecto: "es",
      entradas: [
        { ruta: "/producto/tornillo&co", prioridad: 0.6, frecuencia: "weekly" },
      ],
    });
    expect(xml).toContain(
      "<loc>https://mercatren.cl/es/producto/tornillo&amp;co</loc>",
    );
    expect(xml).toContain(
      'hreflang="es" href="https://mercatren.cl/es/producto/tornillo&amp;co"',
    );
    expect(xml).toContain(
      'hreflang="en" href="https://mercatren.cl/en/producto/tornillo&amp;co"',
    );
    expect(xml).toContain(
      'hreflang="x-default" href="https://mercatren.cl/es/producto/tornillo&amp;co"',
    );
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(xml).toContain("<priority>0.6</priority>");
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it("una ficha con foto la declara para Google Imágenes", () => {
    const xml = urlsetXml({
      base: "https://mercatren.com",
      idiomas: ["es", "en"],
      porDefecto: "es",
      entradas: [
        {
          ruta: "/producto/x",
          prioridad: 0.6,
          frecuencia: "weekly",
          imagen: "https://mercatren.com/media/fotos/x.webp",
        },
        { ruta: "/producto/y", prioridad: 0.6, frecuencia: "weekly" },
      ],
    });
    expect(xml).toContain(
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    );
    expect(xml).toContain(
      "<image:image><image:loc>https://mercatren.com/media/fotos/x.webp</image:loc></image:image>",
    );
    expect(xml.match(/<image:image>/g)?.length).toBe(1);
  });

  it("EL MAPA DE VIDEOS ES UN MAPA DE VIDEOS: portada, título, archivo, duración y vistas", () => {
    const xml = videosXml({
      base: "https://mercatren.com",
      idiomas: ["es", "en"],
      porDefecto: "es",
      videos: [
        {
          ruta: "/video/taladro-en-accion",
          titulo: "Taladro en acción <ferretería>",
          descripcion: "Así funciona.",
          portada: "https://mercatren.com/media/videos/portada.webp",
          archivo: "https://mercatren.com/media/videos/v.mp4",
          duracionSegundos: 34.6,
          vistas: 12,
          publicado: new Date("2026-08-24T10:00:00Z"),
        },
      ],
    });
    expect(xml).toContain(
      'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"',
    );
    expect(xml).toContain(
      "<loc>https://mercatren.com/es/video/taladro-en-accion</loc>",
    );
    expect(xml).toContain(
      "<video:thumbnail_loc>https://mercatren.com/media/videos/portada.webp</video:thumbnail_loc>",
    );
    expect(xml).toContain(
      "<video:title>Taladro en acción &lt;ferretería&gt;</video:title>",
    );
    expect(xml).toContain(
      "<video:content_loc>https://mercatren.com/media/videos/v.mp4</video:content_loc>",
    );
    expect(xml).toContain("<video:duration>35</video:duration>");
    expect(xml).toContain("<video:view_count>12</video:view_count>");
    expect(xml).toContain(
      "<video:publication_date>2026-08-24T10:00:00.000Z</video:publication_date>",
    );
    expect(xml).toContain(
      'hreflang="en" href="https://mercatren.com/en/video/taladro-en-accion"',
    );
  });

  it("el índice apunta a los trozos", () => {
    const xml = indiceXml([
      { loc: "https://mercatren.com/mapa/paginas.xml" },
      { loc: "https://mercatren.com/mapa/productos-0.xml" },
    ]);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<loc>https://mercatren.com/mapa/paginas.xml</loc>");
    expect(xml).toContain(
      "<loc>https://mercatren.com/mapa/productos-0.xml</loc>",
    );
  });

  it("escapa lo que XML no soporta crudo", () => {
    expect(escaparXml(`a&b<c>"d"'e'`)).toBe(
      "a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;",
    );
  });

  it("las páginas fijas siguen todas (entrega y devoluciones incluidas)", () => {
    const rutas = FIJAS.map(([r]) => r);
    for (const r of [
      "",
      "/catalogo",
      "/tiendas",
      "/entrega",
      "/devoluciones",
      "/docs",
      "/blog",
    ]) {
      expect(rutas).toContain(r);
    }
  });
});

describe("las rutas", () => {
  it("NO puede volver a existir `app/sitemap.ts`: chocaría con el índice en la misma dirección", () => {
    expect(existsSync("src/app/sitemap.ts")).toBe(false);
    expect(existsSync("src/app/sitemap.xml/route.ts")).toBe(true);
    expect(existsSync("src/app/mapa/[parte]/route.ts")).toBe(true);
  });

  it("el índice y los trozos responden por dominio, y los trozos salen de la lista pura", () => {
    const indice = readFileSync("src/app/sitemap.xml/route.ts", "utf-8");
    expect(indice).toContain("partesDeProductos(");
    expect(indice).toContain("/mapa/paginas.xml");
    expect(indice).toContain("/mapa/tiendas.xml");
    expect(indice).toContain("/mapa/videos.xml");
    expect(indice).toContain("/mapa/productos-${i}.xml");
    const trozos = readFileSync("src/app/mapa/[parte]/route.ts", "utf-8");
    expect(trozos).toContain("leerParte(parte)");
    /* Los videos salen por el mapa de videos, con su consulta completa. */
    expect(trozos).toContain("videosParaMapaCompleto(mercado.codigo)");
    expect(trozos).toContain("videosXml({");
    /* Y cada ficha lleva su foto. */
    expect(trozos).toContain("imagen: p.fotoClave");
    expect(trozos).toContain(".limit(POR_PARTE)");
    expect(trozos).toContain(".offset(pedido.indice * POR_PARTE)");
    /* Orden estable: el mismo producto cae siempre en el mismo trozo. */
    expect(trozos).toMatch(
      /orderBy\(asc\((?:schema\.)?productos\.creadoEn\), asc\((?:schema\.)?productos\.id\)\)/,
    );
  });
});
