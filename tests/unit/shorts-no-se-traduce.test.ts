import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import es from "@/../messages/es.json";
import en from "@/../messages/en.json";

/**
 * «SHORTS» NO SE TRADUCE (25 ago 2026).
 *
 * El dueño lo vio en su propia portada: con el traductor del navegador
 * puesto, «Shorts» salía como **«Bermudas»** —la prenda de ropa— en la
 * etiqueta de la hilera, en el menú y en el título de la sección. Sus
 * palabras: _«esa palabra no tiene traducción, significa video corto en
 * inglés y YouTube lo llamó así»_.
 *
 * Se arregla con `translate="no"` y la clase `notranslate`: se lo dicen tanto
 * al traductor de Google como al de Safari y Edge. Sin las dos, alguno lo
 * traduce igual.
 */
describe("la palabra Shorts", () => {
  it("es la misma en los dos idiomas: no se traduce ni en nuestros textos", () => {
    expect(
      (es.videos as { hileras: Record<string, { etiqueta: string }> }).hileras,
    ).toBeDefined();
    for (const [clave, bloque] of Object.entries(
      (es.videos as { hileras: Record<string, { etiqueta: string }> }).hileras,
    )) {
      expect(bloque.etiqueta, `es.${clave}`).toBe("Shorts");
    }
    for (const [clave, bloque] of Object.entries(
      (en.videos as { hileras: Record<string, { etiqueta: string }> }).hileras,
    )) {
      expect(bloque.etiqueta, `en.${clave}`).toBe("Shorts");
    }
  });

  it("y los sitios donde se dibuja llevan el candado contra el traductor", () => {
    const sitios = [
      "src/components/videos/hilera-videos.tsx",
      "src/components/layout/encabezado.tsx",
      "src/app/[locale]/(tienda)/videos/page.tsx",
    ];
    for (const sitio of sitios) {
      const fuente = readFileSync(sitio, "utf8");
      expect(fuente, sitio).toContain('translate="no"');
      /* Las dos cosas: el atributo estándar y la clase que mira Google. */
      expect(fuente, sitio).toContain("notranslate");
    }
  });
});

describe("las hileras de la portada", () => {
  it("cada una tiene su título en los dos idiomas", async () => {
    const { HILERAS } = await import("@/lib/videos/hileras");
    for (const [idioma, textos] of [
      ["es", es],
      ["en", en],
    ] as const) {
      const hileras = (
        textos.videos as { hileras: Record<string, { titulo: string }> }
      ).hileras;
      for (const clave of HILERAS) {
        expect(hileras[clave]?.titulo, `${idioma}.${clave}`).toBeTruthy();
      }
    }
  });

  it("los mismos videos, barajados distinto en cada hilera", async () => {
    const { ordenarParaHilera } = await import("@/lib/videos/hileras");
    const videos = Array.from({ length: 12 }, (_, i) => ({
      id: `v${i}`,
      vistas: 0,
      creadoEn: null,
    }));
    const a = ordenarParaHilera(videos, "descubre", () => 0, 100);
    const b = ordenarParaHilera(videos, "porDentro", () => 0, 100 + 7919);
    /* Dos hileras seguidas con el mismo orden se leen como un error. */
    expect(a.map((v) => v.id)).not.toEqual(b.map((v) => v.id));
    /* Pero están todos en las dos: barajar no pierde videos. */
    expect(new Set(a.map((v) => v.id)).size).toBe(12);
    expect(new Set(b.map((v) => v.id)).size).toBe(12);
  });

  it("y el orden de una hilera NO cambia entre dibujos", async () => {
    const { ordenarParaHilera } = await import("@/lib/videos/hileras");
    const videos = Array.from({ length: 8 }, (_, i) => ({
      id: `v${i}`,
      vistas: 0,
      creadoEn: null,
    }));
    /* Si cambiara, la hilera «bailaría» al navegar por el sitio. */
    expect(ordenarParaHilera(videos, "descubre", () => 0, 42)).toEqual(
      ordenarParaHilera(videos, "descubre", () => 0, 42),
    );
  });

  it("«lo más visto» y «los que más gustan» ordenan DE VERDAD", async () => {
    const { ordenarParaHilera } = await import("@/lib/videos/hileras");
    const videos = [
      { id: "poco", vistas: 3, creadoEn: null },
      { id: "mucho", vistas: 900, creadoEn: null },
      { id: "medio", vistas: 50, creadoEn: null },
    ];
    expect(
      ordenarParaHilera(videos, "masVistos", () => 0, 1).map((v) => v.id),
    ).toEqual(["mucho", "medio", "poco"]);

    const corazones: Record<string, number> = { poco: 9, mucho: 0, medio: 2 };
    expect(
      ordenarParaHilera(videos, "masGustan", (id) => corazones[id] ?? 0, 1).map(
        (v) => v.id,
      ),
    ).toEqual(["poco", "medio", "mucho"]);
  });

  it("no se dibuja una hilera que prometa un dato que está en cero", async () => {
    const { valeLaPena } = await import("@/lib/videos/hileras");
    const sinVistas = Array.from({ length: 6 }, (_, i) => ({
      id: `v${i}`,
      vistas: 0,
      creadoEn: null,
    }));
    /* «Lo más visto» con todo en cero no dice nada: se salta. */
    expect(valeLaPena(sinVistas, "masVistos", 0)).toBe(false);
    expect(valeLaPena(sinVistas, "masGustan", 0)).toBe(false);
    expect(valeLaPena(sinVistas, "descubre", 0)).toBe(true);
    /* Con menos de tres son recuadros sueltos, no una sección. */
    expect(valeLaPena(sinVistas.slice(0, 2), "descubre", 0)).toBe(false);
  });
});

describe("el layout de la hilera", () => {
  it("NUNCA va dentro del <ul> de productos: como hija de un grid se colapsa", () => {
    const portada = readFileSync("src/app/[locale]/(tienda)/page.tsx", "utf8");
    /* Ahí el título salía en vertical, una palabra por línea, y el resto de
       la fila en blanco. El dueño lo marcó con una equis roja.

       Se mira el JSX SIN comentarios: el porqué está escrito justo al lado y
       nombra el `<ul>` del que se sacó — con los comentarios dentro, esta
       prueba se dispara sola. */
    const jsx = portada
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    /* Se emparejan los bloques `<ul>…</ul>` y se mira si alguno la contiene.
       Buscarla con un solo patrón «ul … HileraVideos … /ul» da falsos
       positivos: el `</ul>` que encuentra puede ser el de la SIGUIENTE
       sección, con la hilera legítimamente en medio de las dos. */
    const bloquesUl = jsx.match(/<ul[^>]*>[\s\S]*?<\/ul>/g) ?? [];
    const dentro = bloquesUl.filter((b) => b.includes("<HileraVideos"));
    expect(dentro).toEqual([]);
    /* Y sigue estando en la portada: no vale arreglarlo quitándola. */
    expect(jsx).toContain("<HileraVideos");
  });
});
