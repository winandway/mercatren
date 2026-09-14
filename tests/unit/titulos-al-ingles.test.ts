import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ══ TÍTULOS AL INGLÉS PARA EL CATÁLOGO VENEZOLANO (14 sep 2026) ══
 *
 * Los comercios escriben en español y `titulo_en` quedaba vacío: la ficha
 * en inglés enseñaba el español. El reloj lo traduce por tandas, solo lo
 * publicado, con la misma regla de siempre: nada inventado.
 */
const modelo = readFileSync("src/lib/traduccion/modelo.ts", "utf8");
const tanda = readFileSync("src/lib/traduccion/tanda.ts", "utf8");
const tick = readFileSync("src/lib/reloj/tick.ts", "utf8");

describe("al inglés", () => {
  it("la instrucción prohíbe inventar y respeta marcas y códigos", () => {
    expect(modelo).toContain(
      "Do not invent features the original does not state.",
    );
    expect(modelo).toContain(
      "Keep brands and reference codes exactly as they are.",
    );
    expect(modelo).toContain("export async function traducirTandaAlIngles(");
  });
  it("la tanda toma SOLO lo venezolano publicado con inglés vacío, lo más viejo primero", () => {
    expect(tanda).toContain('eq(tiendas.paisOrigen, "VE")');
    expect(tanda).toMatch(
      /or\(isNull\(productos\.tituloEn\), sql`trim\(\$\{productos\.tituloEn\}\) = ''`\)/,
    );
    expect(tanda).toContain("traducirTandaAlIngles(");
    /* Un resultado vacío del modelo NO borra ni escribe nada. */
    expect(tanda).toContain("if (!x.tituloEn.trim()) continue;");
  });
  it("el reloj pide una tanda por latido", () => {
    expect(tick).toContain("tandasTitulosIngles: 1,");
  });
});
