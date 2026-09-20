import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  casillaDe,
  consultaDeLista,
  LISTA_GUARDADA_MS,
  type ListaGuardada,
  seDevuelveLoGuardado,
} from "@/lib/catalogo/seguir-bajando";

/**
 * ══ SEGUIR BAJANDO EN VEZ DE «SIGUIENTE» (20 sep 2026) ══
 *
 * Richard, mirando «Página 1 de 36»: «los paginadores son cosas antiguas».
 * El catálogo, las búsquedas y las tiendas cargan solos al bajar, como la
 * portada. Dos cosas tienen que seguir siendo verdad o el cambio empeora la
 * tienda: que la tanda pida EXACTAMENTE el mismo listado que la página, y que
 * al volver de una ficha la persona siga donde iba.
 */

const RAIZ = process.cwd();
const leer = (relativo: string) => readFileSync(join(RAIZ, relativo), "utf8");
const sinComentarios = (codigo: string) =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("la tanda pide el mismo listado que la página", () => {
  it("lleva los filtros que haya, y nada más", () => {
    expect(consultaDeLista({})).toBe("modo=lista");
    expect(consultaDeLista({ q: "  celular " })).toBe("modo=lista&q=celular");
    expect(
      consultaDeLista({
        q: "funda",
        categoria: "electronica",
        comercio: "nova-mobile",
        orden: "precio_asc",
        todas: true,
      }),
    ).toBe(
      "modo=lista&q=funda&categoria=electronica&comercio=nova-mobile&orden=precio_asc&todas=1",
    );
  });

  it("lo escrito viaja codificado: un «&» en la búsqueda no inventa filtros", () => {
    const consulta = consultaDeLista({ q: "cable&comercio=otra" });
    expect(new URLSearchParams(consulta).get("comercio")).toBeNull();
    expect(new URLSearchParams(consulta).get("q")).toBe("cable&comercio=otra");
  });

  it("la ruta atiende `modo=lista` con los MISMOS filtros que la página", () => {
    const ruta = sinComentarios(leer("src/app/datos/catalogo/route.ts"));
    const modo = ruta.slice(
      ruta.indexOf('get("modo") === "lista"'),
      ruta.indexOf('const q = url.searchParams.get("q")'),
    );
    expect(modo.length).toBeGreaterThan(100);
    for (const filtro of ["busqueda:", "categoria:", "comercio:", "orden:"]) {
      expect(modo, filtro).toContain(filtro);
    }
    expect(modo).toContain("zona: visibles");
    /* Sin `porPagina`: las 24 de la página, o las tandas se pisarían. */
    expect(modo).not.toContain("porPagina");
    /* Y lo que entra pasa por un esquema. */
    expect(ruta).toContain("FiltrosDeLista.safeParse(");
  });
});

describe("al volver de una ficha, la lista sigue donde estaba", () => {
  const ahora = 1_800_000_000_000;
  const guardada: ListaGuardada<{ id: string }> = {
    clave: "catalogo?q=celular#1",
    primerId: "a",
    productos: [{ id: "a" }, { id: "b" }, { id: "c" }],
    pagina: 3,
    alto: 4200,
    guardadoEn: ahora - 60_000,
  };
  const base = {
    guardada,
    clave: "catalogo?q=celular#1",
    esVuelta: true,
    primerIdAhora: "a",
    paginaInicial: 1,
    ahora,
  };

  it("se devuelve cuando es una vuelta a la misma lista, reciente", () => {
    expect(seDevuelveLoGuardado(base)).toBe(true);
  });

  it("entrando de nuevo por un enlace se empieza arriba", () => {
    expect(seDevuelveLoGuardado({ ...base, esVuelta: false })).toBe(false);
  });

  it("otra búsqueda no hereda lo bajado de la anterior", () => {
    expect(seDevuelveLoGuardado({ ...base, clave: "catalogo?q=funda#1" })).toBe(
      false,
    );
  });

  it("si el listado cambió por arriba, no se mezcla", () => {
    expect(seDevuelveLoGuardado({ ...base, primerIdAhora: "z" })).toBe(false);
  });

  it("pasada media hora ya no: precios y existencias cambian", () => {
    expect(
      seDevuelveLoGuardado({
        ...base,
        ahora: guardada.guardadoEn + LISTA_GUARDADA_MS + 1,
      }),
    ).toBe(false);
  });

  it("sin haber bajado no hay nada que devolver", () => {
    expect(
      seDevuelveLoGuardado({ ...base, guardada: { ...guardada, pagina: 1 } }),
    ).toBe(false);
    expect(seDevuelveLoGuardado({ ...base, guardada: null })).toBe(false);
  });

  it("una casilla por familia, no una por búsqueda", () => {
    expect(casillaDe("catalogo?q=celular#1")).toBe("parrilla:catalogo");
    expect(casillaDe("catalogo?q=funda#2")).toBe("parrilla:catalogo");
    expect(casillaDe("tienda/nova-mobile#1")).toBe("parrilla:tienda");
    expect(casillaDe("portada#7919")).toBe("parrilla:portada");
  });
});

