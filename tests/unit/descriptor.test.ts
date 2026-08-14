import { describe, expect, it } from "vitest";

import {
  LARGO_MAXIMO,
  POR_DEFECTO,
  sufijoDelExtracto,
} from "@/lib/pagos/descriptor";

/**
 * LO QUE SE LEE EN EL ESTADO DE CUENTA.
 *
 * Lo que se vigila aqui es que el cobro NUNCA lo rechace Stripe por el texto
 * del extracto —eso seria una venta perdida en la pantalla de pago, con un
 * motivo que no se parece a la causa— y que el comprador pueda reconocer su
 * compra tres semanas despues.
 */

describe("el sufijo del estado de cuenta", () => {
  it("lleva el numero del pedido, que es lo que identifica la compra", () => {
    expect(sufijoDelExtracto("MT-000003")).toBe("MT-000003");
  });

  it("nunca pasa del largo que deja el limite de Stripe", () => {
    /* Prefijo + separador + sufijo no puede pasar de 22, y Stripe rechaza el
       cobro entero cuando se pasa. */
    for (const referencia of [
      "FACTURA-DE-MOSTRADOR-2026-0001",
      "x".repeat(200),
      "AAAAAAAAAAAAAAAAAAAAAA",
    ]) {
      expect(sufijoDelExtracto(referencia).length).toBeLessThanOrEqual(
        LARGO_MAXIMO,
      );
    }
  });

  it("quita lo que Stripe no admite", () => {
    /* Con cualquiera de estos dentro, Stripe devuelve error y no cobra. */
    expect(sufijoDelExtracto("FAC<>\"'\\9")).toBe("FAC9");
  });

  it("quita el asterisco, que es el separador del propio Stripe", () => {
    /* Dentro del texto se leeria como si fueran dos cobros distintos. */
    expect(sufijoDelExtracto("FAC*9")).toBe("FAC9");
  });

  it("los acentos y las eñes se pasan a letras simples", () => {
    /* Un extracto de un banco de Estados Unidos los enseña como signos raros
       o se los come. */
    expect(sufijoDelExtracto("FACTÚRA")).toBe("FACTURA");
    expect(sufijoDelExtracto("AÑO-9")).toBe("ANO-9");
  });

  it("una referencia de puros numeros sigue identificando la compra", () => {
    /* Stripe exige al menos una letra. Una factura «0012» es normalisima en un
       mostrador, y sola haria que el cobro se rechazara. Se le antepone la
       marca en vez de renunciar al numero. */
    const sufijo = sufijoDelExtracto("0012");
    expect(sufijo).toContain("0012");
    expect(/[a-zA-Z]/.test(sufijo)).toBe(true);
    expect(sufijo.length).toBeLessThanOrEqual(LARGO_MAXIMO);
  });

  it("no deja un guion ni un espacio colgando al cortar", () => {
    /* «MT-000003-» se lee como si el numero estuviera incompleto. */
    const sufijo = sufijoDelExtracto("FACTURAS-2026");
    expect(sufijo.endsWith("-")).toBe(false);
    expect(sufijo.trim()).toBe(sufijo);
  });

  it("sin referencia usable enseña la marca, nunca nada", () => {
    /* Un sufijo vacio deja al comprador con el prefijo solo, pero un cobro
       rechazado lo deja sin poder pagar. */
    expect(sufijoDelExtracto(null)).toBe(POR_DEFECTO);
    expect(sufijoDelExtracto(undefined)).toBe(POR_DEFECTO);
    expect(sufijoDelExtracto("")).toBe(POR_DEFECTO);
    expect(sufijoDelExtracto("   ")).toBe(POR_DEFECTO);
    expect(sufijoDelExtracto("<<>>")).toBe(POR_DEFECTO);
    expect(sufijoDelExtracto("año")).not.toBe("");
  });

  it("lo que sale siempre es aceptable para Stripe", () => {
    /* La comprobacion de conjunto: pase lo que pase, el cobro no se cae. */
    for (const referencia of [
      "MT-000003",
      "0012",
      "FAC/2026-0012",
      "Factura Nº 8",
      "  espacios  ",
      "😀😀😀",
      null,
    ]) {
      const sufijo = sufijoDelExtracto(referencia);
      expect(sufijo.length).toBeGreaterThan(0);
      expect(sufijo.length).toBeLessThanOrEqual(LARGO_MAXIMO);
      expect(/[<>\\"'*]/.test(sufijo)).toBe(false);
      expect(/[a-zA-Z]/.test(sufijo)).toBe(true);
    }
  });
});
