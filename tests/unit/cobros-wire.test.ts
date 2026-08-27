import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  WIRE_COSTO_CENTAVOS,
  decidirWire,
  VARIABLE_DE_RUTA_WIRE,
} from "@/lib/cobros/wire";

const DATOS = {
  beneficiario: "Mercatren LLC",
  banco: "JPMorgan Chase Bank, N.A.",
  cuenta: "000000000",
  rutaWire: "000000000",
};
const MINIMO = 20_000;
const FACTURA = 277_404;

describe("pagar por cable", () => {
  it("el costo SE SUMA a la factura y se dice cuánto es", () => {
    /* La factura son $2.774,04, recibir el cable cuesta $30: transfiere
       $2.804,04. Meterlo callado dentro del total hace que alguien mande el
       monto de la factura y se quede corto por treinta dólares. */
    const d = decidirWire(DATOS, FACTURA, MINIMO);
    expect(d.disponible).toBe(true);
    if (!d.disponible) return;
    expect(d.costoCentavos).toBe(3_000);
    expect(d.totalATransferirCentavos).toBe(280_404);
  });

  it("el costo es editable, porque el banco lo cambia sin avisar", () => {
    const d = decidirWire(DATOS, FACTURA, MINIMO, 3_500);
    if (!d.disponible) throw new Error("debía estar disponible");
    expect(d.costoCentavos).toBe(3_500);
    expect(d.totalATransferirCentavos).toBe(280_904);
  });

  it("UN COSTO EN CERO CAE AL RESPALDO, no regala el cable", () => {
    /* Ofrecer un cable «gratis» que a nosotros nos cuesta treinta dólares es
       perder dinero en cada uno, y en silencio. */
    for (const malo of [0, -100, Number.NaN]) {
      const d = decidirWire(DATOS, FACTURA, MINIMO, malo);
      if (!d.disponible) throw new Error("debía estar disponible");
      expect(d.costoCentavos).toBe(WIRE_COSTO_CENTAVOS);
    }
  });

  it("LAS CUATRO COSAS O NINGUNA", () => {
    /* Media instrucción bancaria manda el dinero a otra parte. */
    for (const falta of [
      "beneficiario",
      "banco",
      "cuenta",
      "rutaWire",
    ] as const) {
      const parcial = { ...DATOS, [falta]: "" };
      expect(decidirWire(parcial, FACTURA, MINIMO)).toEqual({
        disponible: false,
        motivo: "sin_datos",
      });
    }
  });

  it("por debajo del mínimo no se ofrece", () => {
    /* Lo valida una persona, igual que el ACH y que Zelle: por debajo del
       mínimo ese trabajo se come el margen entero. */
    expect(decidirWire(DATOS, 5_000, MINIMO)).toEqual({
      disponible: false,
      motivo: "monto_bajo",
    });
  });
});

describe("el candado de la ruta", () => {
  /**
   * SE MIRA EL CÓDIGO, NO LOS COMENTARIOS.
   *
   * La primera versión leía el archivo entero y se ponía roja por la propia
   * explicación —que nombra la ruta de ACH justamente para advertir de la
   * trampa—. Un candado que castiga la documentación termina borrando la
   * documentación, que es lo contrario de lo que hace falta aquí.
   */
  const sinComentarios = readFileSync("src/lib/cobros/wire.ts", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const fuente = sinComentarios;

  it("LEE LA RUTA DE WIRE Y JAMÁS LA DE ACH", () => {
    /* Chase lo dice en su propia pantalla: la ruta de ACH solo sirve para
       depósitos directos y ACH. Poner una donde va la otra deja el dinero
       dando vueltas entre bancos. */
    expect(VARIABLE_DE_RUTA_WIRE).toBe("PAGO_RUTA_WIRE");
    expect(fuente).not.toContain("PAGO_RUTA_ACH");
  });

  it("no lleva ni un número de cuenta escrito en el código", () => {
    /* El repositorio es público. */
    expect(fuente).not.toMatch(/\d{9,}/);
  });
});
