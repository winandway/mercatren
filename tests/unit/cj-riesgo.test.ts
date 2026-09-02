import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
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
});
