import { describe, expect, it } from "vitest";

import { almacenDeEntrega, plazaDelMercado } from "@/lib/cj/plazas";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * LAS PLAZAS DEL CATÁLOGO DE CJ (28 ago 2026).
 *
 * Decisión del dueño: Chile y Colombia se surten del almacén de CHINA — el
 * central, el que alimenta a todo el dropshipping hacia Latinoamérica.
 */
describe("las plazas y sus almacenes", () => {
  it("CHILE Y COLOMBIA SE SURTEN DE CHINA; EE. UU. de su almacén local", () => {
    expect(plazaDelMercado(mercadoPorCodigo("CL")).almacen).toBe("CN");
    expect(plazaDelMercado(mercadoPorCodigo("CO")).almacen).toBe("CN");
    expect(plazaDelMercado(mercadoPorCodigo("US")).almacen).toBe("US");
  });

  it("el almacén del envío sale del país de entrega, y lo desconocido cae en EE. UU.", () => {
    expect(almacenDeEntrega("CL")).toBe("CN");
    expect(almacenDeEntrega("co")).toBe("CN");
    expect(almacenDeEntrega("US")).toBe("US");
    expect(almacenDeEntrega("ZZ")).toBe("US");
  });

  it("EL RESPALDO DE FLETE NUNCA ES CERO, y el internacional nunca es el doméstico", () => {
    /* $3.50 para un envío a Chile regalaría el margen en cada venta. */
    for (const codigo of ["US", "CL", "CO"]) {
      expect(
        plazaDelMercado(mercadoPorCodigo(codigo)).envioEstimadoUsdCentavos,
      ).toBeGreaterThan(0);
    }
    const us = plazaDelMercado(mercadoPorCodigo("US")).envioEstimadoUsdCentavos;
    expect(
      plazaDelMercado(mercadoPorCodigo("CL")).envioEstimadoUsdCentavos,
    ).toBeGreaterThan(us);
  });

  it("la referencia de cotización lleva el nombre COMPLETO, no una sigla", () => {
    /* «RM» no está en la tabla de ningún courier — la misma regla de las
       regiones del checkout. */
    expect(plazaDelMercado(mercadoPorCodigo("CL")).cotizacion.provincia).toBe(
      "Region Metropolitana",
    );
  });

  it("cada plaza vende en su moneda y entrega en su país", () => {
    const cl = plazaDelMercado(mercadoPorCodigo("CL"));
    expect(cl.moneda).toBe("CLP");
    expect(cl.paisEntrega).toBe("CL");
    const co = plazaDelMercado(mercadoPorCodigo("CO"));
    expect(co.moneda).toBe("COP");
    expect(co.paisEntrega).toBe("CO");
  });
});
