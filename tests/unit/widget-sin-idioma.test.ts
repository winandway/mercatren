import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ══ EL WIDGET DEL CASILLERO DABA 404 (27 oct 2026) ══
 *
 * `/widget/form` se dibuja dentro del iframe de otras tiendas y no lleva el
 * idioma en la ruta. El middleware de idiomas lo atrapaba y lo mandaba a
 * `/en/widget/form`, que no existe. Esto exige que el matcher lo deje pasar,
 * y que siga atrapando las páginas normales.
 */
const fuente = readFileSync(
  join(__dirname, "..", "..", "src/middleware.ts"),
  "utf8",
);
const patron = fuente.match(/matcher:\s*\[\s*"([^"]+)"/)?.[1];

describe("lo que atrapa el middleware de idiomas", () => {
  it("existe el matcher", () => {
    expect(patron).toBeTruthy();
  });

  const atrapa = (ruta: string) =>
    new RegExp(`^${patron!.replace(/\\\\/g, "\\")}$`).test(ruta);

  it("deja pasar el widget, que vive fuera de [locale]", () => {
    expect(atrapa("/widget/form")).toBe(false);
  });

  it("sigue atrapando las páginas con idioma y las rutas sin él", () => {
    expect(atrapa("/en/catalogo")).toBe(true);
    expect(atrapa("/")).toBe(true);
    expect(atrapa("/cuenta")).toBe(true);
  });

  it("y sigue dejando pasar las rutas de servidor", () => {
    expect(atrapa("/datos/salud")).toBe(false);
  });
});
