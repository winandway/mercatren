import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { codigoDePais } from "@/lib/mercado/codigo-de-pais";

/**
 * EL DATO QUE DECIDE EN QUÉ PAÍS SE VENDE ALGO NO PUEDE TENER SEIS FORMAS.
 *
 * El 7 sep 2026, en la mudanza de Venezuela, la consulta buscaba `= 'VE'` y
 * movió UN comercio de seis: los otros cinco tenían escrito «Venezuela» o
 * «VENEZUELA» porque el navegador rellenaba el campo con el nombre entero.
 * Se quedaron vendiendo en el catálogo de Estados Unidos.
 */
describe("el país de un comercio se guarda como código", () => {
  it("reconoce las formas en que la gente escribe Venezuela", () => {
    for (const forma of [
      "VE",
      "ve",
      " Venezuela ",
      "VENEZUELA",
      "República Bolivariana de Venezuela",
    ]) {
      expect(codigoDePais(forma), forma).toBe("VE");
    }
  });

  it("y las de Estados Unidos, que es donde se vende de verdad", () => {
    for (const forma of [
      "US",
      "Estados Unidos",
      "ESTADOS UNIDOS",
      "United States",
      "EE.UU.",
      "usa",
    ]) {
      expect(codigoDePais(forma), forma).toBe("US");
    }
  });

  it("Chile y Colombia, que son las plazas abiertas", () => {
    expect(codigoDePais("Chile")).toBe("CL");
    expect(codigoDePais("COLOMBIA")).toBe("CO");
  });

  it("un país que no está en la lista NO se inventa", () => {
    /* Inventarle un código a un país desconocido es peor que dejarlo: el
       día que ese país importe, se agrega a la lista a mano. */
    expect(codigoDePais("Uruguay")).toBe("Uruguay");
  });

  it("vacío sigue vacío: un dato que falta no se rellena", () => {
    expect(codigoDePais("")).toBe("");
    expect(codigoDePais(null)).toBe("");
    expect(codigoDePais(undefined)).toBe("");
  });

  it("EL ALTA DE UN COMERCIO LO USA, o el dato se vuelve a ensuciar", () => {
    const acciones = readFileSync("src/lib/tiendas/acciones.ts", "utf8");
    expect(acciones).toContain("codigoDePais(d.paisOrigen)");
    /* Y no puede volver a guardarse crudo. */
    expect(acciones).not.toMatch(/paisOrigen:\s*d\.paisOrigen\s*,/);
  });
});
