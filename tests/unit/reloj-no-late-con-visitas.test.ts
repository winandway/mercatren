import { describe, expect, it, vi } from "vitest";

/**
 * EL RELOJ NO ESCRIBE NI CON VISITAS NI EN PAUSA (8 nov 2026).
 *
 * `latirConElTrafico` corría un latido entero desde cada visita y no miraba
 * `RELOJ_APAGADO`: con Mercatren en pausa seguía escribiendo ~300 filas por
 * hora en `configuracion` (7.092 el 7 nov). Aquí se exige que, en pausa,
 * reclamar la marca y correr el latido NO toquen la base.
 */
vi.mock("server-only", () => ({}));

const tocoLaBase = vi.fn();
vi.mock("@/lib/db", () => ({
  getDb: () => {
    tocoLaBase();
    throw new Error("el reloj en pausa no puede tocar la base");
  },
}));

describe("el reloj en pausa", () => {
  it("no reclama la marca ni corre el latido, y no toca la base", async () => {
    const { RELOJ_APAGADO } = await import("@/lib/en-pausa");
    expect(RELOJ_APAGADO).toBe(true);
    const { reclamarTick, correrTick } = await import("@/lib/reloj/tick");
    await expect(reclamarTick(Date.now())).resolves.toBe(false);
    const r = await correrTick("puerta");
    expect(r.hizo).toEqual(["apagado"]);
    expect(tocoLaBase).not.toHaveBeenCalled();
  });
});
