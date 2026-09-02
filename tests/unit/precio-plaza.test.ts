import { describe, expect, it } from "vitest";

import { plazaDelMercado } from "@/lib/cj/plazas";
import { precioPublicadoDe } from "@/lib/destino/precio-plaza";
import { desglosarChile } from "@/lib/destino/precio-chile";
import { desglosarColombia } from "@/lib/destino/precio-colombia";
import { desglosarUs } from "@/lib/destino/precio-us";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * UNA SOLA FÓRMULA DE PRECIO POR PLAZA (2 sep 2026): el importador, el
 * recálculo y la importación masiva tienen que publicar el MISMO número
 * para el mismo producto. Aquí se fija contra los desgloses de cada país.
 */
describe("el precio publicado por plaza", () => {
  const US = plazaDelMercado(mercadoPorCodigo("US"));
  const CL = plazaDelMercado(mercadoPorCodigo("CL"));
  const CO = plazaDelMercado(mercadoPorCodigo("CO"));

  it("Estados Unidos: dólares, con el margen que decide la mayorista", () => {
    const r = precioPublicadoDe(US, 1000, 350, null);
    const d = desglosarUs(1000, 350);
    expect(r).toEqual({
      ok: true,
      publicadoCentavos: d.publicadoCentavos,
      margenUsdCentavos: d.margenCentavos,
    });
  });

  it("Chile: pesos con la tasa, y lo que pasa del tope de USD 500 NO se publica", () => {
    const r = precioPublicadoDe(CL, 1000, 1200, 96742);
    const d = desglosarChile(1000, 1200, 96742)!;
    expect(r).toEqual({
      ok: true,
      publicadoCentavos: d.publicadoClp,
      margenUsdCentavos: null,
    });
    expect(precioPublicadoDe(CL, 60_000, 1200, 96742)).toEqual({
      ok: false,
      motivo: "supera-tope",
    });
    expect(precioPublicadoDe(CL, 1000, 1200, null)).toEqual({
      ok: false,
      motivo: "sin-tasa",
    });
  });

  it("Colombia: pesos con la tasa, sin tope", () => {
    const r = precioPublicadoDe(CO, 60_000, 1200, 410_000);
    const d = desglosarColombia(60_000, 1200, 410_000)!;
    expect(r).toEqual({
      ok: true,
      publicadoCentavos: d.publicadoCop,
      margenUsdCentavos: null,
    });
    expect(precioPublicadoDe(CO, 1000, 1200, null)).toEqual({
      ok: false,
      motivo: "sin-tasa",
    });
  });

  it("sin costo no hay precio, en ninguna plaza", () => {
    expect(precioPublicadoDe(US, 0, 350, null)).toEqual({
      ok: false,
      motivo: "sin-precio",
    });
    expect(precioPublicadoDe(CL, 0, 350, 96742)).toEqual({
      ok: false,
      motivo: "sin-precio",
    });
  });
});
