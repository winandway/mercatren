import { describe, expect, it } from "vitest";

import {
  DIAS_DE_AVISO,
  estadoFiscal,
  loQueFalta,
  pareceApartadoPostal,
  puedeCobrar,
  venceEl,
} from "@/lib/fiscal/w8bene";

const EN_2026 = new Date("2026-08-21T12:00:00Z");

describe("qué falta por llenar", () => {
  const completo = {
    nombreLegal: "Ferremateriales Bley C.A",
    paisConstitucion: "VE",
    tipoEntidad: "corporacion" as const,
    direccion: "Av. Principal 12, sector centro",
    ciudad: "Valencia",
    firmanteNombre: "Bleider Hernández",
    firmanteCargo: "Gerente",
  };

  it("uno completo no tiene faltas", () => {
    expect(loQueFalta(completo)).toEqual([]);
  });

  it("DICE CUÁLES FALTAN, no solo que faltan", () => {
    /* Un «revisa los campos» con ocho casillas delante obliga a repasarlas
       adivinando — y esto lo llena alguien a 900 km que no puede preguntar. */
    const faltan = loQueFalta({ ...completo, ciudad: "", firmanteCargo: "" });
    expect(faltan).toContain("ciudad");
    expect(faltan).toContain("firmanteCargo");
    expect(faltan).toHaveLength(2);
  });

  it("los espacios no llenan un campo", () => {
    expect(loQueFalta({ ...completo, nombreLegal: "   " })).toContain(
      "nombreLegal",
    );
  });

  it("la región y el código postal son opcionales", () => {
    /* No todos los países los usan, y exigirlos deja fuera a quien no tiene. */
    expect(loQueFalta(completo)).toEqual([]);
  });
});

describe("la dirección no puede ser un apartado postal", () => {
  it("los reconoce en inglés y en español", () => {
    expect(pareceApartadoPostal("P.O. Box 1234")).toBe(true);
    expect(pareceApartadoPostal("PO BOX 99, Miami")).toBe(true);
    expect(pareceApartadoPostal("Apartado 500, Caracas")).toBe(true);
    expect(pareceApartadoPostal("Casilla postal 22")).toBe(true);
  });

  it("una dirección de verdad pasa", () => {
    expect(pareceApartadoPostal("Av. Bolívar, edificio 4, piso 2")).toBe(false);
    expect(pareceApartadoPostal("Calle 80 #12-34, Bogotá")).toBe(false);
  });

  it("una calle que contenga «box» como parte de otra palabra no engaña", () => {
    expect(pareceApartadoPostal("Boxwood Avenue 12")).toBe(false);
  });
});

describe("cuándo vence, que NO es «tres años desde hoy»", () => {
  it("vence el 31 de diciembre del tercer año siguiente", () => {
    const v = venceEl(new Date("2026-03-05T00:00:00Z"));
    expect(v.getUTCFullYear()).toBe(2029);
    expect(v.getUTCMonth()).toBe(11);
    expect(v.getUTCDate()).toBe(31);
  });

  it("firmar en marzo o en diciembre da la MISMA fecha", () => {
    /* Es la regla del IRS y no un redondeo nuestro. Calcularlo como «hoy + 3
       años» le quitaría nueve meses al de marzo, y a ese comercio se le
       pediría el papel de nuevo sin motivo. */
    const marzo = venceEl(new Date("2026-03-05T00:00:00Z"));
    const diciembre = venceEl(new Date("2026-12-28T00:00:00Z"));
    expect(marzo.getTime()).toBe(diciembre.getTime());
  });
});

describe("en qué situación está cada comercio", () => {
  it("a uno de Estados Unidos no se le pide", () => {
    /* El W-8BEN-E es el papel con el que se declara NO ser estadounidense.
       Pedírselo a una empresa que sí lo es no tiene sentido. */
    expect(estadoFiscal("US", null, EN_2026).estado).toBe("no_hace_falta");
    expect(estadoFiscal("us", null, EN_2026).estado).toBe("no_hace_falta");
  });

  it("sin formulario, falta", () => {
    expect(estadoFiscal("VE", null, EN_2026).estado).toBe("falta");
    expect(estadoFiscal("CO", null, EN_2026).estado).toBe("falta");
  });

  it("con uno vigente, al día", () => {
    const r = estadoFiscal("VE", new Date("2029-12-31T23:59:59Z"), EN_2026);
    expect(r.estado).toBe("al_dia");
  });

  it("con uno vencido, vencido", () => {
    const r = estadoFiscal("VE", new Date("2025-12-31T23:59:59Z"), EN_2026);
    expect(r.estado).toBe("vencido");
  });

  it("avisa 60 días antes", () => {
    const dentroDe30 = new Date(EN_2026.getTime() + 30 * 86_400_000);
    const r = estadoFiscal("VE", dentroDe30, EN_2026);
    expect(r.estado).toBe("por_vencer");
    expect(r.estado === "por_vencer" && r.dias).toBeLessThanOrEqual(
      DIAS_DE_AVISO,
    );
  });
});

describe("EL CANDADO: a quién se le puede pagar", () => {
  it("sin formulario NO se cobra", () => {
    /* Este es el que convierte todo lo demás en algo real. Sin él, el
       formulario es una pantalla más que nadie llena. */
    expect(puedeCobrar({ estado: "falta" })).toBe(false);
  });

  it("con el formulario vencido tampoco", () => {
    expect(
      puedeCobrar({ estado: "vencido", vence: new Date("2025-12-31") }),
    ).toBe(false);
  });

  it("al día, sí", () => {
    expect(puedeCobrar({ estado: "al_dia", vence: new Date("2029-12-31") })).toBe(
      true,
    );
  });

  it("POR VENCER SÍ COBRA, y es deliberado", () => {
    /* Frenarle el dinero a alguien porque su papel vence en cincuenta días
       sería castigarlo por adelantado. Para eso está el aviso. */
    expect(
      puedeCobrar({
        estado: "por_vencer",
        dias: 30,
        vence: new Date("2026-09-20"),
      }),
    ).toBe(true);
  });

  it("una tienda de Estados Unidos cobra sin nada", () => {
    expect(puedeCobrar({ estado: "no_hace_falta" })).toBe(true);
  });
});

describe("el candado está enchufado de verdad", () => {
  /**
   * Las pruebas de arriba comprueban las reglas. Esta comprueba que el
   * dinero de verdad pase por ellas: `puedeCobrar` puede seguir perfecta
   * mientras alguien la desenchufa de los retiros, y entonces todo pasa en
   * verde con el candado abierto.
   */
  it("pedirRetiro comprueba la situación fiscal", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/retiros/acciones.ts", "utf8");

    expect(
      fuente,
      "los retiros dejaron de mirar el formulario fiscal",
    ).toContain("puedeCobrar(fiscal)");
    expect(fuente).toContain('from "@/lib/fiscal/acciones"');
  });

  it("y lo hace ANTES de tocar el saldo", async () => {
    /* Si se comprobara después de apartar el dinero, un comercio sin
       formulario dejaría su saldo bloqueado por un retiro que nunca sale. */
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/retiros/acciones.ts", "utf8");
    expect(fuente.indexOf("puedeCobrar(fiscal)")).toBeLessThan(
      fuente.indexOf("obtenerPosicion(tiendaId)"),
    );
  });
});
