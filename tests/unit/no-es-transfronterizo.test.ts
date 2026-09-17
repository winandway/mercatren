import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ══ MERCATREN NO ES TRANSFRONTERIZO (17 sep 2026) ══
 *
 * Richard: «esa palabra no debe aparecer en ningún lado… en Estados Unidos
 * solo vendemos en Estados Unidos, y el resto del mundo tiene su Mercatren
 * local con su dominio local». Google llegó a enseñar «Cross-border buying
 * and selling» como lema de mercatren.com: salía de `messages/en.json`, que
 * la prueba de vocabulario no miraba. Esta mira TODO lo que se publica.
 */
const RETIRADAS = /transfronteriz|cross[-\s]?border/i;

function archivos(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.(tsx?|json|txt|md)$/.test(nombre) ? [ruta] : [];
  });
}

describe("la palabra retirada no vuelve", () => {
  it("ni en el código, ni en los diccionarios, ni en lo que se sirve al público", () => {
    const culpables = [
      ...archivos("src"),
      ...archivos("messages"),
      ...archivos("public"),
    ].filter((ruta) => RETIRADAS.test(readFileSync(ruta, "utf8")));
    expect(culpables).toEqual([]);
  });

  it("el lema del .com habla de Estados Unidos, en los dos idiomas", () => {
    const es = JSON.parse(readFileSync("messages/es.json", "utf8"));
    const en = JSON.parse(readFileSync("messages/en.json", "utf8"));
    expect(es.marca.lema).toContain("Estados Unidos");
    expect(en.marca.lema).toContain("United States");
    expect(es.marca.lema).not.toMatch(/donde la necesites/i);
    expect(en.marca.lema).not.toMatch(/where you need/i);
  });

  it("los términos dicen dónde se vende y que cada país tiene su tienda", () => {
    const t = readFileSync("src/contenido/paginas/terminos.ts", "utf8");
    expect(t).toContain(
      "vendemos y entregamos únicamente dentro de Estados Unidos",
    );
    expect(t).toContain("we sell and deliver only within the United States");
    expect(t).toContain("se rige por las normas de ese país");
  });
});
