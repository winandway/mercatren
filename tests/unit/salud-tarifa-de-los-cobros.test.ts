import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ EL CANARIO DICE SI LOS COBROS NUEVOS LLEVAN SU TARIFA (8 sep 2026) ══
 *
 * Al subir Zelle al 6 %, la tarifa de cada cobro se guarda al crearlo y sin
 * fila vale el 3 % viejo. El insert va dentro de un `try`: si la tabla no
 * llegara a producción, TODOS los cobros nuevos saldrían al 3 % en silencio.
 * Por eso `/datos/salud` lo dice en voz alta, y esta prueba impide que ese
 * renglón desaparezca.
 */
describe("el canario vigila la tarifa de los cobros", () => {
  it("la pieza existe, lee la tabla y cuenta los cobros de hoy sin fila", () => {
    const piezas = leer("src/lib/salud/piezas.ts");
    expect(piezas).toContain("export async function tarifaDeLosCobros");
    expect(piezas).toContain("schema.tarifasDelCobro");
    expect(piezas).toContain("sinTarifa");
  });

  it("/datos/salud publica el renglón `tarifas`", () => {
    const ruta = leer("src/app/datos/salud/route.ts");
    expect(ruta).toContain("tarifaDeLosCobros(),");
    expect(ruta).toMatch(/\n\s+tarifas,\n\s+cookies: \{/);
  });

  it("y los creadores de cobros no se tragan el fallo sin decirlo", () => {
    for (const f of [
      "src/lib/cobros/pedir.ts",
      "src/app/datos/socios/cobro/route.ts",
    ]) {
      const s = leer(f);
      const i = s.indexOf("insert(tarifasDelCobro)");
      expect(i, f).toBeGreaterThan(0);
      expect(s.slice(i, i + 600), f).toMatch(/console\.error\(/);
    }
  });
});
