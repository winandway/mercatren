import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ══ VERIFICAR / SUSPENDER UN CASILLERO (14 sep 2026) ══
 *
 * Verificar es lo que abre el despacho a otro país; suspender lo cierra.
 * Se tranca que lo haga solo Soporte de verdad, que las acciones sean las
 * tres y ninguna más, y que cada cambio deje rastro.
 */
const accion = readFileSync("src/lib/casillero/estado-acciones.ts", "utf8");

describe("cambiar el estado de un casillero", () => {
  it("lo hace Soporte de verdad, no el disfraz de «ver el panel de un comercio»", () => {
    expect(accion).toContain("await esSoporteDeVerdad()");
    expect(accion).not.toMatch(/await esEquipoInterno\(/);
    expect(accion.indexOf("esSoporteDeVerdad()")).toBeLessThan(
      accion.indexOf("formulario.get"),
    );
  });
  it("solo admite verificar, suspender y reactivar", () => {
    expect(accion).toMatch(
      /const ACCIONES = \["verificar", "suspender", "reactivar"\] as const;/,
    );
    expect(accion).toContain("!ACCIONES.includes(accion)");
  });
  it("cada cambio deja rastro en accesos_datos y un id inexistente no cuenta como éxito", () => {
    expect(accion).toContain("db.insert(accesosDatos)");
    expect(accion).toMatch(/campo: `estado:\$\{accion\}`/);
    expect(accion).toContain('return { error: "no-existe" }');
  });
  it("la tabla del panel lleva los botones", () => {
    expect(
      readFileSync("src/app/[locale]/panel/casilleros/page.tsx", "utf8"),
    ).toContain("<EstadoCasillero");
  });
});
