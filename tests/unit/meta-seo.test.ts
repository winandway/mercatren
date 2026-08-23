import { describe, expect, it } from "vitest";

import {
  acotar,
  metaDeCatalogo,
  metaDeProducto,
  metaDeTienda,
  primeraFrase,
  titularNormal,
} from "@/lib/seo/meta";

/**
 * LOS METADATOS DE LAS FICHAS, que es con lo que se compite en Google.
 * Reglas: nada inventado, largos de título y descripción respetados, los dos
 * idiomas, y el comercio y el lugar siempre presentes.
 */
describe("titularNormal", () => {
  it("pasa un título GRITADO a normal conservando siglas y números", () => {
    expect(titularNormal("ELECTRODO 3/32 GRIS")).toBe("Electrodo 3/32 gris");
    expect(titularNormal("TEE PVC DE 3")).toBe("Tee PVC de 3");
    expect(titularNormal("CONECTORES RJ45 CATEGORIA 6")).toBe(
      "Conectores RJ45 categoria 6",
    );
  });
  it("no toca uno escrito a mano", () => {
    expect(titularNormal("Láminas arquitectónicas")).toBe(
      "Láminas arquitectónicas",
    );
    expect(titularNormal("Campus")).toBe("Campus");
  });
});

describe("acotar y primeraFrase", () => {
  it("acota sin partir palabras", () => {
    const t = acotar(
      "uno dos tres cuatro cinco seis siete ocho nueve diez",
      24,
    );
    expect(t.length).toBeLessThanOrEqual(24);
    expect(t.endsWith("…")).toBe(true);
    expect(t).toBe("uno dos tres cuatro…");
  });
  it("saca la primera frase", () => {
    expect(primeraFrase("Sirve para 220. Trae tres metros.")).toBe(
      "Sirve para 220.",
    );
    expect(primeraFrase("   ")).toBeNull();
  });
});

describe("metaDeProducto", () => {
  const base = {
    titulo: "ELECTRODO 3/32 GRIS",
    descripcion: null,
    marca: null,
    categoria: "Ferretería",
    tienda: "Ferremateriales Bley C.A",
    ciudad: "El Vigía",
    precio: "$3.48",
    paisOrigen: "VE",
    idioma: "es" as const,
  };

  it("título = producto + comercio, ≤ 60; descripción con precio, dónde se retira y cómo se paga, ≤ 155", () => {
    const m = metaDeProducto(base);
    expect(m.title).toBe("Electrodo 3/32 gris · Ferremateriales Bley C.A");
    expect(m.title.length).toBeLessThanOrEqual(60);
    expect(m.description).toContain("$3.48");
    expect(m.description).toContain(
      "Retíralo en Ferremateriales Bley C.A, El Vigía",
    );
    expect(m.description).toContain("Mercatren");
    expect(m.description.length).toBeLessThanOrEqual(155);
    expect(m.keywords).toEqual(
      expect.arrayContaining(["Ferretería", "El Vigía", "Mercatren"]),
    );
  });

  it("lo de Estados Unidos habla de envío, no de retiro", () => {
    const m = metaDeProducto({
      ...base,
      titulo: "Campus",
      tienda: "Sole & Thread",
      ciudad: null,
      paisOrigen: "US",
      precio: "$34.33",
    });
    expect(m.description).toContain("Envío gratis a todo Estados Unidos");
    expect(m.description).not.toContain("Retíralo");
  });

  it("en inglés, inglés de verdad", () => {
    const m = metaDeProducto({ ...base, idioma: "en" });
    expect(m.description).toMatch(
      /^Electrodo 3\/32 gris for \$3\.48\. Pick it up at Ferremateriales Bley C\.A, El Vigía\./,
    );
    expect(m.description).toContain("Pay by card or Zelle from the US");
  });

  it("usa la primera frase de la descripción propia cuando cabe, y la suelta cuando no", () => {
    /* Con un comercio de nombre corto, la frase propia cabe. */
    const corta = metaDeProducto({
      ...base,
      tienda: "MAXIUM",
      ciudad: "Tucaní",
      descripcion: "Para soldar hierro común. Caja de 5 kg.",
    });
    expect(corta.description).toContain("Para soldar hierro común.");
    expect(corta.description.length).toBeLessThanOrEqual(155);
    /* Con el nombre largo no cabe: se suelta la propia y se queda lo que importa. */
    const sinEspacio = metaDeProducto({
      ...base,
      descripcion: "Para soldar hierro común. Caja de 5 kg.",
    });
    expect(sinEspacio.description).toContain(
      "Retíralo en Ferremateriales Bley C.A, El Vigía.",
    );
    const larga = metaDeProducto({ ...base, descripcion: "x".repeat(300) });
    expect(larga.description.length).toBeLessThanOrEqual(155);
    expect(larga.description).toContain("Retíralo en");
  });

  it("un título muy largo se queda solo, acotado", () => {
    const m = metaDeProducto({
      ...base,
      titulo:
        "Juego de llaves combinadas de 12 piezas con estuche y acabado cromado",
    });
    expect(m.title.length).toBeLessThanOrEqual(60);
    expect(m.title).not.toContain("Ferremateriales");
  });
});

describe("metaDeTienda y metaDeCatalogo", () => {
  it("la tienda dice quién es, dónde está y cuántos productos tiene", () => {
    const m = metaDeTienda({
      nombre: "MAXIUM",
      ciudad: "El Vigía",
      descripcion: null,
      cuantos: 1,
      paisOrigen: "VE",
      idioma: "es",
    });
    expect(m.title).toBe("MAXIUM · El Vigía");
    expect(m.description).toContain("comercio en El Vigía, Venezuela");
    expect(m.description).toContain("1 productos");
    expect(m.description.length).toBeLessThanOrEqual(155);
  });
  it("el catálogo cambia el título según lo que se busca o se filtra", () => {
    expect(
      metaDeCatalogo({
        busqueda: "bicicleta",
        total: 12,
        idioma: "es",
        tituloBase: "Catálogo",
        descripcionBase: "x",
      }).title,
    ).toBe("Resultados para «bicicleta»");
    expect(
      metaDeCatalogo({
        categoria: "Ropa y calzado",
        total: 40,
        idioma: "en",
        tituloBase: "Catalog",
        descripcionBase: "x",
      }).description,
    ).toContain("Ropa y calzado: 40 products");
    expect(
      metaDeCatalogo({
        total: 0,
        idioma: "es",
        tituloBase: "Catálogo",
        descripcionBase: "Todo",
      }).title,
    ).toBe("Catálogo");
  });
});
