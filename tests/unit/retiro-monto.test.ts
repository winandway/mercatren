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
});
