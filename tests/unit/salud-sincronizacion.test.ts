import { describe, expect, it } from "vitest";

import {
  CADA_MINUTOS,
  TOLERANCIA_MINUTOS,
  saludDeSincronizacion,
} from "@/lib/catalogo/salud-sincronizacion";

const AHORA = new Date("2026-08-15T12:00:00Z");
const haceMinutos = (n: number) => new Date(AHORA.getTime() - n * 60_000);

describe("salud de la sincronización", () => {
  it("una corrida de hace un rato está al día", () => {
    expect(saludDeSincronizacion(haceMinutos(3), AHORA)).toEqual({
      nivel: "al_dia",
      minutos: 3,
    });
  });

  it("no se pone roja porque una corrida llegue tarde", () => {
    /* GitHub retrasa las tareas programadas cuando anda cargado. Una pantalla
       que se pone roja a los 16 minutos enseña a ignorar el rojo. */
    const salud = saludDeSincronizacion(haceMinutos(CADA_MINUTOS + 5), AHORA);
    expect(salud.nivel).toBe("al_dia");
  });

  it("avisa cuando se perdieron cuatro corridas seguidas", () => {
    const salud = saludDeSincronizacion(
      haceMinutos(TOLERANCIA_MINUTOS + 1),
      AHORA,
    );
    expect(salud).toEqual({
      nivel: "atrasada",
      minutos: TOLERANCIA_MINUTOS + 1,
    });
  });

  it("justo en el límite todavía no avisa", () => {
    expect(
      saludDeSincronizacion(haceMinutos(TOLERANCIA_MINUTOS), AHORA).nivel,
    ).toBe("al_dia");
  });

  it("días sin sincronizar es atrasada, no otra cosa", () => {
    expect(saludDeSincronizacion(haceMinutos(60 * 24 * 5), AHORA).nivel).toBe(
      "atrasada",
    );
  });

  it("si nunca corrió lo dice, no lo llama atrasada", () => {
    /* «Atrasada» le diría al comercio que algo se rompió; «nunca» le dice que
       falta arrancarlo, que es lo que de verdad tiene que hacer. */
    expect(saludDeSincronizacion(null, AHORA)).toEqual({
      nivel: "nunca",
      minutos: null,
    });
  });

  it("sin dirección no se le echa la culpa al robotito", () => {
    const salud = saludDeSincronizacion(null, AHORA, { tieneDireccion: false });
    expect(salud.nivel).toBe("sin_direccion");
  });

  it("sin dirección manda sobre todo lo demás", () => {
    /* Aunque quede una fecha vieja de cuando sí la tenía: lo que le falta al
       comercio es poner la dirección, no esperar al robotito. */
    const salud = saludDeSincronizacion(haceMinutos(9999), AHORA, {
      tieneDireccion: false,
    });
    expect(salud.nivel).toBe("sin_direccion");
  });

  it("un reloj adelantado no dispara una alarma falsa", () => {
    /* El reloj del servidor y el del navegador no siempre coinciden. Un
       desfase daría minutos negativos, y eso no puede leerse como atrasada. */
    const futuro = new Date(AHORA.getTime() + 90_000);
    expect(saludDeSincronizacion(futuro, AHORA)).toEqual({
      nivel: "al_dia",
      minutos: 0,
    });
  });

  it("acepta la fecha como número, que es como la devuelve la base", () => {
    expect(saludDeSincronizacion(haceMinutos(2).getTime(), AHORA).nivel).toBe(
      "al_dia",
    );
  });

  it("una fecha imposible se trata como que nunca corrió", () => {
    expect(saludDeSincronizacion(0, AHORA).nivel).toBe("nunca");
    expect(saludDeSincronizacion(Number.NaN, AHORA).nivel).toBe("nunca");
  });

  it("la tolerancia se puede ajustar sin tocar la función", () => {
    const salud = saludDeSincronizacion(haceMinutos(20), AHORA, {
      toleranciaMinutos: 10,
    });
    expect(salud.nivel).toBe("atrasada");
  });
});
