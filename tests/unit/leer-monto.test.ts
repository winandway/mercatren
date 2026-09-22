import { describe, expect, it } from "vitest";

import { leerMontoEnCentavos } from "@/lib/facturar/leer-monto";

/**
 * ══ EL MONTO DE 6.483,77 QUE SE LEYÓ COMO 6,48 (21 sep 2026) ══
 *
 * Richard estaba emitiendo una factura de seis mil dólares y la pantalla hizo
 * toda la cuenta con seis dólares y medio, sin avisar. Comprobada en rojo
 * devolviendo el viejo `replace(",", ".") + parseFloat`.
 */
describe("el monto se lee como lo escribe una persona", () => {
  it("EL CASO: 6.483,77 son seis mil, no seis", () => {
    expect(leerMontoEnCentavos("6.483,77")).toBe(648_377);
    expect(leerMontoEnCentavos("6.483,77 $")).toBe(648_377);
    expect(leerMontoEnCentavos("$ 6.483,77")).toBe(648_377);
  });

  it("manda el último separador, venga como venga", () => {
    expect(leerMontoEnCentavos("6,483.77")).toBe(648_377);
    expect(leerMontoEnCentavos("1.234.567,89")).toBe(123_456_789);
    expect(leerMontoEnCentavos("1,234,567.89")).toBe(123_456_789);
  });

  it("un solo separador con tres cifras detrás son miles", () => {
    expect(leerMontoEnCentavos("6.483")).toBe(648_300);
    expect(leerMontoEnCentavos("1,250")).toBe(125_000);
    /* Y con dos cifras detrás, son centavos. */
    expect(leerMontoEnCentavos("6.48")).toBe(648);
    expect(leerMontoEnCentavos("6,48")).toBe(648);
  });

  it("lo simple sigue funcionando", () => {
    expect(leerMontoEnCentavos("100")).toBe(10_000);
    expect(leerMontoEnCentavos("0.99")).toBe(99);
    expect(leerMontoEnCentavos("3038.47")).toBe(303_847);
    expect(leerMontoEnCentavos("199,05")).toBe(19_905);
  });

  it("redondea al centavo y no acepta basura", () => {
    /* Cuatro decimales: alguien se pasó de teclas. */
    expect(leerMontoEnCentavos("10,0051")).toBe(1_001);
    /* Y «10,005» son diez mil cinco: tres cifras detrás de un único
       separador son miles, no milésimas. */
    expect(leerMontoEnCentavos("10,005")).toBe(1_000_500);
    expect(leerMontoEnCentavos("")).toBeNull();
    expect(leerMontoEnCentavos("abc")).toBeNull();
    expect(leerMontoEnCentavos("$")).toBeNull();
  });

  it("nunca devuelve un número más chico que lo escrito por un separador", () => {
    /* La forma del fallo: cualquier texto con miles tiene que dar ≥ 1.000. */
    for (const texto of ["1.000", "1,000", "12.500,50", "12,500.50"]) {
      expect(leerMontoEnCentavos(texto)!, texto).toBeGreaterThanOrEqual(
        100_000,
      );
    }
  });
});

describe("la calculadora usa este lector, y no parseFloat a pelo", () => {
  it("el componente lee el monto con `leerMontoEnCentavos`", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync(
      "src/components/panel/facturar/calculadora-factura.tsx",
      "utf8",
    );
    expect(fuente).toContain("leerMontoEnCentavos(monto)");
    /* El que se comió los miles: `replace(",", ".")` + `parseFloat`. */
    expect(fuente).not.toContain('replace(",", ".")');
    expect(fuente).not.toContain("parseFloat");
  });

  it("y deja poner cuántas unidades de cada producto", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync(
      "src/components/panel/facturar/calculadora-factura.tsx",
      "utf8",
    );
    expect(fuente).toContain("setCantidades");
    expect(fuente).toContain("fijas: n");
    expect(fuente).toContain('type="number"');
  });
});
