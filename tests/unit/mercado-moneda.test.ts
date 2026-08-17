import { describe, expect, it } from "vitest";

import { formatearPrecio } from "@/lib/dinero";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { decimalesDe, divisorDe, monedaDelMercado } from "@/lib/mercado/moneda";

describe("cada país vende en su moneda", () => {
  it("Estados Unidos en dólares, Chile en pesos chilenos", () => {
    /* Decidido por el dueño el 17 ago 2026. */
    expect(monedaDelMercado(mercadoPorCodigo("US"))).toBe("USD");
    expect(monedaDelMercado(mercadoPorCodigo("CL"))).toBe("CLP");
  });
});

describe("el peso chileno no tiene centavos", () => {
  it("el dólar se divide entre 100 y el peso chileno entre 1", () => {
    expect(divisorDe("USD")).toBe(100);
    expect(divisorDe("CLP")).toBe(1);
  });

  it("Colombia y México heredan la regla sin tocar nada", () => {
    /* La tabla es por MONEDA y no por país: el día que entre Colombia, su
       peso ya sabe que no tiene centavos. Con un `if (moneda === "CLP")`
       repartido por las pantallas, el primer país nuevo repetiría el fallo. */
    expect(decimalesDe("COP")).toBe(0);
    expect(decimalesDe("PYG")).toBe(0);
  });

  it("una moneda que no está en la lista tiene dos decimales", () => {
    expect(decimalesDe("EUR")).toBe(2);
    expect(decimalesDe("BRL")).toBe(2);
  });
});

describe("el precio en pantalla", () => {
  it("el dólar sale exactamente igual que siempre", () => {
    /* Este es el que no se puede mover: si cambia, cambió el precio de todo
       el catálogo que ya está publicado. */
    expect(formatearPrecio(1050)).toBe("$10.50");
    expect(formatearPrecio(31_87, "es")).toBe("$31.87");
    expect(formatearPrecio(0)).toBe("$0.00");
  });

  it("5990 pesos chilenos son 5.990, NO 59 con 90", () => {
    /**
     * El fallo que esto evita: dividir siempre entre 100 convertía un
     * producto de 5.990 pesos en uno de 59,90. Un cero de menos en un precio
     * no es un problema de pantalla — es una venta a pérdida.
     */
    const texto = formatearPrecio(5990, "es", "CLP");
    expect(texto).toContain("5");
    expect(texto).toContain("990");
    expect(texto).not.toContain("59,90");
    expect(texto).not.toContain("59.90");
  });

  it("y no le inventa decimales al peso chileno", () => {
    /* `Intl` ya sabe que el CLP va sin decimales; lo que había que arreglar
       era el divisor, no el formato. Se comprueba igual: es la mitad de la
       cuenta y las dos tienen que estar bien. */
    expect(formatearPrecio(5990, "es", "CLP")).not.toMatch(/[.,]\d\d$/);
  });
});
