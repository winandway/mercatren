import { describe, expect, it } from "vitest";

import { departamentoDeCj, idDeDepartamento } from "@/lib/cj/departamento";
import { DEPARTAMENTOS } from "@/lib/catalogo/departamentos";

/**
 * EN QUÉ DEPARTAMENTO CAE UN PRODUCTO DE CJ.
 *
 * Sin esto, los 23 departamentos del frente se quedan vacíos con el catálogo
 * ya publicado — que es exactamente como se ve una tienda a la que nadie le ha
 * metido nada.
 */
describe("el departamento de un producto de CJ", () => {
  it("«card» NO es «car» — la trampa que habría entrado el primer día", () => {
    /* «Slim Minimalist Wallet With ID Window, Pop Up Card Holder» salió entre
       los primeros resultados de «wallet». Con una comparación por trozos de
       texto, «card» contiene «car» y ese monedero se iba a «Repuestos de
       carro». Va a ropa y accesorios, que es donde lo busca alguien. */
    expect(
      departamentoDeCj(
        [],
        "Slim Minimalist Wallet With ID Window, Pop Up Card Holder",
      ),
    ).toBe("ropa-calzado");
  });

  it("manda la categoría de CJ, no el título", () => {
    /* CJ ya clasificó el producto mirándolo. El título viene cargado de
       palabras sueltas para su buscador y adivinar de ahí es más frágil. */
    expect(
      departamentoDeCj(
        ["Wallets", "Bags", "Women's Clothing"],
        "2pcs Vintage Washed Baseball Cap With American Flag USA Embroidery",
      ),
    ).toBe("ropa-calzado");
  });

  it("gana el nivel más específico sobre el general", () => {
    /* Un cargador dentro de «Consumer Electronics» tiene que llegar a
       «Celulares y accesorios». Si mandara el nivel general, se quedaría en
       electrónica y nadie lo encontraría donde lo busca. */
    expect(departamentoDeCj(["Phone Chargers", "Consumer Electronics"])).toBe(
      "celulares-accesorios",
    );
  });

  it("un saco de dormir es camping, no ropa", () => {
    /* «bag» está en la lista de ropa. Deportes va antes justo por esto. */
    expect(departamentoDeCj(["Camping Sleeping Bags", "Outdoor"])).toBe(
      "deportes-aire-libre",
    );
  });

  it("un utensilio de cocina no es ferretería", () => {
    /* «tool» está en ferretería; cocina va antes. */
    expect(departamentoDeCj(["Kitchen Tools", "Home & Kitchen"])).toBe(
      "cocina-comedor",
    );
  });

  it("reconoce el catálogo típico de CJ", () => {
    const casos: Array<[string[], string]> = [
      [["Hoodies & Sweatshirts", "Women's Clothing"], "ropa-calzado"],
      [["Phone Cases"], "celulares-accesorios"],
      [["Necklaces", "Jewelry"], "relojes-joyeria"],
      [["Dog Toys", "Pet Supplies"], "mascotas"],
      [["Makeup Brushes", "Beauty & Health"], "belleza-cuidado"],
      [["Baby Strollers", "Mother & Kids"], "bebes-ninos"],
      [["Power Tools", "Home Improvement"], "ferreteria-construccion"],
      [["Bluetooth Speakers", "Consumer Electronics"], "electronica"],
      [["Garden Decoration"], "jardin-exteriores"],
      [["Yoga Mats", "Sports & Outdoors"], "deportes-aire-libre"],
    ];

    for (const [categorias, esperado] of casos) {
      expect(departamentoDeCj(categorias), categorias.join(" · ")).toBe(
        esperado,
      );
    }
  });

  it("el plural y el singular son lo mismo", () => {
    expect(departamentoDeCj(["Wallets"])).toBe("ropa-calzado");
    expect(departamentoDeCj(["Wallet"])).toBe("ropa-calzado");
  });

  it("lo que no se reconoce se deja SIN colgar, no en un cajón cualquiera", () => {
    /* Misma regla que el importador de los comercios: un producto sin
       departamento se ve y se busca igual. Uno colgado del departamento
       equivocado no lo encuentra nunca quien sí lo quería. */
    expect(departamentoDeCj(["Xyz Widgets"], "Zqx 9000")).toBeNull();
    expect(departamentoDeCj([])).toBeNull();
    expect(departamentoDeCj([null, undefined, ""])).toBeNull();
  });

  it("todo departamento que devuelve existe de verdad en la lista del sitio", () => {
    /* El candado que importa: un slug mal escrito aquí se guardaría como
       `dep-ropa-calzados`, la base lo rechazaría por la llave foránea, y el
       producto no se podría agregar. */
    const reales = new Set(DEPARTAMENTOS.map((d) => d.slug));

    const muestras = [
      ["Wallets"],
      ["Phone Cases"],
      ["Kitchen Tools"],
      ["Power Tools"],
      ["Motorcycle Parts"],
      ["Pet Supplies"],
      ["Office Supplies"],
      ["Paint Brushes"],
      ["Industrial Machinery"],
      ["Farm Supplies"],
      ["Home Decoration"],
      ["Watches"],
      ["Baby Clothing"],
      ["Toys"],
      ["Medical Supplies"],
      ["Laptop Accessories"],
      ["Refrigerators"],
      ["Car Parts"],
      ["Garden Tools"],
      ["Camping Gear"],
    ];

    for (const m of muestras) {
      const slug = departamentoDeCj(m);
      if (slug) expect(reales.has(slug), `${m[0]} → ${slug}`).toBe(true);
    }
  });

  it("el id de la base es el que siembra schema.sql", () => {
    expect(idDeDepartamento("ropa-calzado")).toBe("dep-ropa-calzado");
    expect(idDeDepartamento(null)).toBeNull();
  });
});
