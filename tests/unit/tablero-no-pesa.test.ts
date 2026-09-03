import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * EL TABLERO NO PUEDE HACER CUENTAS PESADAS (3 sep 2026).
 *
 * Se le puso «El catálogo, de un vistazo» calculando en vivo sobre las
 * ~55.000 fichas. A los cuarenta minutos el dueño no podía entrar a su
 * propio panel: con la petición agotada, la comprobación de sesión falla y
 * el layout devuelve a la persona a «entrar». Se entra bien y el panel te
 * saca, una y otra vez.
 *
 * La regla que queda: el Tablero LEE lo que el vigilante ya midió.
 */
const tablero = readFileSync("src/app/[locale]/panel/page.tsx", "utf-8");

describe("el tablero no cuenta el catálogo, lo lee", () => {
  it("usa el último latido del vigilante, no la consulta que recorre todo", () => {
    expect(tablero).toContain("inventarioDelUltimoLatido()");
    expect(tablero).not.toContain("inventarioPorPlaza()");
  });

  it("y si no hay latido todavía, no dibuja nada — nunca cuenta por su cuenta", () => {
    expect(tablero).toContain("inventarioDelUltimoLatido().catch(() => null)");
    expect(tablero).toContain("{inventario ? (");
  });

  it("la lectura es UNA fila, por fecha", () => {
    const inv = readFileSync("src/lib/vigilante/inventario.ts", "utf-8");
    expect(inv).toContain("desc(latidosVigilante.corridoEn)");
    expect(inv).toContain(".limit(1)");
  });

  it("la pantalla dice de cuándo es el dato: puede tener veinte minutos", () => {
    expect(
      readFileSync("src/components/panel/catalogo-de-un-vistazo.tsx", "utf-8"),
    ).toContain('t("medido", { n: haceMinutos })');
  });
});
