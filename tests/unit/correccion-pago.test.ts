import { describe, expect, it } from "vitest";

import {
  alcanzaParaCerrar,
  revisarCorreccion,
} from "@/lib/zelle/reglas-correccion";

/* El caso real que abrió esto: cobro de $2.774,04, entraron $500,00. */
const DECLARADO = 277_404;
const REAL = 50_000;
const MOTIVO = "El pagador transfirió $500 en vez de $2.774,04";

describe("corregir el monto de un pago", () => {
  it("EL CASO REAL: 277.404 declarados, 50.000 recibidos", () => {
    const r = revisarCorreccion({
      montoDeclaradoCentavos: DECLARADO,
      montoRealCentavos: REAL,
      motivo: MOTIVO,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.datos.montoCentavos).toBe(50_000);
    /* Zelle no lleva procesador: la comisión es el 3 % de lo que ENTRÓ. */
    expect(r.datos.comisionCentavos).toBe(1_500);
    expect(r.datos.netoCentavos).toBe(48_500);
    expect(r.datos.diferenciaCentavos).toBe(227_404);
  });

  it("LA COMISIÓN SE RECALCULA SOBRE LO QUE ENTRÓ, no sobre lo declarado", () => {
    /* Dejarla como estaba le cobraría al comercio el 3 % de un dinero que
       nunca llegó: $83,22 en vez de $15,00. */
    const r = revisarCorreccion({
      montoDeclaradoCentavos: DECLARADO,
      montoRealCentavos: REAL,
      motivo: MOTIVO,
    });
    if (!r.ok) throw new Error("debía pasar");
    expect(r.datos.comisionCentavos).not.toBe(8_322);
    expect(r.datos.montoCentavos).toBe(
      r.datos.comisionCentavos + r.datos.netoCentavos,
    );
  });

  it("las tres partes SIEMPRE suman el monto recibido", () => {
    for (const real of [1, 99, 100, 4_567, 50_000, 277_403]) {
      const r = revisarCorreccion({
        montoDeclaradoCentavos: 277_404,
        montoRealCentavos: real,
        motivo: MOTIVO,
      });
      if (!r.ok) throw new Error(`debía pasar con ${real}`);
      expect(r.datos.comisionCentavos + r.datos.netoCentavos).toBe(real);
    }
  });

  it("NO se puede corregir hacia ARRIBA", () => {
    /* Si alguien pagó de más no se le acredita al comercio: se le devuelve.
       Acreditar de más es abrir el mismo agujero por el otro lado. */
    const r = revisarCorreccion({
      montoDeclaradoCentavos: DECLARADO,
      montoRealCentavos: DECLARADO + 1,
      motivo: MOTIVO,
    });
    expect(r).toEqual({ ok: false, aviso: "montoMayorQueElDeclarado" });
  });

  it("corregir al MISMO monto no es una corrección", () => {
    const r = revisarCorreccion({
      montoDeclaradoCentavos: DECLARADO,
      montoRealCentavos: DECLARADO,
      motivo: MOTIVO,
    });
    expect(r).toEqual({ ok: false, aviso: "montoIgual" });
  });

  it("CERO no es una corrección: eso es un rechazo", () => {
    /* Un pago aprobado en cero deja un pago «bueno» que no movió un centavo y
       al pagador sin enterarse de nada. Se rechaza, con su motivo. */
    for (const malo of [0, -1, -50_000, Number.NaN]) {
      expect(
        revisarCorreccion({
          montoDeclaradoCentavos: DECLARADO,
          montoRealCentavos: malo,
          motivo: MOTIVO,
        }),
      ).toEqual({ ok: false, aviso: "montoInvalido" });
    }
  });

  it("EL MOTIVO ES OBLIGATORIO y tiene que decir algo", () => {
    /* Un monto cambiado a mano sin explicación no se puede defender el día que
       el comercio pregunte por qué le entraron 500 y no 2.774. */
    for (const flojo of ["", "   ", "error", "ok", "se equivocó"]) {
      expect(
        revisarCorreccion({
          montoDeclaradoCentavos: DECLARADO,
          montoRealCentavos: REAL,
          motivo: flojo,
        }).ok,
      ).toBe(false);
    }
  });

  it("los centavos se truncan, nunca se redondean hacia arriba", () => {
    const r = revisarCorreccion({
      montoDeclaradoCentavos: DECLARADO,
      montoRealCentavos: 50_000.9,
      motivo: MOTIVO,
    });
    if (!r.ok) throw new Error("debía pasar");
    expect(r.datos.montoCentavos).toBe(50_000);
  });

  it("con tarjeta también entra el costo del procesador", () => {
    const r = revisarCorreccion(
      {
        montoDeclaradoCentavos: DECLARADO,
        montoRealCentavos: REAL,
        motivo: MOTIVO,
      },
      "tarjeta",
    );
    if (!r.ok) throw new Error("debía pasar");
    /* 2,9 % + $0.30 de Stripe, además del 3 % de Mercatren. */
    expect(r.datos.comisionCentavos).toBeGreaterThan(1_500);
    expect(r.datos.comisionCentavos + r.datos.netoCentavos).toBe(REAL);
  });
});

describe("¿el cobro se cierra o sigue debiendo?", () => {
  it("UN COBRO QUE RECIBIÓ DE MENOS SE QUEDA ABIERTO", () => {
    /* Cerrarlo diría que la factura está pagada, y el comercio dejaría de
       reclamar un dinero que sí le deben. */
    expect(alcanzaParaCerrar(REAL, DECLARADO)).toBe(false);
  });

  it("el monto exacto sí cierra", () => {
    expect(alcanzaParaCerrar(DECLARADO, DECLARADO)).toBe(true);
  });

  it("de más también cierra: la factura quedó cubierta", () => {
    expect(alcanzaParaCerrar(DECLARADO + 100, DECLARADO)).toBe(true);
  });
});
