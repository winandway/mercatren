import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  aPublico,
  CADA_CUANTOS_MAXIMO,
  CADA_CUANTOS_MINIMO,
  estaVigente,
  intercalarBanners,
  saleEn,
  type BannerBase,
  type BannerPublico,
} from "@/lib/banners/reglas";

/**
 * LOS BANNERS PUBLICITARIOS DE LAS PARRILLAS (23 ago 2026): publicidad de la
 * casa a sus propios comercios, en medio de las parrillas, administrada solo
 * por el equipo. Aquí se fijan las reglas puras: vigencia, lugar, cadencia y
 * que un banner nunca abra ni cierre una parrilla.
 */
const base: BannerBase = {
  id: "b1",
  tituloEs: "Bley",
  tituloEn: "Bley EN",
  textoEs: null,
  textoEn: null,
  botonEs: null,
  botonEn: null,
  imagenClave: null,
  enlace: "/tienda/bley-ferreteria",
  ubicacion: "todas",
  tiendaId: null,
  cadaCuantos: 6,
  orden: 0,
  activo: true,
  desde: null,
  hasta: null,
};
const pub = (id: string, cadaCuantos = 6): BannerPublico => ({
  id,
  titulo: id,
  texto: null,
  boton: null,
  imagenUrl: null,
  enlace: "/x",
  cadaCuantos,
});

describe("vigencia", () => {
  it("activo y sin fechas → vigente; pausado → no", () => {
    expect(estaVigente(base)).toBe(true);
    expect(estaVigente({ ...base, activo: false })).toBe(false);
  });
  it("respeta desde y hasta", () => {
    const ahora = new Date("2026-08-23T12:00:00Z");
    expect(estaVigente({ ...base, desde: new Date("2026-09-01") }, ahora)).toBe(
      false,
    );
    expect(estaVigente({ ...base, hasta: new Date("2026-08-01") }, ahora)).toBe(
      false,
    );
    expect(
      estaVigente(
        {
          ...base,
          desde: new Date("2026-08-01"),
          hasta: new Date("2026-09-01"),
        },
        ahora,
      ),
    ).toBe(true);
  });
});

describe("dónde sale", () => {
  it("«todas» sale en portada, tienda y catálogo", () => {
    expect(saleEn(base, "portada")).toBe(true);
    expect(saleEn(base, "tienda", "t1")).toBe(true);
    expect(saleEn(base, "catalogo")).toBe(true);
  });
  it("uno de portada no sale en el catálogo", () => {
    expect(saleEn({ ...base, ubicacion: "portada" }, "catalogo")).toBe(false);
    expect(saleEn({ ...base, ubicacion: "portada" }, "portada")).toBe(true);
  });
  it("UNO CLAVADO A UNA TIENDA sale SOLO en la parrilla de esa tienda", () => {
    const clavado = { ...base, tiendaId: "t-bley" };
    expect(saleEn(clavado, "tienda", "t-bley")).toBe(true);
    expect(saleEn(clavado, "tienda", "t-otra")).toBe(false);
    expect(saleEn(clavado, "portada")).toBe(false);
    expect(saleEn(clavado, "catalogo")).toBe(false);
  });
});

describe("lo que ve el público", () => {
  it("en inglés usa el inglés y si falta cae al español; la cadencia se acota", () => {
    expect(aPublico(base, "en", null).titulo).toBe("Bley EN");
    expect(aPublico({ ...base, tituloEn: "  " }, "en", null).titulo).toBe(
      "Bley",
    );
    expect(aPublico({ ...base, cadaCuantos: 1 }, "es", null).cadaCuantos).toBe(
      CADA_CUANTOS_MINIMO,
    );
    expect(
      aPublico({ ...base, cadaCuantos: 999 }, "es", null).cadaCuantos,
    ).toBe(CADA_CUANTOS_MAXIMO);
  });
});

describe("intercalar en la parrilla", () => {
  const productos = Array.from({ length: 24 }, (_, i) => ({ id: `p${i}` }));

  it("sin banners, la lista sale igual", () => {
    const r = intercalarBanners(productos, []);
    expect(r).toHaveLength(24);
    expect(r.every((x) => x.tipo === "producto")).toBe(true);
  });

  it("después de cada N productos va un banner; nunca abre ni cierra la parrilla", () => {
    const r = intercalarBanners(productos, [pub("a", 6)]);
    const posiciones = r
      .map((x, i) => (x.tipo === "banner" ? i : -1))
      .filter((i) => i >= 0);
    /* 6 productos, banner, 6 productos, banner… → índices 6, 13, 20 */
    expect(posiciones).toEqual([6, 13, 20]);
    expect(r[0]!.tipo).toBe("producto");
    expect(r[r.length - 1]!.tipo).toBe("producto");
    expect(r.filter((x) => x.tipo === "producto")).toHaveLength(24);
  });

  it("con varios banners se van turnando, cada uno con su cadencia", () => {
    const r = intercalarBanners(productos, [pub("a", 6), pub("b", 3)]);
    const ids = r
      .filter((x) => x.tipo === "banner")
      .map((x) => (x.tipo === "banner" ? x.banner.id : ""));
    expect(ids.slice(0, 4)).toEqual(["a", "b", "a", "b"]);
  });

  it("con menos productos que la cadencia no sale ninguno", () => {
    expect(
      intercalarBanners(productos.slice(0, 5), [pub("a", 6)]).some(
        (x) => x.tipo === "banner",
      ),
    ).toBe(false);
  });
});

describe("candados del panel", () => {
  it("las pantallas de banners exigen soporte DE VERDAD (no vale el disfraz de «ver su panel»)", () => {
    for (const ruta of [
      "src/app/[locale]/panel/banners/page.tsx",
      "src/app/[locale]/panel/banners/nuevo/page.tsx",
      "src/app/[locale]/panel/banners/[id]/page.tsx",
    ]) {
      const f = readFileSync(ruta, "utf8");
      expect(f, ruta).toContain("esSoporteDeVerdad()");
      expect(f, ruta).toContain("exigirEquipoInterno()");
    }
    const acciones = readFileSync("src/lib/banners/acciones.ts", "utf8");
    expect(
      acciones.match(/esSoporteDeVerdad\(\)/g)?.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("la ruta está en la lista de tramos solo del equipo (el middleware la cierra con el disfraz puesto)", () => {
    expect(readFileSync("src/lib/panel/solo-equipo.ts", "utf8")).toContain(
      '"banners"',
    );
  });

  it("la tabla llega a producción por schema.sql", () => {
    expect(readFileSync("schema.sql", "utf8")).toMatch(
      /CREATE TABLE IF NOT EXISTS [`"]?banners[`"]?/,
    );
  });

  it("las cuatro parrillas públicas intercalan los banners", () => {
    for (const ruta of [
      "src/app/[locale]/(tienda)/page.tsx",
      "src/app/[locale]/(tienda)/tienda/[slug]/page.tsx",
      "src/app/[locale]/(tienda)/catalogo/page.tsx",
      "src/components/catalogo/parrilla-infinita.tsx",
    ]) {
      expect(readFileSync(ruta, "utf8"), ruta).toContain("intercalarBanners(");
    }
  });
});
