import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ══ EL FLETE $0 DE EE. UU. ES ENVÍO GRATIS, Y SOLO AHÍ (13 sep 2026) ══
 *
 * Richard encontró un teléfono en 404. Estaba en revisión con stock y
 * precio porque CJ cotiza «USPS US to US = 0» y el código tomaba el cero
 * por respuesta vacía. Había 41.796 fichas de EE. UU. igual. Se midió con
 * una compra real: CJ cobró `postageAmount 0`. El cero es gratis.
 *
 * Lo que este candado tranca: que el cero se acepte SOLO en la plaza que
 * sale del almacén de EE. UU. hacia EE. UU., y que las tres piezas que
 * deciden «envío bueno» estén de acuerdo.
 */
const leer = (r: string) => readFileSync(r, "utf8");

describe("el cero solo vale de EE. UU. a EE. UU.", () => {
  it("cotizar pasa aceptarGratis únicamente cuando almacén y país son US", () => {
    const flete = leer("src/lib/cj/flete.ts");
    expect(flete).toMatch(
      /aceptarGratis:\s*plaza\.almacen === "US" && plaza\.paisEntrega === "US"/,
    );
  });

  it("el afinado acepta el cero y sigue rechazando lo ausente o negativo", () => {
    const afinar = leer("src/lib/cj/afinar.ts");
    expect(afinar).not.toContain("cotizacion.costoCentavos > 0");
    expect(afinar).toMatch(/cotizacion\.costoCentavos < 0/);
    expect(afinar).toMatch(/typeof cotizacion\.costoCentavos !== "number"/);
  });

  it("«envío bueno» es ≥ 0 en los casi listos y en el barrido, con el mismo criterio", () => {
    for (const ruta of [
      "src/lib/cj/existencias.ts",
      "src/lib/cj/verificados.ts",
    ]) {
      const fuente = leer(ruta);
      expect(fuente, ruta).toContain("gte(enviosProducto.costoCentavos, 0)");
      expect(fuente, ruta).not.toContain("gt(enviosProducto.costoCentavos, 0)");
      /* Sigue exigiendo que sea cotizado (no estimado) y no regional. */
      expect(fuente, ruta).toContain('eq(enviosProducto.origen, "cotizado")');
      expect(fuente, ruta).toContain("REGIONALES.map(");
    }
  });
});
