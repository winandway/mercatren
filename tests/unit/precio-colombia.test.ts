import { describe, expect, it } from "vitest";

import { desglosarColombia } from "@/lib/destino/precio-colombia";

/* Tasa redonda para comprobar a mano: $1 = 4.000 pesos colombianos. */
const CUATRO_MIL = 400_000;

describe("el precio de Colombia", () => {
  it("la conversión, comprobable a mano", () => {
    const d = desglosarColombia(1_000, 200, CUATRO_MIL);
    if (!d) throw new Error("debía calcular");
    /* base = ceil((1230×10000)/6710) = 1834 centavos = $18.34 → 73.360 COP */
    expect(d.baseUsdCentavos).toBe(1_834);
    expect(d.publicadoCop).toBe(Math.ceil((1_834 * CUATRO_MIL) / 10_000));
    expect(d.publicadoCop).toBe(73_360);
    expect(Number.isInteger(d.publicadoCop)).toBe(true);
  });

  it("SIN IVA nuestro y SIN tope: no existen esos campos", () => {
    /* En Colombia no hay régimen registrado: cobrar un impuesto que nadie nos
       mandó a cobrar sería tan grave como no cobrar el que sí. */
    const d = desglosarColombia(30_000, 1_000, CUATRO_MIL);
    if (!d) throw new Error("debía calcular");
    expect("ivaClp" in d).toBe(false);
    expect("superaTope" in d).toBe(false);
  });

  it("una tasa rota no calcula", () => {
    /* 400 pesos por dólar es un dedo de menos: el catálogo entero saldría a
       la décima parte de su precio. */
    for (const mala of [0, -1, 40_000, 99_999, Number.NaN]) {
      expect(desglosarColombia(1_000, 0, mala)).toBeNull();
    }
  });

  it("sin costo no hay precio", () => {
    expect(desglosarColombia(0, 0, CUATRO_MIL)).toBeNull();
  });
});
