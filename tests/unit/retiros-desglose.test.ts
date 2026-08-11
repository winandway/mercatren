import { describe, expect, it } from "vitest";

import { COMISION_TARJETA_PB } from "@/lib/dinero";
import { desglosarCobro, sumarDesgloses } from "@/lib/retiros/desglose";

/**
 * LA REGLA QUE NO SE PUEDE ROMPER.
 *
 * Los tres renglones tienen que sumar el bruto exacto. Un centavo que no
 * cuadra en una pantalla de dinero es lo que hace que un comercio deje de
 * creerle al sistema entero.
 */
describe("los tres renglones suman el bruto, siempre", () => {
  it("con tarjeta", () => {
    for (const bruto of [1, 99, 3187, 10_659, 526_080, 3_313_725]) {
      const d = desglosarCobro(bruto, true);
      expect(
        d.procesadorCentavos + d.mercatrenCentavos + d.delComercioCentavos,
        `no cuadra en ${bruto}`,
      ).toBe(bruto);
    }
  });

  it("por Zelle", () => {
    for (const bruto of [20_000, 103_100, 2_061_860]) {
      const d = desglosarCobro(bruto, false);
      expect(
        d.procesadorCentavos + d.mercatrenCentavos + d.delComercioCentavos,
      ).toBe(bruto);
    }
  });
});

/**
 * SON DOS COSTOS DE DOS DUEÑOS DISTINTOS.
 *
 * Lo que se lleva Stripe es de un tercero; lo que se lleva Mercatren es
 * nuestro. Juntarlos en un solo número hace que el comercio nos atribuya los
 * dos y sienta que cobramos el doble.
 */
describe("el procesador y Mercatren van por separado", () => {
  it("con tarjeta se cobran los dos", () => {
    const d = desglosarCobro(10_659, true);
    expect(d.procesadorCentavos).toBeGreaterThan(0);
    expect(d.mercatrenCentavos).toBeGreaterThan(0);
  });

  it("por Zelle NO hay costo de procesador", () => {
    /* Cobrárselo sería cobrarle un servicio que no se usó. */
    const d = desglosarCobro(103_100, false);
    expect(d.procesadorCentavos).toBe(0);
    expect(d.mercatrenCentavos).toBeGreaterThan(0);
  });

  it("el margen de Mercatren es el mismo en los dos métodos", () => {
    // Desde el 10 ago 2026 los dos van al 3%.
    expect(desglosarCobro(100_000, true).mercatrenCentavos).toBe(
      desglosarCobro(100_000, false).mercatrenCentavos,
    );
  });

  it("el procesador es 2.9% más 30 centavos fijos", () => {
    const d = desglosarCobro(100_000, true);
    expect(d.procesadorCentavos).toBe(Math.round(100_000 * 0.029) + 30);
  });

  it("el margen es el 3% del bruto", () => {
    const d = desglosarCobro(100_000, true);
    expect(d.mercatrenCentavos).toBe(
      Math.round((100_000 * COMISION_TARJETA_PB) / 10_000),
    );
  });
});

describe("una venta de $106.59, que es el precio de un producto de $100", () => {
  it("le deja al comercio sus $100", () => {
    /* Es la comprobación de que la fórmula del precio y este desglose cuentan
       la misma historia: si no cuadran, uno de los dos miente. */
    const d = desglosarCobro(10_659, true);
    expect(d.procesadorCentavos).toBe(339); // 2.9% de 106.59 + 0.30
    expect(d.mercatrenCentavos).toBe(320); // 3% de 106.59
    expect(d.delComercioCentavos).toBe(10_000); // $100.00 exactos
  });
});

describe("nada que repartir", () => {
  it("en cero, todo en cero", () => {
    expect(desglosarCobro(0, true)).toEqual({
      brutoCentavos: 0,
      procesadorCentavos: 0,
      mercatrenCentavos: 0,
      delComercioCentavos: 0,
    });
  });

  it("un negativo tampoco inventa nada", () => {
    expect(desglosarCobro(-500, true).delComercioCentavos).toBe(0);
  });
});

describe("sumar los métodos del mes", () => {
  it("junta tarjeta y Zelle sin perder un centavo", () => {
    const tarjeta = desglosarCobro(10_659, true);
    const zelle = desglosarCobro(103_100, false);
    const total = sumarDesgloses([tarjeta, zelle]);

    expect(total.brutoCentavos).toBe(10_659 + 103_100);
    expect(
      total.procesadorCentavos +
        total.mercatrenCentavos +
        total.delComercioCentavos,
    ).toBe(total.brutoCentavos);
  });

  it("sin ventas, todo en cero", () => {
    expect(sumarDesgloses([]).brutoCentavos).toBe(0);
  });
});
