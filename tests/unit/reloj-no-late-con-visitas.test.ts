import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { RELOJ_APAGADO } from "@/lib/en-pausa";

/**
 * EL RELOJ NO ESCRIBE NI CON VISITAS NI EN PAUSA (8 nov 2026).
 *
 * `latirConElTrafico` corría un latido entero desde cada visita y no miraba
 * `RELOJ_APAGADO`: con Mercatren en pausa seguía escribiendo ~300 filas por
 * hora en `configuracion` (7.092 el 7 nov). Se lee el código y no se importa
 * `tick.ts` a propósito: arrastra medio catálogo a la cuenta de cobertura.
 */
const tick = readFileSync("src/lib/reloj/tick.ts", "utf-8");

/** El cuerpo de una función, hasta su primera consulta a la base. */
function antesDeLaBase(nombre: string): string {
  const desde = tick.indexOf(`export async function ${nombre}(`);
  expect(desde, nombre).toBeGreaterThan(-1);
  const cuerpo = tick.slice(desde);
  return cuerpo.slice(0, cuerpo.indexOf("getDb()"));
}

describe("el reloj en pausa", () => {
  it("la pausa sigue puesta", () => {
    expect(RELOJ_APAGADO).toBe(true);
  });

  it("reclamarTick y correrTick salen antes de tocar la base", () => {
    expect(antesDeLaBase("reclamarTick")).toContain(
      "if (RELOJ_APAGADO) return false;",
    );
    expect(antesDeLaBase("correrTick")).toMatch(/if \(RELOJ_APAGADO\) return/);
  });

  it("ninguna visita llama al latido", () => {
    expect(tick).not.toContain("latirConElTrafico(");
  });
});
