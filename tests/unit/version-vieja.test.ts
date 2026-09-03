import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BUCLE_MS,
  esVersionVieja,
  recargarSiEsVersionVieja,
} from "@/lib/version-vieja";

/**
 * LA PESTAÑA VIEJA SE RECARGA SOLA, Y NO SOLO UNA VEZ (2 sep 2026).
 *
 * El dueño vio dos veces en una noche «Server Action … was not found»: la
 * pestaña ya se había recargado por una publicación anterior y la marca
 * —que era para siempre— impedía recargar por la siguiente.
 */
describe("la versión vieja", () => {
  const recargas: number[] = [];
  const almacen = new Map<string, string>();

  beforeEach(() => {
    recargas.length = 0;
    almacen.clear();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (k: string) => almacen.get(k) ?? null,
        setItem: (k: string, v: string) => void almacen.set(k, v),
        removeItem: (k: string) => void almacen.delete(k),
      },
      location: { reload: () => recargas.push(Date.now()) },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const fallo = new Error(
    'Server Action "40b302a8" was not found on the server. Read more: https://nextjs.org/docs/messages/failed-to-find-server-action',
  );

  it("reconoce el fallo por su nombre o por su texto", () => {
    expect(esVersionVieja(fallo)).toBe(true);
    expect(esVersionVieja(new Error("UnrecognizedActionError"))).toBe(true);
    expect(esVersionVieja(new Error("APIkey is wrong"))).toBe(false);
  });

  it("recarga la primera vez, NO recarga en bucle, y VUELVE a recargar en la publicación siguiente", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T20:00:00Z"));
    expect(recargarSiEsVersionVieja(fallo)).toBe(true);
    expect(recargas).toHaveLength(1);

    /* Un segundo después: es un bucle, se enseña el error. */
    vi.setSystemTime(new Date("2026-09-02T20:00:01Z"));
    expect(recargarSiEsVersionVieja(fallo)).toBe(false);
    expect(recargas).toHaveLength(1);

    /* Dos minutos después: otra publicación, se recarga otra vez. */
    vi.setSystemTime(
      new Date(Date.parse("2026-09-02T20:00:01Z") + BUCLE_MS + 60_000),
    );
    expect(recargarSiEsVersionVieja(fallo)).toBe(true);
    expect(recargas).toHaveLength(2);
  });

  it("un fallo de verdad no recarga nada", () => {
    expect(recargarSiEsVersionVieja(new Error("APIkey is wrong"))).toBe(false);
    expect(recargas).toHaveLength(0);
  });
});
