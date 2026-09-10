import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  dominioAutorizado,
  nuevaClavePublica,
  SEGUNDOS_MINIMOS,
  TOPE_POR_VENTANA,
  VENTANA_MS,
} from "@/lib/casillero/widget-puro";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ EL WIDGET ES LA PUERTA MÁS EXPUESTA (9 sep 2026) ══
 *
 * Crea casilleros sin sesión y desde otro dominio: es la única entrada que
 * escribe en la base sin que nadie se identifique. Cuatro cerrojos, y estas
 * pruebas fijan el que se rompe en silencio.
 */
describe("el dominio autorizado", () => {
  it("acepta el dominio y sus subdominios", () => {
    expect(dominioAutorizado("https://ejemplo.com", "ejemplo.com")).toBe(true);
    expect(dominioAutorizado("https://www.ejemplo.com", "ejemplo.com")).toBe(
      true,
    );
    expect(dominioAutorizado("https://tienda.ejemplo.com", "ejemplo.com")).toBe(
      true,
    );
    expect(dominioAutorizado("https://ejemplo.com", "www.ejemplo.com")).toBe(
      true,
    );
  });

  it("NO SE DEJA ENGAÑAR POR UN PARECIDO: es el fallo que se cuela solo", () => {
    /* Con un `endsWith` a secas, «ejemplo.com.malo.net» pasa: termina en
       algo que contiene el dominio. Con el punto delante, no. */
    expect(
      dominioAutorizado("https://ejemplo.com.malo.net", "ejemplo.com"),
    ).toBe(false);
    expect(dominioAutorizado("https://noesejemplo.com", "ejemplo.com")).toBe(
      false,
    );
    expect(dominioAutorizado("https://malo.net", "ejemplo.com")).toBe(false);
  });

  it("sin Origin, o con basura, no pasa", () => {
    expect(dominioAutorizado(null, "ejemplo.com")).toBe(false);
    expect(dominioAutorizado("", "ejemplo.com")).toBe(false);
    expect(dominioAutorizado("no-es-una-url", "ejemplo.com")).toBe(false);
  });
});

describe("los cerrojos del alta pública", () => {
  it("la clave tiene forma propia y no se repite", () => {
    const a = nuevaClavePublica();
    expect(a).toMatch(/^pk_[A-Za-z0-9]{20,}$/);
    expect(a).not.toBe(nuevaClavePublica());
  });

  it("el límite es por ventana de tiempo, no un contador que solo sube", () => {
    /* Sin ventana, una oficina entera detrás de la misma salida a internet
       queda bloqueada para siempre después del quinto compañero. */
    expect(TOPE_POR_VENTANA).toBeGreaterThan(0);
    expect(VENTANA_MS).toBeGreaterThan(60_000);
    const w = leer("src/lib/casillero/widget.ts");
    expect(w).toContain("ventanaDesde: ahora");
    expect(w).toContain("fila.ventanaDesde < desde");
  });

  it("un fallo del contador DEJA PASAR, no cierra la puerta", () => {
    const w = leer("src/lib/casillero/widget.ts");
    const captura = w.slice(
      w.indexOf("} catch (fallo) {", w.indexOf("seLePaso")),
    );
    expect(captura).toContain("return false");
  });

  it("la IP se guarda como huella, nunca en claro", () => {
    const w = leer("src/lib/casillero/widget.ts");
    expect(w).toContain('crypto.subtle.digest("SHA-256"');
    expect(w).not.toMatch(/ip:\s*ip\b/);
  });

  it("hay tiempo mínimo de llenado: un robot lo hace en menos", () => {
    expect(SEGUNDOS_MINIMOS).toBeGreaterThanOrEqual(2);
  });
});
