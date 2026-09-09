import { describe, expect, it } from "vitest";

import {
  esSinPuntos,
  esperarHasta,
  minutosParaVolver,
  PAUSA_SIN_PUNTOS_MS,
  puntosDe,
  sigueSinPuntos,
} from "@/lib/cj/puntos";

/**
 * CJ DA PUNTOS POR DÍA Y SE ACABAN (3 sep 2026). El aviso real, de la
 * captura del dueño tras importar 44.035 productos:
 * «Insufficient API points. Used today: 61520, Remaining: 0, Required: 50.»
 */
const AVISO =
  "Insufficient API points. Used today: 61520, Remaining: 0, Required: 50. To increase your daily points, grow your CJ transaction amount.";

describe("reconocer el aviso", () => {
  it("reconoce el mensaje real de CJ", () => {
    expect(esSinPuntos(AVISO)).toBe(true);
  });

  it("no confunde otros fallos de CJ con quedarse sin puntos", () => {
    expect(esSinPuntos("Confirm order failed, insufficient inventory")).toBe(
      false,
    );
    expect(esSinPuntos("Too many requests")).toBe(false);
    expect(esSinPuntos(null)).toBe(false);
  });

  it("saca los números para poder decirlos", () => {
    expect(puntosDe(AVISO)).toEqual({ usados: 61520, quedan: 0 });
  });
});

describe("hasta cuándo se espera", () => {
  const AHORA = Date.parse("2026-09-03T20:00:00Z");

  it("ESPERA MINUTOS, NO HASTA MEDIANOCHE: CJ repone puntos cada minuto (doc oficial, 9 sep 2026)", () => {
    /* «Per-Minute Points Replenishment = Total Points / 1440». La versión
       vieja esperaba hasta la medianoche de China y dejó el afinado parado
       17 horas el 8 sep, con puntos entrando a ~70 por minuto. */
    expect(esperarHasta(AHORA) - AHORA).toBe(PAUSA_SIN_PUNTOS_MS);
    expect(PAUSA_SIN_PUNTOS_MS).toBeLessThanOrEqual(10 * 60_000);
    expect(PAUSA_SIN_PUNTOS_MS).toBeGreaterThanOrEqual(60_000);
  });

  it("una pausa vencida deja de valer", () => {
    expect(sigueSinPuntos(String(AHORA - 1), AHORA)).toBe(false);
    expect(sigueSinPuntos(String(AHORA + 60_000), AHORA)).toBe(true);
    expect(sigueSinPuntos("basura", AHORA)).toBe(false);
    expect(minutosParaVolver(String(AHORA + 125_000), AHORA)).toBe(3);
  });
});

describe("candados en el código", () => {
  it("el cliente de CJ no llama mientras dure la pausa, y anota el aviso", async () => {
    const { readFileSync } = await import("node:fs");
    const cli = readFileSync("src/lib/cj/cliente.ts", "utf-8");
    expect(cli).toContain("if (sigueSinPuntos(pausa, Date.now()))");
    expect(cli).toContain("if (esSinPuntos(cuerpo.message))");
    /* La comprobación va ANTES de pedir el token: pedirlo también gasta. */
    expect(cli.indexOf("sigueSinPuntos(pausa")).toBeLessThan(
      cli.indexOf("await tokenDeCj()"),
    );
  });

  it("la sonda de salud lo dice con su nombre", async () => {
    const { readFileSync } = await import("node:fs");
    expect(readFileSync("src/lib/salud/piezas.ts", "utf-8")).toContain(
      '"sin_puntos"',
    );
  });
});
