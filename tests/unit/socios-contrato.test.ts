import { describe, expect, it } from "vitest";

import {
  aCentavos,
  aDolares,
  envioDelSocio,
  estadoDesdeElSocio,
  estadoParaElSocio,
  existenciasDesdeElSocio,
  existenciasParaElSocio,
  productoParaElSocio,
  tipoDeVenta,
  type ProductoDeMercatren,
} from "@/lib/socios/contrato";

/** Un producto de Mercatren con lo mínimo, para no repetir 15 campos. */
const producto = (
  p: Partial<ProductoDeMercatren> = {},
): ProductoDeMercatren => ({
  externoId: "8b895933-b8f5-458a-9fbd-6e8210673f70",
  sku: "7591234567890",
  tituloEs: "Cable THW calibre 12",
  tituloEn: null,
  descripcionEs: null,
  descripcionEn: null,
  marca: null,
  precioBaseCentavos: 10_000,
  precioCentavos: 10_309,
  precioAntesCentavos: null,
  existencias: 213.5,
  controlaExistencias: true,
  unidad: "m",
  pesoGramos: null,
  estado: "publicado",
  destacado: false,
  imagenes: [],
  ...p,
});

/**
 * LA PRUEBA MÁS IMPORTANTE DEL ARCHIVO.
 *
 * Mercatren publica precio base + su margen. Si por el cable saliera el precio
 * PUBLICADO, el socio lo guardaría como base y en la vuelta siguiente Mercatren
 * le sumaría el margen otra vez: 100 → 103,09 → 106,28 → 109,57, subiendo solo
 * todos los días sin un solo error en pantalla.
 */
describe("el precio que sale al socio es la BASE, nunca el publicado", () => {
  it("manda la base, no lo que se publica", () => {
    const salida = productoParaElSocio(
      producto({ precioBaseCentavos: 10_000, precioCentavos: 10_309 }),
    );
    expect(salida.price).toBe(100);
    expect(salida.price).not.toBe(103.09);
  });

  it("NO se infla al dar la vuelta completa", () => {
    /* El ciclo real: Mercatren manda → el socio lo guarda como su base → se lo
       devuelve → Mercatren lo vuelve a guardar. Después de dos vueltas tiene
       que valer exactamente lo mismo que al principio. */
    let base = 10_000;

    for (let vuelta = 0; vuelta < 5; vuelta++) {
      const haciaElSocio = productoParaElSocio(
        producto({
          precioBaseCentavos: base,
          // Lo publicado siempre lleva el margen encima.
          precioCentavos: Math.ceil((base * 10_000) / 9_700),
        }),
      );
      base = aCentavos(haciaElSocio.price)!;
    }

    expect(base, "el precio se infló solo dando vueltas").toBe(10_000);
  });

  it("el precio tachado viaja aparte y no se confunde con la base", () => {
    const salida = productoParaElSocio(
      producto({ precioBaseCentavos: 1_350, precioAntesCentavos: 1_800 }),
    );
    expect(salida.price).toBe(13.5);
    expect(salida.compare_at_price).toBe(18);
  });
});

/**
 * EL CENTINELA DE «EXISTENCIAS ILIMITADAS».
 *
 * QRbott usa -1 y NULL para «no llevo inventario de esto». Si entrara crudo,
 * el producto se publicaría con MENOS UNO de existencias: agotado en la tienda
 * y out_of_stock para Google. Un producto que se vende siempre, invisible.
 */
describe("el -1 de existencias ilimitadas", () => {
  it("un -1 NO se guarda como menos uno", () => {
    const r = existenciasDesdeElSocio(-1);
    expect(r.existencias).toBe(0);
    expect(r.controlaExistencias).toBe(false);
  });

  it("null tambien significa ilimitado", () => {
    expect(existenciasDesdeElSocio(null).controlaExistencias).toBe(false);
    expect(existenciasDesdeElSocio(undefined).controlaExistencias).toBe(false);
  });

  it("cualquier negativo es el centinela, no una cantidad", () => {
    expect(existenciasDesdeElSocio(-99).existencias).toBe(0);
    expect(existenciasDesdeElSocio(-99).controlaExistencias).toBe(false);
  });

  it("un cero SÍ es agotado de verdad, y se lleva la cuenta", () => {
    /* Confundir «agotado» con «ilimitado» publicaría como disponible algo que
       no hay. Son cosas distintas y se distinguen por el signo. */
    const r = existenciasDesdeElSocio(0);
    expect(r.existencias).toBe(0);
    expect(r.controlaExistencias).toBe(true);
  });

  it("los decimales se respetan: cable por metro, cemento por kilo", () => {
    expect(existenciasDesdeElSocio(13.5).existencias).toBe(13.5);
  });

  it("y a la vuelta, lo ilimitado sale como null y no como cero", () => {
    /* Mandar 0 diría «agotado» y el socio dejaría de venderlo. */
    expect(existenciasParaElSocio(0, false)).toBeNull();
    expect(existenciasParaElSocio(13.5, true)).toBe(13.5);
    expect(existenciasParaElSocio(0, true)).toBe(0);
  });

  it("da la vuelta completa sin cambiar", () => {
    for (const stock of [null, 0, 13.5, 200]) {
      const dentro = existenciasDesdeElSocio(stock);
      const fuera = existenciasParaElSocio(
        dentro.existencias,
        dentro.controlaExistencias,
      );
      expect(fuera, `${stock} no sobrevivió la vuelta`).toBe(stock ?? null);
    }
  });
});

