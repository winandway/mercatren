import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REGLA DEL PROYECTO: ninguna contrasena se escribe a ciegas.
 *
 * Toda casilla de contrasena pasa por <CampoClave>, que trae el ojito para
 * verla. Esta prueba caza el `type="password"` suelto que alguien agregue en
 * el futuro sin darse cuenta.
 *
 * Por que importa: sin el ojito, quien pega una contrasena guardada no puede
 * comprobar que pego la que era. El resultado es "credenciales incorrectas"
 * sin saber por que, y a veces la cuenta bloqueada.
 */

const RAIZ = join(import.meta.dirname, "..", "..", "src");
const UNICO_PERMITIDO = join(RAIZ, "components", "cuenta", "campo-clave.tsx");

function archivosDeCodigo(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivosDeCodigo(ruta);
    return /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

describe("casillas de contrasena", () => {
  it("solo CampoClave declara type=password; el resto lo usa a el", () => {
    const sueltos = archivosDeCodigo(RAIZ)
      .filter((ruta) => ruta !== UNICO_PERMITIDO)
      .filter((ruta) =>
        /type=["']password["']/.test(readFileSync(ruta, "utf8")),
      )
      .map((ruta) => ruta.slice(RAIZ.length + 1));

    expect(
      sueltos,
      "estos archivos escriben una contrasena sin el ojito: usa <CampoClave>",
    ).toEqual([]);
  });

  it("CampoClave trae el ojito y arranca oculto", () => {
    const codigo = readFileSync(UNICO_PERMITIDO, "utf8");

    expect(codigo).toContain("useState(false)");
    expect(codigo).toContain('visible ? "text" : "password"');
    expect(codigo).toContain("aria-label");
  });
});
