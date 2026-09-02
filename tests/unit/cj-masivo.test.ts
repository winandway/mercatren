import { describe, expect, it } from "vitest";

import {
  ABANDONO_MS,
  BANDAS_DE_PRECIO,
  TOPE_POR_CONSULTA,
  ULTIMA_PAGINA,
  aplanarCategorias,
  bandasPara,
  envioEstimadoPara,
  estaTopada,
  fichaDesdeFila,
  nivelesDe,
  parametrosDeLista,
  pasaElFiltro,
  percentil,
  porcentajeDe,
  reclamable,
  stockDeVariante,
  tablaDeEstimados,
} from "@/lib/cj/masivo";

/**
 * TRAER EL ALMACÉN COMPLETO DE CJ (2 sep 2026). Lo pidió el dueño: «tocar un
 * botón y que se agreguen todos los productos… con precios reales, envíos,
 * todo bien». Aquí se fijan las reglas que hacen eso posible sin regalar
 * margen ni perder productos.
 */
describe("el árbol de categorías de CJ", () => {
  const arbol = [
    {
      categoryFirstName: "Home & Garden",
      categoryFirstList: [
        {
          categorySecondName: "Kitchen",
          categorySecondList: [
            { categoryId: "c-1", categoryName: "Kitchen Tools" },
            { categoryId: "c-2", categoryName: "Cookware" },
            /* Repetido: entra una sola vez. */
            { categoryId: "c-1", categoryName: "Kitchen Tools" },
            /* Sin id: no sirve para consultar, se ignora. */
            { categoryName: "Huérfana" },
          ],
        },
      ],
    },
  ];

  it("aplana los tres niveles en categorías de tercer nivel, sin repetir", () => {
    const lista = aplanarCategorias(arbol);
    expect(lista.map((c) => c.id)).toEqual(["c-1", "c-2"]);
    expect(lista[0]).toEqual({
      id: "c-1",
      nombre: "Home & Garden > Kitchen > Kitchen Tools",
      niveles: ["Kitchen Tools", "Kitchen", "Home & Garden"],
    });
  });

  it("lee también la forma envuelta en { list }", () => {
    expect(aplanarCategorias({ list: arbol })).toHaveLength(2);
    expect(aplanarCategorias(null)).toEqual([]);
    expect(aplanarCategorias("basura")).toEqual([]);
  });

  it("los niveles vuelven a salir del nombre guardado, del específico al general", () => {
    expect(nivelesDe("Home & Garden > Kitchen > Kitchen Tools")).toEqual([
      "Kitchen Tools",
      "Kitchen",
      "Home & Garden",
    ]);
    expect(nivelesDe(null)).toEqual([]);
  });
});

describe("la consulta a CJ", () => {
  it("arma los parámetros que documenta CJ: almacén, stock mínimo, verificado y banda", () => {
    const q = new URLSearchParams(
      parametrosDeLista({
        almacen: "US",
        pagina: 3,
        categoriaId: "c-9",
        desdeCentavos: 500,
        hastaCentavos: 1000,
        stockMinimo: 5,
        soloVerificado: true,
        conExtras: true,
      }),
    );
    expect(q.get("page")).toBe("3");
    expect(q.get("size")).toBe("100");
    expect(q.get("countryCode")).toBe("US");
    expect(q.get("categoryId")).toBe("c-9");
    expect(q.get("startWarehouseInventory")).toBe("5");
    expect(q.get("verifiedWarehouse")).toBe("1");
    expect(q.get("startSellPrice")).toBe("5.00");
    expect(q.get("endSellPrice")).toBe("10.00");
    expect(q.get("features")).toBe("enable_description,enable_category");
  });

  it("sin categoría, sin banda y sin verificado NO manda esos parámetros", () => {
    const q = new URLSearchParams(
      parametrosDeLista({
        almacen: "CN",
        pagina: 0,
        categoriaId: null,
        desdeCentavos: null,
        hastaCentavos: null,
        stockMinimo: 0,
        soloVerificado: false,
        conExtras: false,
      }),
    );
    expect(q.get("page")).toBe("1");
    expect(q.get("countryCode")).toBe("CN");
    expect(q.has("categoryId")).toBe(false);
    expect(q.has("verifiedWarehouse")).toBe(false);
    expect(q.has("startWarehouseInventory")).toBe(false);
    expect(q.has("startSellPrice")).toBe(false);
    expect(q.has("features")).toBe(false);
  });

  it("EL TOPE DE CJ SON 6.000 POR CONSULTA: topada solo si SE SABE el total", () => {
    expect(TOPE_POR_CONSULTA).toBe(6000);
    expect(ULTIMA_PAGINA).toBe(60);
    expect(estaTopada(6000)).toBe(true);
    expect(estaTopada(7500)).toBe(true);
    expect(estaTopada(5999)).toBe(false);
    /* Sin total no se parte nada: se recorre hasta donde CJ deje. */
    expect(estaTopada(null)).toBe(false);
    expect(estaTopada(undefined)).toBe(false);
  });

  it("una categoría topada se parte en bandas de precio; una banda ya no", () => {
    const bandas = bandasPara({ desdeCentavos: null, hastaCentavos: null });
    expect(bandas).toHaveLength(BANDAS_DE_PRECIO.length);
    /* La primera arranca sin `desde` (0 no se manda) y la última no cierra. */
    expect(bandas![0]).toEqual({ desdeCentavos: null, hastaCentavos: 500 });
    expect(bandas!.at(-1)).toEqual({
      desdeCentavos: 20000,
      hastaCentavos: null,
    });
    expect(bandasPara({ desdeCentavos: 500, hastaCentavos: 1000 })).toBeNull();
  });
});

