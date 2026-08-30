import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  esEnlaceDeProductoNuestro,
  extraerTerminos,
} from "@/lib/busqueda-imagen/parsear";

/**
 * LA BÚSQUEDA POR FOTO (30 ago 2026): lo que devuelve el ojo no se cree sin
 * comprobar, y el enlace del aviso solo puede ser NUESTRO.
 */
describe("el parseo de lo que ve el ojo", () => {
  it("una respuesta sana entrega términos limpios", () => {
    const r = extraerTerminos(
      '{"es":["desmenuzador de pollo","triturador de carne"],"en":["chicken shredder"],"descripcion":"Herramienta redonda para desmenuzar pollo"}',
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.es[0]).toBe("desmenuzador de pollo");
      expect(r.en).toContain("chicken shredder");
    }
  });

  it("UN JSON ROTO O VACÍO NO PASA — mejor decir que no se pudo leer", () => {
    expect(extraerTerminos("no soy json").ok).toBe(false);
    expect(extraerTerminos('{"es":[],"en":[]}').ok).toBe(false);
    expect(extraerTerminos('{"es":[123],"en":[null]}').ok).toBe(false);
  });

  it("una parrafada disfrazada de término se descarta", () => {
    const larga = "x".repeat(80);
    const r = extraerTerminos(`{"es":["${larga}","taladro"],"en":[]}`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.es).toEqual(["taladro"]);
  });
});

describe("el enlace del aviso al cliente", () => {
  it("SOLO FICHAS NUESTRAS — un link ajeno con nuestra firma es phishing", () => {
    expect(
      esEnlaceDeProductoNuestro(
        "https://mercatren.com/es/producto/foco-solar-123",
      ),
    ).toBe(true);
    expect(
      esEnlaceDeProductoNuestro("https://mercatren.cl/en/producto/algo-99"),
    ).toBe(true);
    expect(esEnlaceDeProductoNuestro("https://otro-sitio.com/producto/x")).toBe(
      false,
    );
    expect(
      esEnlaceDeProductoNuestro("https://mercatren.com.evil.com/es/producto/x"),
    ).toBe(false);
    expect(esEnlaceDeProductoNuestro("https://mercatren.com/es/panel")).toBe(
      false,
    );
    expect(esEnlaceDeProductoNuestro("producto/x")).toBe(false);
  });
});

describe("los candados de la privacidad y el modelo", () => {
  it("LA FOTO DEL CLIENTE ES PRIVADA: /media la cierra a todo el que no sea equipo", () => {
    const fuente = readFileSync("src/app/media/[...clave]/route.ts", "utf-8");
    expect(fuente).toContain('ruta.startsWith("busquedas/")) return false');
  });

  it("el ojo usa el modelo aprobado de la casa, nunca uno caro", () => {
    const fuente = readFileSync("src/lib/busqueda-imagen/mirar.ts", "utf-8");
    expect(fuente).toContain("gemini-2.5-flash");
    expect(fuente).toContain("TRADUCCION_LLAVE");
  });

  it("el panel de búsquedas queda cerrado con el disfraz de «ver su panel»", () => {
    const fuente = readFileSync("src/lib/panel/solo-equipo.ts", "utf-8");
    expect(fuente).toContain('"busquedas-imagen"');
  });
});
