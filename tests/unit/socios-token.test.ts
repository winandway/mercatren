import { describe, expect, it } from "vitest";

import {
  generarToken,
  hashDeToken,
  igualesEnTiempoConstante,
  tokenDeLaPeticion,
} from "@/lib/socios/token";

describe("el token de una tienda socia", () => {
  it("es largo y en hexadecimal", () => {
    expect(generarToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("nunca sale dos veces el mismo", () => {
    const muchos = new Set(Array.from({ length: 500 }, () => generarToken()));
    expect(muchos.size).toBe(500);
  });
});

describe("lo que se guarda es el hash, no el token", () => {
  it("el hash no contiene el token", async () => {
    /* Si lo contuviera, guardar el hash no serviría de nada. */
    const token = generarToken();
    const hash = await hashDeToken(token);
    expect(hash).not.toBe(token);
    expect(hash).not.toContain(token);
  });

  it("el mismo token da siempre el mismo hash", async () => {
    const token = generarToken();
    expect(await hashDeToken(token)).toBe(await hashDeToken(token));
  });

  it("dos tokens distintos dan hashes distintos", async () => {
    expect(await hashDeToken("aaa")).not.toBe(await hashDeToken("aab"));
  });
});

/**
 * Comparar con `===` corta en la primera letra distinta, y esa diferencia de
 * microsegundos se mide desde fuera: se adivina el token letra por letra sin
 * conocerlo.
 */
describe("la comparación no delata dónde está la diferencia", () => {
  it("dice que sí cuando son iguales", () => {
    expect(igualesEnTiempoConstante("abc123", "abc123")).toBe(true);
  });

  it("dice que no cuando cambia la última letra", () => {
    expect(igualesEnTiempoConstante("abc123", "abc124")).toBe(false);
  });

  it("dice que no cuando cambia la primera", () => {
    expect(igualesEnTiempoConstante("abc123", "zbc123")).toBe(false);
  });

  it("dice que no cuando miden distinto", () => {
    expect(igualesEnTiempoConstante("abc", "abcdef")).toBe(false);
    expect(igualesEnTiempoConstante("abcdef", "abc")).toBe(false);
  });

  it("no revienta con el texto vacío", () => {
    expect(igualesEnTiempoConstante("", "")).toBe(true);
    expect(igualesEnTiempoConstante("abc", "")).toBe(false);
    expect(igualesEnTiempoConstante("", "abc")).toBe(false);
  });
});

describe("de dónde se saca el token de una petición", () => {
  const con = (cabecera?: string) =>
    new Request("https://mercatren.com/datos/socios/cambios", {
      headers: cabecera ? { authorization: cabecera } : {},
    });

  it("lo saca del Bearer", () => {
    expect(tokenDeLaPeticion(con("Bearer abc123"))).toBe("abc123");
  });

  it("no le importa cómo esté escrito «bearer»", () => {
    expect(tokenDeLaPeticion(con("bearer abc123"))).toBe("abc123");
    expect(tokenDeLaPeticion(con("BEARER abc123"))).toBe("abc123");
  });

  it("sin cabecera, nada", () => {
    expect(tokenDeLaPeticion(con())).toBeNull();
  });

  it("con otro tipo de credencial, nada", () => {
    /* Aceptar un Basic aquí sería aceptar una credencial que nunca emitimos. */
    expect(tokenDeLaPeticion(con("Basic abc123"))).toBeNull();
  });

  it("un Bearer vacío no cuenta como token", () => {
    expect(tokenDeLaPeticion(con("Bearer"))).toBeNull();
    expect(tokenDeLaPeticion(con("Bearer   "))).toBeNull();
  });
});
