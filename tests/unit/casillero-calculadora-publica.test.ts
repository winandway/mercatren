import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ══ LA CALCULADORA PÚBLICA (16 sep 2026) ══
 *
 * Cotiza solo países con tarifa encendida, valida todo con zod, no guarda
 * nada, y la página no la dibuja si no hay ningún país.
 */
const accion = readFileSync("src/lib/casillero/calculadora-publica.ts", "utf8");
const pagina = readFileSync(
  "src/app/[locale]/(tienda)/casillero/page.tsx",
  "utf8",
);
const puerta = readFileSync("src/app/datos/probar-compra/route.ts", "utf8");

describe("la calculadora pública", () => {
  it("valida la entrada con zod y con topes", () => {
    expect(accion).toContain('from "zod"');
    expect(accion).toMatch(/pesoLb: z\.number\(\)\.min\(0\)\.max\(500\)/);
    expect(accion).toMatch(/valorUsd: z\.number\(\)\.min\(0\)\.max\(100_000\)/);
  });
  it("solo ofrece países con tarifa ENCENDIDA y con precio", () => {
    expect(accion).toMatch(
      /filter\(\(t\) => t\.activa && t\.tarifaLibraCentavos > 0\)/,
    );
  });
  it("sin países, la página no la dibuja", () => {
    expect(pagina).toMatch(/paisesCalc\.length > 0 \? \(/);
    expect(pagina).toContain("<CalculadoraEnvio");
  });
  it("no escribe en la base: es solo lectura", () => {
    expect(accion).not.toMatch(/\.insert\(|\.update\(|\.delete\(/);
  });
});

describe("la puerta carga y cotiza tarifas", () => {
  it("«tarifa» no enciende una tarifa sin precio, y «cotizar» usa la del país", () => {
    expect(puerta).toContain('z.literal("tarifa")');
    expect(puerta).toContain("No se enciende una tarifa sin precio.");
    expect(puerta).toContain('z.literal("cotizar")');
    expect(puerta).toContain("cotizarEnvio(");
  });
});

describe("la calculadora se encuentra (16 sep 2026: «no la veo por ningún lado»)", () => {
  it("tiene su propia página y se enlaza desde el casillero, mi casillero, la cuenta, la ficha y el pie", () => {
    expect(
      readFileSync(
        "src/app/[locale]/(tienda)/casillero/calculadora/page.tsx",
        "utf8",
      ),
    ).toContain("<CalculadoraEnvio");
    expect(pagina.match(/href="\/casillero\/calculadora"/g)?.length).toBe(3);
    for (const ruta of [
      "src/app/[locale]/(tienda)/casillero/mi-casillero/page.tsx",
      "src/app/[locale]/(tienda)/cuenta/page.tsx",
      "src/components/casillero/invitacion-casillero.tsx",
      "src/components/layout/pie-pagina.tsx",
    ]) {
      expect(readFileSync(ruta, "utf8"), ruta).toContain(
        "/casillero/calculadora",
      );
    }
  });
  it("en la página del casillero va arriba, antes de «Cómo funciona»", () => {
    expect(pagina.indexOf('id="calculadora"')).toBeLessThan(
      pagina.indexOf('t("comoTitulo")'),
    );
  });
});
