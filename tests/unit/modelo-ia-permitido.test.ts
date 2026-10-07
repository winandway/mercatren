import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  MODELO_POR_DEFECTO,
  MODELOS_APROBADOS,
  modeloPermitido,
} from "@/lib/ia/modelo-permitido";

/**
 * ══ UN MODELO CARO ESCRITO EN EL PANEL NO SE OBEDECE (7 oct 2026) ══
 *
 * El traductor (cada minuto, decenas de miles de productos) y la búsqueda por
 * foto (cualquier visitante) tomaban el modelo de la variable del panel sin
 * ningún freno. La regla de la casa, después de facturas de $500 y $200:
 * configurar un modelo caro en un panel NO debe poder activarlo.
 */
describe("la lista cerrada de modelos", () => {
  it("vacío usa el barato de siempre", () => {
    expect(modeloPermitido(undefined)).toEqual({
      modelo: "gemini-2.5-flash",
      rechazado: null,
    });
    expect(modeloPermitido("  ").modelo).toBe(MODELO_POR_DEFECTO);
  });

  it("un modelo aprobado se respeta", () => {
    expect(modeloPermitido("gemini-2.5-flash-lite")).toEqual({
      modelo: "gemini-2.5-flash-lite",
      rechazado: null,
    });
  });

  it("EL CASO QUE SE CIERRA: un modelo caro se ignora y se dice cuál fue", () => {
    for (const caro of ["gemini-2.5-pro", "gemini-3-pro", "gemini-ultra"]) {
      const e = modeloPermitido(caro);
      expect(e.modelo).toBe(MODELO_POR_DEFECTO);
      expect(e.rechazado).toBe(caro);
    }
  });

  it("no se cuela por mayúsculas, espacios ni sufijos", () => {
    expect(modeloPermitido("GEMINI-2.5-PRO").rechazado).toBe("GEMINI-2.5-PRO");
    expect(modeloPermitido("gemini-2.5-flash-pro").rechazado).toBe(
      "gemini-2.5-flash-pro",
    );
  });

  it("en la lista no hay ningún modelo «pro» ni «ultra»", () => {
    /* Agregar uno exige la autorización de Richard con el costo escrito. */
    for (const m of MODELOS_APROBADOS) {
      expect(m).not.toMatch(/pro|ultra|opus/i);
    }
  });
});

describe("nadie lee la variable del modelo sin pasar por la lista", () => {
  it("TRADUCCION_MODELO solo se lee a través de modeloPermitido", () => {
    let crudo = "";
    try {
      crudo = execFileSync("grep", ["-rn", "TRADUCCION_MODELO", "src/lib"], {
        encoding: "utf8",
      });
    } catch {
      /* grep sale con 1 si no encuentra nada. */
    }
    const lecturas = crudo
      .split("\n")
      .filter(Boolean)
      /* Los comentarios y el propio aviso no leen la variable. */
      .filter((l) => !/:\s*(\*|\/\/|\/\*)/.test(l))
      .filter((l) => !l.startsWith("src/lib/ia/"));
    for (const l of lecturas) {
      expect(l, l).toContain("modeloPermitido(");
    }
    expect(lecturas.length).toBeGreaterThanOrEqual(2);
  });
});

/**
 * ══ EL TECHO DIARIO DE LA BÚSQUEDA POR FOTO (7 oct 2026) ══
 *
 * Es la única pieza donde cualquier visitante dispara un gasto de IA. El tope
 * por IP se esquiva cambiando de IP; el techo de todos juntos no. Y tiene que
 * revisarse ANTES de llamar a Google: revisarlo después no ahorra nada.
 */
describe("la búsqueda por foto tiene techo diario", () => {
  const fuente = readFileSync("src/lib/busqueda-imagen/acciones.ts", "utf8");

  it("el techo existe, y no se exporta (es un archivo de acciones)", () => {
    expect(fuente).toMatch(/^const BUSQUEDAS_POR_DIA_EN_TOTAL = \d+;/m);
    expect(fuente).not.toMatch(/^export const BUSQUEDAS_POR_DIA_EN_TOTAL/m);
  });

  it("se revisa antes de mirar la foto y antes del vector", () => {
    const techo = fuente.indexOf(">= BUSQUEDAS_POR_DIA_EN_TOTAL");
    expect(techo).toBeGreaterThan(-1);
    expect(techo).toBeLessThan(fuente.indexOf("await mirarImagen("));
    expect(techo).toBeLessThan(fuente.indexOf("await embeddingDeImagen("));
  });

  it("cuenta las últimas 24 horas de todos, no solo de una IP", () => {
    expect(fuente).toContain("unixepoch() - 86400");
    expect(fuente).toContain("deTodos: sql<number>`COUNT(*)`");
  });
});
