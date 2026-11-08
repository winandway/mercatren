import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  contextoDe,
  fichaParaApp,
  PAISES_ENCENDIDOS,
  paisParaApp,
  productoParaApp,
  respuestaPublica,
} from "@/lib/app-movil/datos";
import type { ProductoLista } from "@/lib/catalogo/consultas";
import { reglasDeCachePublica } from "@/lib/trafico/cache-del-borde";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * LA PUERTA DE DATOS DE LA APP NATIVA (5 nov 2026). Lo que no puede pasar sin
 * que esto se ponga en rojo: que la app reciba algo interno (el código del
 * proveedor, el sku, el depósito por dentro), que un país inventado pase, o
 * que la respuesta no se pueda guardar en el borde.
 */

const tarjeta: ProductoLista = {
  id: "p1",
  slug: "silla-plegable",
  tituloEs: "Silla plegable",
  tituloEn: "Folding chair",
  precioCentavos: 2599,
  precioAntesCentavos: 3199,
  moneda: "USD",
  existencias: 0,
  controlaExistencias: true,
  unidad: null,
  marca: null,
  destacado: false,
  creadoEn: null,
  tiendaNombre: "Una tienda",
  tiendaSlug: "una-tienda",
  tiendaPais: "US",
  imagenUrl: "/media/productos/p1/silla.webp",
  imagenAlt: "Silla abierta",
};

describe("el país y el idioma que pide la app", () => {
  it("sin nada, Estados Unidos en inglés", () => {
    const r = contextoDe(new URL("https://mercatren.com/datos/app/v1/paises"));
    expect(r.ok && r.mercado.codigo).toBe("US");
    expect(r.ok && r.idioma).toBe("en");
  });

  it("acepta minúsculas y un país de la lista", () => {
    const r = contextoDe(new URL("https://mercatren.com/x?pais=ve&idioma=ES"));
    expect(r.ok && r.mercado.codigo).toBe("VE");
    expect(r.ok && r.idioma).toBe("es");
  });

  it("un país o un idioma inventados no pasan", () => {
    expect(contextoDe(new URL("https://m.com/x?pais=XX")).ok).toBe(false);
    expect(contextoDe(new URL("https://m.com/x?idioma=fr")).ok).toBe(false);
  });

  it("Estados Unidos y Venezuela (8 nov 2026) encendidos, con su moneda", () => {
    expect(PAISES_ENCENDIDOS).toEqual(["US", "VE"]);
    expect(paisParaApp(mercadoPorCodigo("US"), "es")).toMatchObject({
      codigo: "US",
      moneda: "USD",
      encendido: true,
    });
    expect(paisParaApp(mercadoPorCodigo("CL"), "es").encendido).toBe(false);
  });
});

describe("lo que la app recibe de cada producto", () => {
  it("la tarjeta: título en su idioma, precio de antes solo si era mayor, agotado", () => {
    const en = productoParaApp(tarjeta, "en");
    expect(en.titulo).toBe("Folding chair");
    expect(en.precioAntes).toEqual({ centavos: 3199, moneda: "USD" });
    expect(en.agotado).toBe(true);
    const es = productoParaApp(
      { ...tarjeta, tituloEn: null, precioAntesCentavos: 1000 },
      "en",
    );
    expect(es.titulo).toBe("Silla plegable");
    expect(es.precioAntes).toBeNull();
  });

  it("la ficha NO deja salir nada interno, aunque la base lo traiga", () => {
    const deLaBase = {
      producto: {
        id: "p1",
        slug: "silla-plegable",
        marca: null,
        tituloEs: "Silla plegable",
        tituloEn: "Folding chair",
        descripcionEs: "Plegable y liviana.",
        descripcionEn: null,
        precioCentavos: 2599,
        precioAntesCentavos: null,
        moneda: "USD",
        existencias: 3,
        controlaExistencias: true,
        unidad: null,
        sku: "CJ-SKU-SECRETO",
        externoId: "PID-DEL-PROVEEDOR",
        fuenteId: "cj",
        depositoId: "dep-1",
      },
      tiendaNombre: "Una tienda",
      tiendaSlug: "una-tienda",
      categoriaNombreEs: "Hogar",
      categoriaNombreEn: "Home",
      depositoDireccion: "Calle interna 123",
      imagenes: [{ url: "/media/a.webp", altEs: "Abierta", altEn: null }],
    };
    const ficha = fichaParaApp(deLaBase, "en");
    const texto = JSON.stringify(ficha);
    for (const interno of [
      "CJ-SKU-SECRETO",
      "PID-DEL-PROVEEDOR",
      "Calle interna",
      "dep-1",
      '"cj"',
    ]) {
      expect(texto, interno).not.toContain(interno);
    }
    expect(ficha.descripcion).toBe("Plegable y liviana.");
    expect(ficha.categoria).toBe("Home");
    expect(ficha.fotos).toEqual([{ url: "/media/a.webp", alt: "Abierta" }]);
  });
});

describe("la respuesta", () => {
  it("se guarda en el borde por la lista única, y no lleva cookies", () => {
    const regla = reglasDeCachePublica().find(
      (r) => r.source === "/datos/app/v1/:ruta*",
    );
    expect(regla?.headers[0]?.value).toContain("s-maxage=300");
    expect(regla?.missing.some((m) => m.key === "cookie")).toBe(true);
    expect(respuestaPublica({ ok: true }).headers.get("set-cookie")).toBeNull();
  });

  it("las rutas viven en /datos/app/v1 (nunca /api) y validan país e idioma", () => {
    const raiz = "src/app/datos/app/v1";
    const rutas: string[] = [];
    const recorrer = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) recorrer(p);
        else if (f === "route.ts") rutas.push(p);
      }
    };
    recorrer(raiz);
    expect(rutas.length).toBeGreaterThanOrEqual(3);
    for (const ruta of rutas) {
      const texto = readFileSync(ruta, "utf-8");
      expect(texto, ruta).toContain("contextoDe(");
      expect(texto, ruta).toContain('respuestaDeError("pais_o_idioma", 400)');
    }
  });
});
