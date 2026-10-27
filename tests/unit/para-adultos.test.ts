import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { esProductoParaAdultos } from "@/lib/catalogo/para-adultos";

/**
 * ══ PRODUCTOS SEXUALES FUERA DEL CATÁLOGO (27 oct 2026) ══
 *
 * La política de Google Play prohíbe mostrar ayudas sexuales; la app enseña
 * el sitio entero. Esto tranca que se reconozcan las de verdad, y sobre todo
 * que NO se lleven por delante lo que solo comparte una palabra.
 */
describe("qué se retira", () => {
  it("las ayudas sexuales, en inglés y en español", () => {
    for (const t of [
      "Tongue Clit Licking Vibrator G-Spot Sucking Oral Massager",
      "Realistic dildo with suction cup",
      "Silicone Butt Plug Set",
      "Male Masturbator Cup",
      "Juguete sexual recargable",
      "Consolador realista",
      "BDSM bondage kit",
    ]) {
      expect(esProductoParaAdultos(t), t).toBe(true);
    }
  });
});

describe("qué NO se retira", () => {
  it("lo que comparte palabras pero no es lo mismo", () => {
    for (const t of [
      "6-Point Vibrating Massage Office Chair with Heat",
      "Vibration Exercise Machine Plate Platform",
      "Adult Size Winter Jacket",
      "French Style Underwire Push-Up Lingerie",
      "Wine rack 24 bottles",
      "Beer brewing kit 16 gal",
      "Masajeador de cuello vibratorio",
      "Hard rifle case with foam",
      "Hookah charcoal burner",
    ]) {
      expect(esProductoParaAdultos(t), t).toBe(false);
    }
  });

  it("un texto vacío no es nada", () => {
    expect(esProductoParaAdultos("")).toBe(false);
    expect(esProductoParaAdultos(null)).toBe(false);
  });
});

describe("el reloj lo corre", () => {
  it("cada hora, con su marca", () => {
    const tick = readFileSync(
      join(__dirname, "..", "..", "src/lib/reloj/tick.ts"),
      "utf8",
    );
    expect(tick).toMatch(/retirarProductosParaAdultos\(\)/);
    expect(tick).toMatch(/LLAVE_PARA_ADULTOS/);
  });
});