/**
 * RETIRAR LO QUE NO VINO.
 *
 * El piloto tiene 21 productos aquí y 1 allá. Con un delta de un producto,
 * retirar por ausencia le borraría 20 que hoy están vendiendo — y el resumen
 * diría «1 actualizado, 20 retirados» en verde.
 */
describe("la bandera que dice si se puede retirar", () => {
  const base = {
    version: 1 as const,
    hasta: "2026-08-08T12:15:00.000Z",
    tienda: { externo_id: "39341d9e-0000-0000-0000-000000000000" },
    products: [],
  };

  it("si el socio no la manda, se asume que NO se puede retirar", () => {
    /* Lo seguro por defecto. Al revés se le borra el catálogo a un cliente
       porque alguien olvidó un campo. */
    expect(envioDelSocio.parse(base).completo).toBe(false);
  });

  it("solo retira cuando el socio dice explícitamente que viene entero", () => {
    expect(envioDelSocio.parse({ ...base, completo: true }).completo).toBe(
      true,
    );
  });

  it("las bajas llegan aparte, porque el socio borra de verdad", () => {
    const envio = envioDelSocio.parse({
      ...base,
      deletions: [{ id: "abc", deleted_at: "2026-08-08T12:03:00.000Z" }],
    });
    expect(envio.deletions).toHaveLength(1);
  });

  it("sin bajas, la lista llega vacía y no indefinida", () => {
    expect(envioDelSocio.parse(base).deletions).toEqual([]);
  });
});

describe("lo que el contrato NO deja pasar", () => {
  const base = {
    version: 1,
    hasta: "2026-08-08T12:15:00.000Z",
    tienda: { externo_id: "t1" },
  };

  it("un producto sin identificador: sería imposible reconocerlo después", () => {
    expect(() =>
      envioDelSocio.parse({
        ...base,
        products: [{ id: "", title_es: "Algo" }],
      }),
    ).toThrow();
  });

  it("un producto sin título", () => {
    expect(() =>
      envioDelSocio.parse({ ...base, products: [{ id: "a", title_es: "" }] }),
    ).toThrow();
  });

  it("un precio negativo", () => {
    expect(() =>
      envioDelSocio.parse({
        ...base,
        products: [{ id: "a", title_es: "X", price: -5 }],
      }),
    ).toThrow();
  });

  it("una foto que no es una dirección", () => {
    expect(() =>
      envioDelSocio.parse({
        ...base,
        products: [
          { id: "a", title_es: "X", images: [{ url: "no-es-una-url" }] },
        ],
      }),
    ).toThrow();
  });

  it("un envío sin el corte para la próxima vez", () => {
    /* Sin `hasta` habría que usar nuestro reloj, y unos segundos de diferencia
       entre dos servidores se comen los cambios de esa ventana en silencio. */
    const sinHasta: Record<string, unknown> = { ...base };
    delete sinHasta.hasta;
    expect(() => envioDelSocio.parse(sinHasta)).toThrow();
  });
});

describe("los estados", () => {
  it("se traducen en los dos sentidos", () => {
    expect(estadoDesdeElSocio("published")).toBe("publicado");
    expect(estadoDesdeElSocio("out_of_stock")).toBe("agotado");
    expect(estadoParaElSocio("publicado")).toBe("published");
    expect(estadoParaElSocio("agotado")).toBe("out_of_stock");
  });

  it("lo archivado entra como borrador, no se borra", () => {
    // Puede tener pedidos viejos colgando.
    expect(estadoDesdeElSocio("archived")).toBe("borrador");
  });

  it("un estado desconocido entra como borrador, no como publicado", () => {
    /* Ante la duda, que no salga a la calle: publicar algo que el comercio no
       quiso publicar es peor que dejarlo en borrador. */
    expect(estadoDesdeElSocio("cualquier-cosa")).toBe("borrador");
    expect(estadoDesdeElSocio(null)).toBe("borrador");
  });
});

describe("cómo se vende, deducido de la unidad", () => {
  it("por peso", () => {
    expect(tipoDeVenta("kg")).toBe("weight");
    expect(tipoDeVenta("Gramos")).toBe("weight");
  });

  it("por longitud", () => {
    expect(tipoDeVenta("m")).toBe("length");
    expect(tipoDeVenta("cm")).toBe("length");
  });

  it("todo lo demás, por unidad", () => {
    expect(tipoDeVenta("u")).toBe("unit");
    expect(tipoDeVenta(null)).toBe("unit");
    expect(tipoDeVenta("saco")).toBe("unit");
  });
});

describe("dólares y centavos", () => {
  it("van y vuelven sin perder un centavo", () => {
    for (const d of [0, 0.01, 1.35, 16.09, 103.09, 49_717.42]) {
      expect(aDolares(aCentavos(d))).toBe(d);
    }
  });

  it("los decimales sueltos se redondean al centavo", () => {
    expect(aCentavos(1.005)).toBe(101);
    expect(aCentavos(16.094)).toBe(1609);
  });

  it("lo que no hay se queda en nada, no en cero", () => {
    /* Cero es un precio; null es «no me lo mandaron». Confundirlos publicaría
       productos regalados. */
    expect(aCentavos(null)).toBeNull();
    expect(aDolares(null)).toBeNull();
  });
});