describe("candados en las páginas", () => {
  const catalogo = sinComentarios(
    leer("src/app/[locale]/(tienda)/catalogo/page.tsx"),
  );
  const tienda = sinComentarios(
    leer("src/app/[locale]/(tienda)/tienda/[slug]/page.tsx"),
  );

  it("el catálogo y la tienda usan la parrilla que carga sola, con `key`", () => {
    for (const pagina of [catalogo, tienda]) {
      expect(pagina).toContain("<ParrillaInfinita");
      expect(pagina).toContain("consulta={consultaDeLista(");
      /* Sin `key`, al cambiar de búsqueda se vería lo bajado de la anterior. */
      expect(pagina).toMatch(/<ParrillaInfinita\s+key=\{/);
      expect(pagina).toMatch(/clave=\{/);
    }
  });

  it("el botón «Siguiente» solo existe para quien no tiene JavaScript", () => {
    const uso = catalogo.indexOf("<Paginacion");
    expect(uso).toBeGreaterThan(-1);
    const antes = catalogo.slice(0, uso);
    expect(antes.lastIndexOf("<noscript>")).toBeGreaterThan(
      antes.lastIndexOf("</noscript>"),
    );
  });

  it("dentro de `<noscript>` no va NINGÚN componente de cliente", () => {
    /* Un `<Link>` ahí dentro rompió la carga de toda la página en la primera
       prueba: «Cannot read properties of null (reading 'parentNode')». */
    for (const pagina of [catalogo, tienda]) {
      for (const trozo of pagina.split("<noscript>").slice(1)) {
        const dentro = trozo.slice(0, trozo.indexOf("</noscript>"));
        expect(dentro).not.toContain("<Link");
      }
    }
    const paginador = catalogo.slice(catalogo.indexOf("function Paginacion("));
    expect(paginador).not.toContain("<Link");
    expect(paginador).toContain("<a href=");
  });

  it("la vuelta se detecta ANTES de que Next vuelva a montar la lista", () => {
    const pieza = leer("src/components/catalogo/parrilla-infinita.tsx");
    /* `popstate` llega después del montaje: primero la API de navegación. */
    expect(pieza).toContain('"navigate"');
    expect(pieza).toContain('e.navigationType === "traverse"');
    /* Y lo guardado se lee una sola vez, al nacer. */
    expect(pieza).toContain("const guardadaAlNacer = leerGuardada(llave);");
  });

  it("la parrilla pide de una en una y no repite productos", () => {
    const pieza = sinComentarios(
      leer("src/components/catalogo/parrilla-infinita.tsx"),
    );
    /* El cerrojo es una referencia: con el estado se pedía la misma tanda
       dos veces (el scroll dispara antes de que React vuelva a pintar). */
    expect(pieza).toContain("if (pidiendo.current || !hayMas) return;");
    expect(pieza).toContain("!vistos.has(p.id)");
    expect(pieza).toContain("useSyncExternalStore(");
  });
});
