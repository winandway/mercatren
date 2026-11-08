import { describe, expect, it, vi } from "vitest";

/**
 * LA TASA DE CHILE NO SE REESCRIBE EN CADA VISITA (8 nov 2026).
 * La ficha de Chile pide la tasa; antes cada instancia escribía dos filas en
 * `configuracion` cada 90 s aunque la tasa fuera la misma.
 */
vi.mock("server-only", () => ({}));

import {
  hayQueGuardarTasa,
  REFRESCAR_TASA_CADA_MS,
} from "@/lib/mercado/tasa-automatica";

describe("guardar la tasa", () => {
  const ahora = 1_800_000_000_000;
  it("no escribe si la tasa es la misma y la fecha es reciente", () => {
    expect(hayQueGuardarTasa(95000, ahora - 60_000, 95000, ahora)).toBe(false);
  });
  it("escribe si la tasa cambió", () => {
    expect(hayQueGuardarTasa(95000, ahora - 60_000, 95100, ahora)).toBe(true);
  });
  it("escribe si la fecha guardada tiene más de una hora o no existe", () => {
    expect(
      hayQueGuardarTasa(
        95000,
        ahora - REFRESCAR_TASA_CADA_MS - 1,
        95000,
        ahora,
      ),
    ).toBe(true);
    expect(hayQueGuardarTasa(null, null, 95000, ahora)).toBe(true);
  });
});
