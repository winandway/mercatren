import { describe, expect, it } from "vitest";

import {
  calcularComisionCentavos,
  calcularNetoVendedorCentavos,
  formatearPrecio,
} from "@/lib/dinero";

describe("formatearPrecio", () => {
  it("muestra los centavos como precio en dolares", () => {
    expect(formatearPrecio(129900)).toBe("$1,299.00");
  });

  it("no pierde el centavo suelto", () => {
    expect(formatearPrecio(1)).toBe("$0.01");
    expect(formatearPrecio(999)).toBe("$9.99");
  });

  it("usa el mismo formato de Estados Unidos en los dos idiomas", () => {
    expect(formatearPrecio(250000, "en")).toBe("$2,500.00");
    expect(formatearPrecio(250000, "es")).toBe("$2,500.00");
  });
});

describe("comision del mercado", () => {
  it("calcula el diez por ciento con 1000 puntos base", () => {
    expect(calcularComisionCentavos(10000, 1000)).toBe(1000);
  });

  it("redondea al centavo mas cercano, sin dejar fracciones", () => {
    // 3.33% de $10.00 = 33.3 centavos -> 33
    expect(calcularComisionCentavos(1000, 333)).toBe(33);
    expect(Number.isInteger(calcularComisionCentavos(9999, 777))).toBe(true);
  });

  it("la comision mas lo del vendedor siempre da el total exacto", () => {
    const casos = [1, 99, 1000, 129900, 7777];
    for (const subtotal of casos) {
      const comision = calcularComisionCentavos(subtotal, 1250);
      const vendedor = calcularNetoVendedorCentavos(subtotal, 1250);
      expect(comision + vendedor).toBe(subtotal);
    }
  });

  it("con comision cero el vendedor recibe todo", () => {
    expect(calcularNetoVendedorCentavos(50000, 0)).toBe(50000);
  });
});
