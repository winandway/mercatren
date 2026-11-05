import { describe, expect, it } from "vitest";

import { bytesDe, evaluar, nivelDe, TOPES } from "@/lib/consumo/umbrales";

/**
 * LA ALARMA DE CONSUMO (5 nov 2026). Lo que no puede pasar sin que esto se
 * ponga en rojo: que el consumo de septiembre (unos 4.400 millones de filas
 * leídas al día) salga en verde, o que una cifra que no se pudo leer pase por
 * buena.
 */
const tranquilo = {
  filasLeidas24h: 234_199,
  filasEscritas24h: 184,
  baseBytes: 41_762_816,
  cuboBytes: 427_000_000,
};

describe("la alarma de consumo", () => {
  it("lo de hoy, con la base vacía de catálogo, está en verde", () => {
    expect(evaluar(tranquilo).nivel).toBe("verde");
  });

  it("septiembre (134 mil millones de filas al mes) es emergencia", () => {
    const septiembre = {
      ...tranquilo,
      filasLeidas24h: 134_000_000_000 / 30,
    };
    const r = evaluar(septiembre);
    expect(r.nivel).toBe("emergencia");
    expect(r.detalle.filasLeidas24h).toBe("emergencia");
  });

  it("manda la peor cifra", () => {
    expect(
      evaluar({ ...tranquilo, filasEscritas24h: TOPES.filasEscritas24h.aviso })
        .nivel,
    ).toBe("aviso");
    expect(
      evaluar({ ...tranquilo, cuboBytes: TOPES.cuboBytes.emergencia }).nivel,
    ).toBe("emergencia");
  });

  it("una cifra que no se pudo leer nunca pasa por verde", () => {
    expect(nivelDe(Number.NaN, TOPES.baseBytes)).toBe("aviso");
    expect(evaluar({ ...tranquilo, cuboBytes: bytesDe("¿?") }).nivel).toBe(
      "aviso",
    );
  });

  it("lee el tamaño del cubo como lo escribe Cloudflare", () => {
    expect(bytesDe("427 MB")).toBe(427_000_000);
    expect(bytesDe("48.2 GB")).toBeCloseTo(48_200_000_000);
    expect(bytesDe("0 B")).toBe(0);
  });
});
