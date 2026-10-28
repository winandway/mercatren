import { describe, expect, it } from "vitest";

import { aCentavos } from "@/lib/retiros/monto";

/**
 * El monto de un retiro lo escribe una persona, y de aquí sale dinero de
 * verdad. Un centavo mal convertido es un centavo que alguien reclama.
 */
describe("el monto que escribe el comercio", () => {
  it("convierte lo normal", () => {
    expect(aCentavos("1000")).toBe(100000);
    expect(aCentavos("1000.50")).toBe(100050);
    expect(aCentavos("0.99")).toBe(99);
    expect(aCentavos("25.5")).toBe(2550);
  });

  it("aguanta cómo lo escribe la gente de verdad", () => {
    expect(aCentavos("$1,000.50")).toBe(100050);
    expect(aCentavos("  1000.50  ")).toBe(100050);
    expect(aCentavos(".50")).toBe(50);
  });

  it("NO pierde el centavo de la coma flotante", () => {
    // 932.76 * 100 da 93275.99999999999 en JavaScript. Por texto, no.
    expect(aCentavos("932.76")).toBe(93276);
    expect(aCentavos("0.07")).toBe(7);
    expect(aCentavos("19.99")).toBe(1999);
  });

  it("rechaza lo que no es un monto", () => {
    expect(aCentavos("")).toBeNull();
    expect(aCentavos("abc")).toBeNull();
    expect(aCentavos("1.2.3")).toBeNull();
    // Tres decimales: quien lo escribió pensaba en otra cosa. No se redondea
    // el dinero de nadie por nuestra cuenta.
    expect(aCentavos("10.005")).toBeNull();
  });

  it("ENTIENDE LA COMA DECIMAL DE ESPAÑA (27 oct 2026)", () => {
    // Antes «121,25» se leía 12125 euros, y «1,50», ciento cincuenta.
    expect(aCentavos("121,25")).toBe(12125);
    expect(aCentavos("1,50")).toBe(150);
    expect(aCentavos("1,5")).toBe(150);
    expect(aCentavos("1.234,56")).toBe(123456);
    expect(aCentavos("1.234.567,89")).toBe(123456789);
    // Y lo de Estados Unidos sigue igual.
    expect(aCentavos("1,000")).toBe(100000);
    expect(aCentavos("1,000,000.25")).toBe(100000025);
    expect(aCentavos("1,000.50")).toBe(100050);
  });

  it("en una moneda sin decimales, la coma con tres cifras son miles", () => {
    expect(aCentavos("5,990", 0)).toBe(5990);
    expect(aCentavos("5990", 0)).toBe(5990);
    // Un decimal donde la moneda no tiene: se rechaza, no se lee como miles.
    expect(aCentavos("5990,5", 0)).toBeNull();
    expect(aCentavos("1,2345")).toBeNull();
  });
});
