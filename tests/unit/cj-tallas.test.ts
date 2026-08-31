import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  pareceTalla,
  partirVariante,
  valeLaPenaGuardar,
} from "@/lib/cj/tallas";

/**
 * LA ROPA SE VENDE CON SU TALLA (30 ago 2026).
 *
 * Lo cazó el dueño: «cuando un producto de ropa agregamos que no tiene
 * talla, ¿cómo lo vendemos? eso es grave». El circuito existía entero
 * —ficha, carrito, pedido, compra al proveedor— y faltaba el primer
 * eslabón: guardarlas al importar de CJ.
 */
describe("partir la variante de CJ", () => {
  it("«Black-XXL» son color Y talla, cada uno en su sitio", () => {
    expect(partirVariante("Black-XXL")).toEqual({
      talla: "XXL",
      color: "Black",
    });
  });

  it("una sola opción se coloca donde corresponde", () => {
    expect(partirVariante("XL")).toEqual({ talla: "XL", color: null });
    expect(partirVariante("Red")).toEqual({ talla: null, color: "Red" });
  });

  it("NADA SE DESCARTA: lo que no es talla se junta como color", () => {
    /* Un «Cotton» perdido deja dos variantes que el comprador no distingue. */
    expect(partirVariante("Blue-4XL-Cotton")).toEqual({
      talla: "4XL",
      color: "Blue · Cotton",
    });
  });

  it("las tallas numéricas de calzado cuentan; un año NO", () => {
    expect(pareceTalla("38")).toBe(true);
    expect(pareceTalla("10.5")).toBe(true);
    expect(pareceTalla("One Size")).toBe(true);
    /* «2026» aparece en los títulos de CJ y no es ninguna talla. */
    expect(pareceTalla("2026")).toBe(false);
    expect(pareceTalla("Black")).toBe(false);
  });

  it("vacío no inventa nada", () => {
    expect(partirVariante(null)).toEqual({ talla: null, color: null });
    expect(partirVariante("  ")).toEqual({ talla: null, color: null });
  });

  it("UNA SOLA VARIANTE NO SE GUARDA — sería obligar a elegir lo único que hay", () => {
    expect(valeLaPenaGuardar([{ talla: "M", color: null }])).toBe(false);
    expect(valeLaPenaGuardar([])).toBe(false);
    expect(
      valeLaPenaGuardar([
        { talla: "M", color: null },
        { talla: "L", color: null },
      ]),
    ).toBe(true);
    /* Dos variantes sin ninguna opción legible tampoco: no dicen nada. */
    expect(
      valeLaPenaGuardar([
        { talla: null, color: null },
        { talla: null, color: null },
      ]),
    ).toBe(false);
  });
});

describe("el circuito de la talla, de punta a punta", () => {
  it("EL IMPORTADOR GUARDA LAS TALLAS al agregar y al reagregar", () => {
    const fuente = readFileSync("src/lib/cj/importar.ts", "utf-8");
    expect(fuente).toContain("async function guardarTallas(");
    /* Los dos caminos: producto nuevo y producto que ya estaba. */
    expect(fuente.match(/await guardarTallas\(/g)?.length).toBe(2);
    /* Nunca tumba el guardado del producto. */
    expect(fuente).toContain("Las tallas nunca tumban el guardado");
  });

  it("LA COMPRA A CJ RESPETA LA TALLA QUE ELIGIÓ EL CLIENTE", () => {
    const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf-8");
    expect(fuente).toContain("skuDeSuVariante");
    expect(fuente).toContain(
      "elegidas?.[r.productoId] ?? r.skuDeSuVariante ?? undefined",
    );
  });
});