describe("de la fila de CJ a la ficha", () => {
  const fila = {
    id: "2408280942471623900",
    nameEn: "Stainless Steel Kitchen Tongs 12 Inch",
    sku: "CJJT05843",
    bigImage: "https://cf.cjdropshipping.com/x.jpg",
    sellPrice: "3.50 -- 4.20",
    warehouseInventoryNum: 40,
    description:
      "<p>Food grade <b>stainless</b> tongs.</p><p>Length 12 in.</p>",
  };

  it("toma el precio MÁS BAJO del rango, la foto, el stock, el departamento y la descripción sin HTML", () => {
    const ficha = fichaDesdeFila(fila, {
      niveles: ["Kitchen Tools", "Kitchen", "Home & Garden"],
    });
    expect(ficha).not.toBeNull();
    expect(ficha!.costoCentavos).toBe(350);
    expect(ficha!.existencias).toBe(40);
    expect(ficha!.departamento).toBe("cocina-comedor");
    expect(ficha!.descripcion).toBe(
      "Food grade stainless tongs.\nLength 12 in.",
    );
    expect(ficha!.imagen).toContain("https://");
  });

  it("sin id, sin nombre o sin precio NO se publica", () => {
    expect(fichaDesdeFila({ ...fila, id: "" }, null)).toBeNull();
    expect(fichaDesdeFila({ ...fila, nameEn: " " }, null)).toBeNull();
    expect(fichaDesdeFila({ ...fila, sellPrice: "0" }, null)).toBeNull();
  });

  it("una descripción de dos palabras no cuenta como descripción", () => {
    expect(
      fichaDesdeFila({ ...fila, description: "<p>Nice</p>" }, null)!
        .descripcion,
    ).toBeNull();
    expect(
      fichaDesdeFila({ ...fila, description: null }, null)!.descripcion,
    ).toBeNull();
  });

  it("el filtro de stock: pasa lo que tiene de sobra y lo que CJ no contó", () => {
    const f = fichaDesdeFila(fila, null)!;
    expect(pasaElFiltro(f, 5)).toBe(true);
    expect(pasaElFiltro({ ...f, existencias: 2 }, 5)).toBe(false);
    /* No saber no es cero. */
    expect(pasaElFiltro({ ...f, existencias: null }, 5)).toBe(true);
  });
});

describe("el envío estimado sale de las cotizaciones REALES", () => {
  it("percentil 70: conservador, nunca inventado", () => {
    expect(
      percentil([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000], 0.7),
    ).toBe(700);
    expect(percentil([], 0.7)).toBeNull();
    expect(percentil([0, -5], 0.7)).toBeNull();
  });

  it("por departamento con muestras suficientes; el resto al general; sin nada, al respaldo", () => {
    const filas = [
      ...[300, 320, 350, 400, 900].map((c) => ({
        categoriaId: "dep-cocina-comedor",
        costoCentavos: c,
      })),
      /* Solo dos muestras: no opina. */
      { categoriaId: "dep-mascotas", costoCentavos: 1500 },
      { categoriaId: "dep-mascotas", costoCentavos: 1600 },
    ];
    const tabla = tablaDeEstimados(filas);
    expect(tabla.muestras).toBe(7);
    expect(tabla.porDepartamento["dep-cocina-comedor"]).toBe(400);
    expect(tabla.porDepartamento["dep-mascotas"]).toBeUndefined();
    expect(envioEstimadoPara("dep-cocina-comedor", tabla, 350)).toBe(400);
    /* Mascotas cae al general de las 7 muestras. */
    expect(envioEstimadoPara("dep-mascotas", tabla, 350)).toBe(tabla.general);
    /* Sin muestras de nada, el respaldo de la plaza — NUNCA cero. */
    const vacia = tablaDeEstimados([]);
    expect(vacia.general).toBeNull();
    expect(envioEstimadoPara(null, vacia, 1200)).toBe(1200);
    expect(
      envioEstimadoPara(
        "dep-x",
        { porDepartamento: { "dep-x": 0 }, general: 0, muestras: 9 },
        350,
      ),
    ).toBe(350);
  });
});

describe("reclamar una tanda", () => {
  const ahora = new Date("2026-09-02T20:00:00Z");
  it("pendiente siempre; en curso solo si quedó abandonada", () => {
    expect(reclamable({ estado: "pendiente", tomadaEn: null }, ahora)).toBe(
      true,
    );
    expect(reclamable({ estado: "en_curso", tomadaEn: null }, ahora)).toBe(
      true,
    );
    expect(
      reclamable(
        { estado: "en_curso", tomadaEn: new Date(ahora.getTime() - 60_000) },
        ahora,
      ),
    ).toBe(false);
    expect(
      reclamable(
        {
          estado: "en_curso",
          tomadaEn: new Date(ahora.getTime() - ABANDONO_MS - 1),
        },
        ahora,
      ),
    ).toBe(true);
    expect(reclamable({ estado: "hecha", tomadaEn: null }, ahora)).toBe(false);
    expect(reclamable({ estado: "partida", tomadaEn: null }, ahora)).toBe(
      false,
    );
  });

  it("el porcentaje de la barra nunca se sale de 0–100", () => {
    expect(porcentajeDe(0, 0)).toBe(0);
    expect(porcentajeDe(3, 4)).toBe(75);
    expect(porcentajeDe(9, 4)).toBe(100);
  });

  it("el stock de una variante sin dato es UNA, como en existencias.ts", () => {
    expect(stockDeVariante({ variantStock: 7 })).toBe(7);
    expect(stockDeVariante({ stockNum: "3" })).toBe(3);
    expect(stockDeVariante({})).toBe(1);
  });
});
