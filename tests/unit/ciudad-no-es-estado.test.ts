import { describe, expect, it } from "vitest";

import { ciudadPlausibleUS } from "@/lib/destino/direccion";

/**
 * ══ LA CIUDAD NO PUEDE SER EL ESTADO (12 sep 2026) ══
 *
 * `PRUEBA-20260905184139` salió a CJ con ciudad «MI» y estado «Michigan».
 * CJ la marcó como sospechosa, preguntó, nadie contestó y el pedido llevó
 * siete días parado. Este candado corta eso antes de que salga.
 */
describe("ciudadPlausibleUS", () => {
  it("rechaza el código y el nombre de un estado en la casilla de ciudad", () => {
    expect(ciudadPlausibleUS("MI")).toBe(false);
    expect(ciudadPlausibleUS("mi")).toBe(false);
    expect(ciudadPlausibleUS("Michigan")).toBe(false);
    expect(ciudadPlausibleUS(" FL ")).toBe(false);
    expect(ciudadPlausibleUS("Florida")).toBe(false);
  });

  it("acepta una ciudad de verdad", () => {
    expect(ciudadPlausibleUS("Novi")).toBe(true);
    expect(ciudadPlausibleUS("Miami")).toBe(true);
    expect(ciudadPlausibleUS("Kansas City")).toBe(true);
  });

  it("vacío o una letra no es una ciudad", () => {
    expect(ciudadPlausibleUS("")).toBe(false);
    expect(ciudadPlausibleUS("N")).toBe(false);
    expect(ciudadPlausibleUS(null)).toBe(false);
  });
});
