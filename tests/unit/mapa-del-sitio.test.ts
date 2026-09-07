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
    /**
     * `POR_PARTE` cuenta FICHAS, y cada ficha produce una entrada POR
     * IDIOMA (7 sep 2026). Con dos idiomas, el tope real de direcciones por
     * archivo es el doble — y es ese el que Google mide para descartar el
     * archivo entero. Por eso se comprueba multiplicado.
     */
    expect(POR_PARTE * 2).toBeLessThanOrEqual(50_000);
    expect(partesDeProductos(0)).toBe(0);
    expect(partesDeProductos(1)).toBe(1);
    expect(partesDeProductos(POR_PARTE)).toBe(1);
    expect(partesDeProductos(POR_PARTE + 1)).toBe(2);
    expect(partesDeProductos(100_000)).toBe(5);
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

describe("los idiomas del mapa", () => {
  it("CADA FICHA ENTRA CON SU DIRECCIÓN EN CADA IDIOMA", () => {
    /**
     * ══ EL FALLO QUE ESTO TRANCA (7 sep 2026) ══
     *
     * El mapa escribía UNA entrada por ficha, con el idioma por defecto del
     * proyecto en el `<loc>` — y ese idioma es **inglés**. Resultado: el
     * mapa de mercatren.com.ve, que es Venezuela, declaraba sus 1.016
     * fichas en INGLÉS y ninguna en español. Lo destapó Richard preguntando
     * por qué Search Console decía «0 páginas descubiertas».
     *
     * Google sí descubre las versiones anotadas con `hreflang` —se
     * comprobó en su documentación antes de tocar nada—, así que no se
     * perdían páginas; pero en una plaza hispanohablante la dirección en
     * español tiene que entrar por la puerta principal.
     */
    const xml = urlsetXml({
      base: "https://mercatren.com.ve",
      idiomas: ["es", "en"],
      porDefecto: "en",
      entradas: [
        { ruta: "/producto/tubo", prioridad: 0.6, frecuencia: "weekly" },
      ],
    });
    expect(xml).toContain(
      "<loc>https://mercatren.com.ve/es/producto/tubo</loc>",
    );
    expect(xml).toContain(
      "<loc>https://mercatren.com.ve/en/producto/tubo</loc>",
    );
    expect(xml.match(/<url>/g)?.length).toBe(2);
  });

  it("cada entrada declara TODAS sus hermanas, incluida ella misma", () => {
    /* Es lo que Google exige para que entienda el grupo: si una versión no
       se declara a sí misma, el grupo no se forma. */
    const xml = urlsetXml({
      base: "https://mercatren.com.ve",
      idiomas: ["es", "en"],
      porDefecto: "en",
      entradas: [{ ruta: "/producto/x", prioridad: 0.6, frecuencia: "weekly" }],
    });
    expect(xml.match(/hreflang="es"/g)?.length).toBe(2);
    expect(xml.match(/hreflang="en"/g)?.length).toBe(2);
    expect(xml.match(/hreflang="x-default"/g)?.length).toBe(2);
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
    /* Una vez por IDIOMA: la ficha en español y la inglesa son dos
       direcciones y cada una declara su foto. */
    expect(xml.match(/<image:image>/g)?.length).toBe(2);
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
