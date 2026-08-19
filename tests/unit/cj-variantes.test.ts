import { describe, expect, it } from "vitest";

import {
  elegirVariante,
  variantesDeCj,
  type VarianteCj,
} from "@/lib/cj/variantes";

/**
 * EL FALLO REAL QUE ESTAS PRUEBAS FIJAN (18 ago 2026):
 *
 * La primera compra pagada de verdad murió en CJ con «No variants found for
 * provided SKUs», porque le mandábamos el SKU del PRODUCTO donde su API pide el
 * de la VARIANTE. El pedido nunca nació, y como el enlace de pago lo devuelve
 * CJ al crearlo, tampoco había dónde pagar.
 */

const negro: VarianteCj = {
  vid: "vid-negro",
  variantSku: "CJJT05843-Black",
  variantKey: "Black-M",
  variantSellPrice: "15.30",
};

const rojo: VarianteCj = {
  vid: "vid-rojo",
  variantSku: "CJJT05843-Red",
  variantKey: "Red-M",
  variantSellPrice: "12.50",
};

describe("leer la lista que manda CJ", () => {
  it("la toma cuando viene como arreglo directo", () => {
    expect(variantesDeCj([negro, rojo])).toHaveLength(2);
  });

  it("y también envuelta en `list`", () => {
    /* Distintas rutas de CJ envuelven distinto. Leerlo donde no está devuelve
       una lista vacía SIN error, que es como se pierde una noche buscando el
       fallo en otro lado — ya pasó con el buscador (`lista.ts`). */
    expect(variantesDeCj({ list: [negro] })).toHaveLength(1);
  });

  it("lo que no se entiende es una lista vacía, no una excepción", () => {
    expect(variantesDeCj(undefined)).toEqual([]);
    expect(variantesDeCj(null)).toEqual([]);
    expect(variantesDeCj({ vaya: "cosa" })).toEqual([]);
  });
});

describe("elegir qué se compra", () => {
  it("con una sola variante, esa es y no hay ambigüedad", () => {
    const e = elegirVariante([negro]);
    expect(e?.vid).toBe("vid-negro");
    expect(e?.ambigua).toBe(false);
    expect(e?.deCuantas).toBe(1);
  });

  it("manda el SKU DE LA VARIANTE, no el del producto", () => {
    /* Este es el fallo entero en una línea: `CJJT05843` es el producto y
       `CJJT05843-Black` la variante. CJ solo acepta el segundo. */
    expect(elegirVariante([negro])?.sku).toBe("CJJT05843-Black");
  });

  it("con varias elige la MÁS BARATA, que es la que se le cobró al comprador", () => {
    /**
     * Al importar, un precio en rango («12.50 -- 15.30») se publica por el
     * mínimo. Comprar cualquier otra sería vender a un precio y comprar a otro
     * más caro: esa diferencia sale de nuestro bolsillo en cada venta.
     */
    const e = elegirVariante([negro, rojo]);
    expect(e?.vid).toBe("vid-rojo");
    expect(e?.nombre).toBe("Red-M");
  });

  it("y avisa de que la eligió sola, diciendo cuántas había", () => {
    /* El comprador nunca eligió talla ni color: nuestra ficha publica el
       producto como una sola cosa. Quien va a pagar tiene que saberlo. */
    const e = elegirVariante([negro, rojo]);
    expect(e?.ambigua).toBe(true);
    expect(e?.deCuantas).toBe(2);
    expect(e?.otras).toContain("Black-M");
  });

  it("una variante sin precio va al final, nunca se elige por barata", () => {
    /* Sin precio no se puede afirmar que sea la más barata. Elegirla sería
       comprar sin saber cuánto cuesta. */
    const sinPrecio: VarianteCj = { vid: "vid-x", variantSku: "AAA-01" };
    expect(elegirVariante([sinPrecio, negro])?.vid).toBe("vid-negro");
  });

  it("a igual precio desempata el SKU, siempre igual", () => {
    /**
     * Sin segundo criterio, dos reintentos de la misma compra podrían elegir
     * variantes distintas según cómo viniera la lista ese día: el panel diría
     * una cosa y CJ despacharía otra.
     */
    const a: VarianteCj = {
      vid: "v-b",
      variantSku: "ZZZ",
      variantSellPrice: 9,
    };
    const b: VarianteCj = {
      vid: "v-a",
      variantSku: "AAA",
      variantSellPrice: 9,
    };
    expect(elegirVariante([a, b])?.vid).toBe("v-a");
    expect(elegirVariante([b, a])?.vid).toBe("v-a");
  });
});

describe("cuando no hay nada que comprar", () => {
  it("sin variantes devuelve null", () => {
    expect(elegirVariante([])).toBeNull();
  });

  it("una fila sin `vid` se descarta: no identifica nada", () => {
    /* Mandar un pedido con una variante a medias es pagar por un paquete que
       no se sabe qué lleva. Mejor decir que no se pudo. */
    expect(elegirVariante([{ variantSku: "SIN-VID" }])).toBeNull();
    expect(elegirVariante([{ vid: "   ", variantSku: "X" }])).toBeNull();
  });
});

describe("lo que se enseña en el panel", () => {
  it("usa el nombre legible antes que el SKU", () => {
    expect(elegirVariante([negro])?.nombre).toBe("Black-M");
  });

  it("si no hay nombre legible, cae al SKU en vez de quedar en blanco", () => {
    const v: VarianteCj = { vid: "v1", variantSku: "SOLO-SKU" };
    expect(elegirVariante([v])?.nombre).toBe("SOLO-SKU");
  });

  it("no lista cuarenta alternativas: taparían el botón de pagar", () => {
    const muchas: VarianteCj[] = Array.from({ length: 40 }, (_, i) => ({
      vid: `v${i}`,
      variantSku: `SKU-${String(i).padStart(2, "0")}`,
      variantSellPrice: 10 + i,
    }));

    const e = elegirVariante(muchas);
    expect(e?.deCuantas).toBe(40);
    expect(e?.otras.length).toBeLessThanOrEqual(6);
  });
});
