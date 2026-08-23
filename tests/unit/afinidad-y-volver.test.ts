import { describe, expect, it } from "vitest";

import {
  categoriaDominante,
  registrarVista,
  sinLoYaVisto,
  type Vista,
} from "@/lib/catalogo/afinidad";
import { destinoDeVuelta } from "@/lib/catalogo/volver";

const v = (slug: string, cat: string | null, en = 0): Vista => ({
  slug,
  categoriaSlug: cat,
  categoriaNombre: cat ? cat.toUpperCase() : null,
  tiendaSlug: "t",
  en,
});

/**
 * «SEGUIRLE MOSTRANDO LO QUE ESTÁ MIRANDO» — la regla, en palabras del dueño:
 * si abrió dos pintalabios, más pintalabios; si se pasó a zapatos, zapatos.
 */
describe("qué categoría manda", () => {
  it("dos fichas seguidas de la misma categoría → esa", () => {
    /* El historial va con la más nueva PRIMERO. */
    const r = categoriaDominante([v("l1", "labiales"), v("l2", "labiales")]);
    expect(r?.slug).toBe("labiales");
    expect(r?.nombre).toBe("LABIALES");
  });

  it("SI SE PASÓ A OTRA COSA, MANDA LO NUEVO aunque antes viera cinco de lo otro", () => {
    const r = categoriaDominante([
      v("z1", "zapatos"),
      v("z2", "zapatos"),
      v("l1", "labiales"),
      v("l2", "labiales"),
      v("l3", "labiales"),
      v("l4", "labiales"),
      v("l5", "labiales"),
    ]);
    expect(r?.slug).toBe("zapatos");
  });

  it("una sola visita NO es una intención", () => {
    expect(categoriaDominante([v("z1", "zapatos")])).toBeNull();
    expect(
      categoriaDominante([v("z1", "zapatos"), v("l1", "labiales")]),
    ).toBeNull();
  });

  it("si las dos últimas difieren, gana la repetida más reciente de la ventana", () => {
    /* Abrió labial, luego bici, luego labial: el interés es labiales. */
    const r = categoriaDominante([
      v("b1", "bicicletas"),
      v("l2", "labiales"),
      v("z1", "zapatos"),
      v("l1", "labiales"),
    ]);
    expect(r?.slug).toBe("labiales");
  });

  it("las fichas sin categoría no cuentan ni estorban", () => {
    const r = categoriaDominante([
      v("x", null),
      v("l1", "labiales"),
      v("y", null),
      v("l2", "labiales"),
    ]);
    expect(r?.slug).toBe("labiales");
    expect(categoriaDominante([v("x", null), v("y", null)])).toBeNull();
  });

  it("sin historial, nada", () => {
    expect(categoriaDominante([])).toBeNull();
  });
});

describe("el historial", () => {
  it("la más nueva va primero, y volver a abrir una la sube", () => {
    const h1 = registrarVista([], v("a", "c"));
    const h2 = registrarVista(h1, v("b", "c"));
    const h3 = registrarVista(h2, v("a", "c"));
    expect(h3.map((x) => x.slug)).toEqual(["a", "b"]);
  });

  it("se recorta al máximo", () => {
    let h: Vista[] = [];
    for (let i = 0; i < 30; i++) h = registrarVista(h, v(`p${i}`, "c"));
    expect(h).toHaveLength(12);
    expect(h[0]?.slug).toBe("p29");
  });

  it("no se le vuelve a enseñar lo que ya abrió", () => {
    const lista = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];
    expect(sinLoYaVisto(lista, [v("b", "c")]).map((p) => p.slug)).toEqual([
      "a",
      "c",
    ]);
  });
});

/**
 * LA FLECHA «← VOLVER» DE LA FICHA: a donde la persona venía, o a la tienda.
 *
 * El fallo: era un «Volver al catálogo» fijo. Quien entraba a una tienda y
 * abría un producto caía en el catálogo entero y tenía que buscar su tienda
 * entre sesenta otra vez.
 */
describe("a dónde vuelve la flecha", () => {
  const base = {
    origen: "https://mercatren.com",
    paginaActual: "/es/producto/taladro",
    hrefTienda: "/tienda/la-mia",
  };

  it("si vino de la tienda (o de cualquier página del sitio), vuelve atrás", () => {
    expect(
      destinoDeVuelta({
        ...base,
        referrer: "https://mercatren.com/es/tienda/la-mia",
        hayHistorial: true,
      }),
    ).toEqual({ modo: "atras" });
    expect(
      destinoDeVuelta({
        ...base,
        referrer: "https://mercatren.com/es/catalogo?q=taladro",
        hayHistorial: true,
      }),
    ).toEqual({ modo: "atras" });
  });

  it("si llegó de fuera (WhatsApp, Google), va a la tienda del producto", () => {
    expect(
      destinoDeVuelta({ ...base, referrer: "", hayHistorial: false }),
    ).toEqual({ modo: "enlace", href: "/tienda/la-mia" });
    expect(
      destinoDeVuelta({
        ...base,
        referrer: "https://www.google.com/",
        hayHistorial: true,
      }),
    ).toEqual({ modo: "enlace", href: "/tienda/la-mia" });
  });

  it("una recarga de la propia ficha no «vuelve» a sí misma", () => {
    expect(
      destinoDeVuelta({
        ...base,
        referrer: "https://mercatren.com/es/producto/taladro",
        hayHistorial: true,
      }),
    ).toEqual({ modo: "enlace", href: "/tienda/la-mia" });
  });

  it("un referrer que no es una URL no rompe nada", () => {
    expect(
      destinoDeVuelta({ ...base, referrer: "basura", hayHistorial: true }),
    ).toEqual({ modo: "enlace", href: "/tienda/la-mia" });
  });

  it("NUNCA devuelve el catálogo a secas", () => {
    for (const referrer of ["", "https://mercatren.com/es", "https://x.com/"]) {
      const r = destinoDeVuelta({ ...base, referrer, hayHistorial: true });
      expect(r.modo === "enlace" ? r.href : "").not.toBe("/catalogo");
    }
  });
});
