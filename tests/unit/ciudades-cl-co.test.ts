import { describe, expect, it } from "vitest";

import { CIUDADES_CL, CIUDADES_CO, ciudadesDe } from "@/lib/destino/ciudades";
import { DEPARTAMENTOS_CO, REGIONES_CL } from "@/lib/destino/direccion";

/**
 * ══ CIUDADES DE CHILE Y COLOMBIA (14 sep 2026) ══
 *
 * Las llaves tienen que ser EXACTAMENTE los códigos de las regiones y
 * departamentos: si una región se renombra en `direccion.ts` y aquí no, la
 * lista de ciudades desaparece en silencio para esa región.
 */
describe("cada región y departamento tiene sus ciudades", () => {
  it("Chile: las 16 regiones, con la capital regional", () => {
    for (const r of REGIONES_CL) {
      expect(CIUDADES_CL[r.codigo], r.codigo).toBeDefined();
      expect(CIUDADES_CL[r.codigo]!.length, r.codigo).toBeGreaterThanOrEqual(2);
    }
    expect(CIUDADES_CL["Region Metropolitana"]).toContain("Santiago");
    expect(CIUDADES_CL["Biobio"]).toContain("Concepcion");
  });
  it("Colombia: los 33 departamentos, con la capital", () => {
    for (const d of DEPARTAMENTOS_CO) {
      expect(CIUDADES_CO[d.codigo], d.codigo).toBeDefined();
      expect(CIUDADES_CO[d.codigo]!.length, d.codigo).toBeGreaterThanOrEqual(1);
    }
    expect(CIUDADES_CO["Antioquia"]).toContain("Medellin");
    expect(CIUDADES_CO["Bogota DC"]).toContain("Bogota");
  });
  it("sin acentos, como las regiones: el transportista compara contra su tabla", () => {
    const todas = [
      ...Object.values(CIUDADES_CL),
      ...Object.values(CIUDADES_CO),
    ].flat();
    for (const c of todas) expect(c, c).toMatch(/^[A-Za-z' ]+$/);
  });
  it("no hay llaves de más (una región inventada no sugiere nada)", () => {
    const cl = new Set(REGIONES_CL.map((r) => r.codigo));
    for (const k of Object.keys(CIUDADES_CL)) expect(cl.has(k), k).toBe(true);
    const co = new Set(DEPARTAMENTOS_CO.map((d) => d.codigo));
    for (const k of Object.keys(CIUDADES_CO)) expect(co.has(k), k).toBe(true);
  });
});

describe("ciudadesDe", () => {
  it("devuelve la lista del destino y estado, y vacío para lo demás", () => {
    expect(ciudadesDe("CL", "Valparaiso")).toContain("Vina del Mar");
    expect(ciudadesDe("CO", "Valle del Cauca")).toContain("Cali");
    expect(ciudadesDe("US", "FL")).toEqual([]);
    expect(ciudadesDe("CL", "")).toEqual([]);
    expect(ciudadesDe("CL", "Narnia")).toEqual([]);
  });
});
