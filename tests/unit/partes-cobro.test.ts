import { describe, expect, it } from "vitest";

import {
  cuantasPartes,
  MAXIMO_PARTES,
  repartirEnPartes,
  siguienteReferencia,
} from "@/lib/cobros/partes";

/**
 * COBRAR UNA FACTURA EN VARIAS PARTES (26 ago 2026).
 *
 * El caso: una factura de $7.475 y un cliente cuyo banco le deja mandar
 * $2.500 por Zelle al día. Con un solo cobro no puede pagarla.
 */
describe("repartir el monto", () => {
  it("las partes SIEMPRE suman el total exacto", () => {
    /* Un centavo que no cuadra en una conciliación bancaria cuesta una
       llamada. Se prueban montos que no dividen redondo a propósito. */
    for (const total of [747_500, 286_071, 100, 33_333, 1]) {
      for (const partes of [1, 2, 3, 4, 7, 12]) {
        const r = repartirEnPartes(total, partes, "F-1");
        expect(
          r.reduce((s, p) => s + p.montoCentavos, 0),
          `${total} en ${partes}`,
        ).toBe(total);
      }
    }
  });

  it("ninguna parte se aleja más de un centavo de las demás", () => {
    const r = repartirEnPartes(747_500, 3, "F-00123");
    const montos = r.map((p) => p.montoCentavos);
    expect(Math.max(...montos) - Math.min(...montos)).toBeLessThanOrEqual(1);
    expect(montos).toEqual([249_167, 249_167, 249_166]);
  });

  it("numera las referencias, y con UNA parte no toca nada", () => {
    expect(
      repartirEnPartes(747_500, 3, "F-00123").map((p) => p.referencia),
    ).toEqual(["F-00123 (1/3)", "F-00123 (2/3)", "F-00123 (3/3)"]);
    /* Un cobro de una parte es el cobro de siempre: su referencia intacta. */
    const una = repartirEnPartes(747_500, 1, "F-00123");
    expect(una).toHaveLength(1);
    expect(una[0]!.referencia).toBe("F-00123");
    expect(una[0]!.montoCentavos).toBe(747_500);
  });

  it("cuantasPartes acota lo que llega del formulario", () => {
    expect(cuantasPartes("3")).toBe(3);
    expect(cuantasPartes(0)).toBe(1);
    expect(cuantasPartes(-5)).toBe(1);
    expect(cuantasPartes("hola")).toBe(1);
    /* Más partes que meses no es un abono, es un crédito. */
    expect(cuantasPartes(999)).toBe(MAXIMO_PARTES);
  });
});

describe("el siguiente número de factura", () => {
  it("respeta la numeración del comercio, no impone la nuestra", () => {
    expect(siguienteReferencia("VIG-02497")).toBe("VIG-02498");
    expect(siguienteReferencia("F-00123")).toBe("F-00124");
    /* Los ceros a la izquierda se conservan: así numera un talonario. */
    expect(siguienteReferencia("F-00009")).toBe("F-00010");
  });

  it("ignora el sufijo de parte: el siguiente es de la factura siguiente", () => {
    expect(siguienteReferencia("F-00123 (2/3)")).toBe("F-00124");
  });

  it("sin ninguna anterior, propone la primera", () => {
    expect(siguienteReferencia(null)).toBe("F-00001");
    expect(siguienteReferencia("")).toBe("F-00001");
  });

  it("y con una referencia sin números, no revienta", () => {
    expect(siguienteReferencia("FACTURA")).toBe("FACTURA-2");
  });
});
