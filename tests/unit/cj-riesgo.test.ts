import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  cobradoEnUsdCentavos,
  elegirCotizacion,
  esTransporteRegional,
  pierdeDinero,
} from "@/lib/cj/riesgo";

/**
 * LA MT-000011 (2 sep 2026): publicada a $7.95 con envío cotizado de $1.70
 * (GOFO+, regional sin capacidad); CJ cobró $6.70 de envío → costo $11.73.
 */
describe("la cotización que fija el precio", () => {
  const listado = [
    { logisticName: "UniUni+", logisticPrice: 1.7 },
    { logisticName: "GOFO+", logisticPrice: 1.7 },
    { logisticName: "USPS+VIP", logisticPrice: 7.61 },
    { logisticName: "USPS+WSC For VIP", logisticPrice: 7.9 },
  ];

  it("ignora los regionales aunque sean los más baratos", () => {
    expect(elegirCotizacion(listado)).toEqual({
      nombre: "USPS+VIP",
      centavos: 761,
    });
  });

  it("si SOLO hay regionales, usa el más barato — nunca cero", () => {
    expect(elegirCotizacion(listado.slice(0, 2))?.centavos).toBe(170);
  });

  it("reconoce los regionales por nombre, sin importar mayúsculas", () => {
    expect(esTransporteRegional("GOFO+")).toBe(true);
    expect(esTransporteRegional("UniUni+")).toBe(true);
    expect(esTransporteRegional("USPS+")).toBe(false);
    expect(esTransporteRegional("CJPacket Ordinary")).toBe(false);
  });

  it("sin opciones válidas devuelve null (y el respaldo manda)", () => {
    expect(
      elegirCotizacion([{ logisticName: "X", logisticPrice: 0 }]),
    ).toBeNull();
  });
});

describe("el candado de margen", () => {
  it("LA MT-000011 pierde: costo $11.73 contra $7.95 cobrados", () => {
    expect(pierdeDinero(1_173, 795, 200)).toEqual({
      pierde: true,
      diferenciaCentavos: -378,
    });
  });
  it("con margen suficiente, se paga sola", () => {
    expect(pierdeDinero(673, 1_500, 200).pierde).toBe(false);
  });
  it("sin costo conocido no se bloquea (CJ lo dirá al crear)", () => {
    expect(pierdeDinero(null, 795, 200).pierde).toBe(false);
  });
});

describe("los candados en el código", () => {
  it("cotizar usa elegirCotizacion, no el mínimo a secas", () => {
    expect(readFileSync("src/lib/cj/flete.ts", "utf-8")).toContain(
      "elegirCotizacion(opciones)",
    );
  });
  it("el checkout comprueba el stock en CJ antes de cobrar", () => {
    expect(readFileSync("src/lib/pedidos/acciones.ts", "utf-8")).toContain(
      "hayExistenciaEnCj(",
    );
  });
  it("la compra al proveedor NO se paga sola si pierde dinero", () => {
    const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf-8");
    expect(fuente.split("pierdeDinero(").length - 1).toBeGreaterThanOrEqual(2);
    expect(fuente).toContain("PIERDE");
  });
  it("el reloj refresca el stock de CJ", () => {
    expect(
      readFileSync("src/app/datos/sincronizar/route.ts", "utf-8"),
    ).toContain("refrescarExistenciasCj(");
  });
  it("el botón de recotizar TODOS los envíos existe aunque no falte ninguno", () => {
    /* «¿Dónde se actualizan los envíos de Estados Unidos?» — con cero
       pendientes la tarjeta solo decía «todo al día» y no había botón. */
    const comp = readFileSync(
      "src/components/panel/recalcular-precios.tsx",
      "utf-8",
    );
    expect(comp).toContain('t("recotizarTodos")');
    expect(comp).toContain("arrancar(true)");
    const accion = readFileSync("src/lib/destino/recalcular-us.ts", "utf-8");
    expect(accion).toContain("antesDe");
  });
});

describe("lo cobrado en pesos se lleva a dólares antes de juzgar", () => {
  it("96.742 pesos chilenos a 967,42 son 100 dólares exactos", () => {
    expect(cobradoEnUsdCentavos(96_742, "CLP", 96_742)).toBe(10_000);
  });
  it("en dólares no se toca", () => {
    expect(cobradoEnUsdCentavos(795, "USD", null)).toBe(795);
  });
  it("sin tasa NO se juzga (null), nunca con un número de otra moneda", () => {
    expect(cobradoEnUsdCentavos(96_742, "CLP", null)).toBeNull();
  });
  it("el recálculo de precios obedece al país del panel y usa la fórmula de cada plaza", () => {
    const fuente = readFileSync("src/lib/destino/recalcular-us.ts", "utf-8");
    expect(fuente).toContain("plazaDelMercado(await mercadoDelPanel())");
    /* La fórmula de cada plaza vive en UN solo sitio desde el 2 sep 2026
       (`precio-plaza.ts`): el recálculo, el botón de a uno y la importación
       masiva publican el mismo número. */
    expect(fuente).toContain("precioPublicadoDe(");
    const formula = readFileSync("src/lib/destino/precio-plaza.ts", "utf-8");
    expect(formula).toContain("desglosarChile(");
    expect(formula).toContain("desglosarColombia(");
    expect(fuente).toContain("fleteDeProducto(p.externoId, plaza)");
    expect(fuente).not.toContain('eq(tiendas.paisOrigen, "US")');
  });
  it("el stock se pregunta en el almacén de la plaza (China para CL/CO)", () => {
    const ex = readFileSync("src/lib/cj/existencias.ts", "utf-8");
    expect(ex).toContain("countryCode=${almacen}");
    expect(ex).toContain('inArray(tiendas.paisOrigen, ["US", "CL", "CO"])');
    const co = readFileSync("src/lib/pedidos/acciones.ts", "utf-8");
    expect(co).toContain('["US", "CL", "CO"].includes(producto.tiendaPais');
  });
});
