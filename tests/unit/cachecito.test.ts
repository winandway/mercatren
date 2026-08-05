import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { olvidar, recordado } from "@/lib/cachecito";

/**
 * La memoria corta del servidor: recuerda un rato, refresca al vencer y
 * JAMÁS recuerda un fallo. De esto depende que el encabezado no repita sus
 * agregados en cada página — y que un error de un segundo no deje la página
 * coja un minuto.
 */
describe("recordado", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    olvidar();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dentro de la vida útil no vuelve a preguntar", async () => {
    const traer = vi.fn().mockResolvedValue(["a"]);

    expect(await recordado("llave", 60_000, traer)).toEqual(["a"]);
    expect(await recordado("llave", 60_000, traer)).toEqual(["a"]);

    expect(traer).toHaveBeenCalledTimes(1);
  });

  it("al vencer la vida útil, refresca", async () => {
    const traer = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    expect(await recordado("llave", 60_000, traer)).toBe(1);
    vi.advanceTimersByTime(61_000);
    expect(await recordado("llave", 60_000, traer)).toBe(2);

    expect(traer).toHaveBeenCalledTimes(2);
  });

  it("cada llave tiene su propia memoria", async () => {
    expect(await recordado("una", 60_000, async () => "x")).toBe("x");
    expect(await recordado("otra", 60_000, async () => "y")).toBe("y");
  });

  it("un fallo NO se recuerda: la próxima visita reintenta", async () => {
    const traer = vi
      .fn()
      .mockRejectedValueOnce(new Error("la base no respondió"))
      .mockResolvedValueOnce("ya sirvo");

    await expect(recordado("llave", 60_000, traer)).rejects.toThrow();
    // Sin avanzar el reloj: el error no quedó guardado.
    expect(await recordado("llave", 60_000, traer)).toBe("ya sirvo");
  });
});
