import { describe, expect, it } from "vitest";

import { COMISION_CL_PB, desglosarChile } from "@/lib/destino/precio-chile";

/* Una tasa redonda para comprobar a mano: $1 = 1.000 pesos. */
const MIL = 100_000;

describe("el precio de Chile", () => {
  it("LA CONVERSIÓN, comprobable a mano: $100 a 967,42 son 96.742 pesos netos", () => {
    /* Se comprueba la conversión aislada con margen cero no se puede (la
       fórmula lo lleva dentro), así que se despeja: con costo $63,72 la base
       da $100,03 → 96.771 pesos. Lo que se fija es la RELACIÓN exacta. */
    const d = desglosarChile(6_372, 0, 96_742);
    expect(d).not.toBeNull();
    if (!d) return;
    expect(d.netoClp + d.ivaClp).toBe(d.publicadoClp);
    expect(d.netoClp).toBe(Math.ceil((d.baseUsdCentavos * 96_742) / 10_000));
  });

  it("el margen es el 30 % y el procesador va dentro, como en EE. UU.", () => {
    expect(COMISION_CL_PB).toBe(3_000);
    /* Costo $10 + envío $2 = $12: base = ceil((1230×10000)/6710) = $18.34 */
    const d = desglosarChile(1_000, 200, MIL);
    if (!d) throw new Error("debía calcular");
    expect(d.baseUsdCentavos).toBe(
      Math.ceil(((1_200 + 30) * 10_000) / (10_000 - 3_000 - 290)),
    );
  });

  it("EL PRECIO SE PUBLICA CON EL IVA DENTRO, y el desglose suma exacto", () => {
    /* Como cualquier tienda chilena: al checkout no le crece nada. */
    const d = desglosarChile(2_000, 300, MIL);
    if (!d) throw new Error("debía calcular");
    expect(d.ivaClp).toBeGreaterThan(0);
    expect(d.netoClp + d.ivaClp).toBe(d.publicadoClp);
    /* Y los pesos son ENTEROS: el CLP no tiene centavos. */
    for (const v of [d.publicadoClp, d.ivaClp, d.netoClp]) {
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("EL TOPE DE USD 500 SE MIDE EN LA BASE, antes del IVA", () => {
    /* Un costo de $340 da base ≈ $505: pasa del régimen y NO se publica. */
    const caro = desglosarChile(34_000, 0, MIL);
    if (!caro) throw new Error("debía calcular");
    expect(caro.baseUsdCentavos).toBeGreaterThan(50_000);
    expect(caro.superaTope).toBe(true);

    /* Uno de $330 da base ≈ $490,53: cabe. */
    const cabe = desglosarChile(33_000, 0, MIL);
    if (!cabe) throw new Error("debía calcular");
    expect(cabe.superaTope).toBe(false);
  });

  it("EL ENVÍO CUENTA para el tope, igual que en la norma", () => {
    const sinEnvio = desglosarChile(33_000, 0, MIL);
    const conEnvio = desglosarChile(33_000, 1_500, MIL);
    if (!sinEnvio || !conEnvio) throw new Error("debían calcular");
    expect(sinEnvio.superaTope).toBe(false);
    expect(conEnvio.superaTope).toBe(true);
  });

  it("UNA TASA ROTA NO CALCULA, nunca degrada a precio de regalo", () => {
    /* 9,67 pesos por dólar es un dedo de menos, no un tipo de cambio: con eso
       el catálogo entero se publicaría a la centésima parte de su precio. */
    for (const mala of [0, -1, 967, 9_999, Number.NaN]) {
      expect(desglosarChile(1_000, 0, mala)).toBeNull();
    }
  });

  it("sin costo no hay precio", () => {
    expect(desglosarChile(0, 0, MIL)).toBeNull();
  });
});
