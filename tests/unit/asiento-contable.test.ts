import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { comisionDelProcesador } from "@/lib/dinero";

/**
 * EL ASIENTO DEL MES QUE SE LLEVA EL CONTADOR A XERO.
 *
 * Tres cosas estaban mal el 21 de agosto y las tres declaraban de más:
 * el mes salía siempre «1970-01», la comisión del procesador era un `0` fijo
 * con un comentario que prometía lo contrario, y la ruta se la dejaba
 * descargar a cualquier comercio.
 */
describe("lo que se llevó el procesador", () => {
  it("2.9 % del cobro más treinta centavos", () => {
    /* $100 en un solo cobro: 2.9 % son $2.90, más $0.30 = $3.20. */
    expect(comisionDelProcesador(10_000, 1)).toBe(320);
  });

  it("los treinta centavos son POR COBRO, no por mes", () => {
    /* Diez cobros de $10 pagan diez veces la parte fija. Cobrarla una sola vez
       le regalaría a Stripe $2.70 del margen declarado en ese mes. */
    expect(comisionDelProcesador(10_000, 10)).toBe(290 + 300);
  });

  it("sin cobros con tarjeta no hay comisión", () => {
    /* Por Zelle no interviene ningún procesador. El mes entero del histórico
       de la ferretería es Zelle: si esto devolviera algo, el asiento le
       inventaría a Stripe una comisión sobre transferencias que nunca vio. */
    expect(comisionDelProcesador(0, 0)).toBe(0);
    expect(comisionDelProcesador(50_000, 0)).toBe(0);
  });

  it("un negativo no fabrica dinero", () => {
    expect(comisionDelProcesador(-100, 2)).toBe(0);
  });
});

describe("el asiento agrupa por MES de verdad", () => {
  const fuente = readFileSync("src/lib/exportar/consultas.ts", "utf8");
  const asiento = fuente.slice(
    fuente.indexOf("export async function tablaDelAsientoMensual"),
  );

  it("no divide la fecha entre mil", () => {
    /* Las columnas son `mode: "timestamp"`, o sea SEGUNDOS. Con el `/ 1000`
       que tenían, `strftime` devolvía «1970-01» para todo y el asiento
       amontonaba el histórico entero en una sola fila — justo lo contrario de
       un asiento MENSUAL. */
    expect(
      asiento,
      "volvió el /1000: los meses del asiento se van otra vez a 1970",
    ).not.toContain("/ 1000, 'unixepoch'");
    expect(asiento).toContain("'unixepoch'");
  });

  it("la comisión del procesador no es un cero fijo", () => {
    expect(asiento).toContain("comisionDelProcesador(");
    expect(asiento).not.toContain("const procesador = 0");
  });
});
