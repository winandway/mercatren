import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARTICULOS_EN } from "@/contenido/articulos/en";
import { ARTICULOS_ES } from "@/contenido/articulos/es";
import {
  buscarEnDocs,
  ENLACES_FIJOS,
  entradasDeDocs,
  porSeccion,
  SECCIONES,
  seccionDeGuia,
} from "@/lib/docs/indice";
import en from "../../messages/en.json";
import es from "../../messages/es.json";

/**
 * DOCS (23 ago 2026): la sección se llama «Docs», cada guía tiene su propia
 * página, el índice no apunta a nada que no exista y el buscador encuentra
 * sin acentos. Regla de la casa: como la de YaDominios, con los colores de la
 * casa.
 */
const RAIZ = join(import.meta.dirname, "..", "..");

describe("la sección se llama «Docs» en los dos idiomas", () => {
  it("menú, pie, título y vuelta", () => {
    for (const m of [es, en]) {
      expect(m.encabezado.docs).toBe("Docs");
      expect(m.piePagina.enlaces.docs).toBe("Docs");
      expect(m.docs.titulo).toBe("Docs");
      expect(m.docs.volver).toBe("Docs");
      expect(m.blog.documentacion).toBe("Docs");
    }
  });
  it("y nadie vuelve a escribir «Documentación» como nombre de la sección", () => {
    for (const m of [es, en]) {
      const plano = JSON.stringify(m);
      expect(plano).not.toContain('"Documentación"');
      expect(plano).not.toContain('"Documentation"');
    }
  });
});

describe("el índice no apunta a nada que no exista", () => {
  it("cada enlace fijo tiene su página o su ruta", () => {
    for (const e of ENLACES_FIJOS) {
      const ruta = e.externo
        ? e.href.startsWith("/.well-known/")
          ? join(RAIZ, "src/app", e.href.replace(/\/$/, ""))
          : join(RAIZ, "src/app", e.href)
        : join(RAIZ, "src/app/[locale]/(tienda)/(docs)", e.href, "page.tsx");
      const existe = e.externo
        ? existsSync(join(ruta, "route.ts")) ||
          existsSync(join(ruta, "[[...ruta]]", "route.ts"))
        : existsSync(ruta);
      expect(
        existe,
        `falta la página de ${e.href} dentro del grupo (docs) — fuera del grupo pierde la barra (${ruta})`,
      ).toBe(true);
    }
  });
  it("cada enlace fijo tiene su texto en los dos idiomas", () => {
    for (const e of ENLACES_FIJOS) {
      for (const m of [es, en]) {
        const t = (
          m.docs.enlaces as Record<string, { nombre: string; resumen: string }>
        )[e.clave];
        expect(t, `falta docs.enlaces.${e.clave}`).toBeDefined();
        expect(t!.nombre.length).toBeGreaterThan(3);
        expect(t!.resumen.length).toBeGreaterThan(10);
      }
    }
    for (const s of SECCIONES) {
      for (const m of [es, en]) {
        expect(
          (m.docs.secciones as Record<string, { titulo: string }>)[s.id]
            ?.titulo,
        ).toBeTruthy();
      }
    }
  });
  it("toda guía escrita cae en una sección y tiene la misma en los dos idiomas", () => {
    const guiasEs = ARTICULOS_ES.filter((a) => a.tipo === "documentacion");
    const guiasEn = ARTICULOS_EN.filter((a) => a.tipo === "documentacion");
    expect(guiasEs.map((g) => g.slug).sort()).toEqual(
      guiasEn.map((g) => g.slug).sort(),
    );
    for (const g of guiasEs)
      expect(SECCIONES.map((s) => s.id)).toContain(seccionDeGuia(g.temas));
    expect(seccionDeGuia(["comercios", "cobros"])).toBe("comercios");
    expect(seccionDeGuia(["desarrolladores", "api"])).toBe("desarrolladores");
    expect(seccionDeGuia(["compradores"])).toBe("compradores");
    expect(seccionDeGuia(["otra cosa"])).toBe("empezar");
  });
  it("las guías nuevas están y no hay enlaces repetidos", () => {
    const entradas = entradasDeDocs(
      ARTICULOS_ES,
      (c, campo) => `${c}:${campo}`,
    );
    const hrefs = entradas.map((e) => e.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toContain("/docs/cobrar-por-enlace");
    expect(hrefs).toContain("/docs/api-y-agentes-de-ia");
    const grupos = porSeccion(entradas);
    expect(grupos.comercios.map((e) => e.href)).toContain(
      "/docs/cobrar-por-enlace",
    );
    expect(grupos.desarrolladores.map((e) => e.href)).toContain(
      "/docs/api-y-agentes-de-ia",
    );
  });
});

describe("el buscador", () => {
  const entradas = entradasDeDocs(
    ARTICULOS_ES,
    (c, campo) =>
      (es.docs.enlaces as Record<string, { nombre: string; resumen: string }>)[
        c
      ]![campo],
  );
  it("encuentra sin acentos y por varias palabras", () => {
    expect(buscarEnDocs(entradas, "devolucion").map((e) => e.href)).toContain(
      "/devoluciones",
    );
    expect(buscarEnDocs(entradas, "w8ben").map((e) => e.href)).toContain(
      "/docs/formulario-fiscal-w8ben-e",
    );
    expect(buscarEnDocs(entradas, "cobrar enlace")[0]?.href).toBe(
      "/docs/cobrar-por-enlace",
    );
  });
  it("con una letra no busca, y lo que no existe devuelve vacío", () => {
    expect(buscarEnDocs(entradas, "a")).toEqual([]);
    expect(buscarEnDocs(entradas, "xyzzy")).toEqual([]);
  });
});
