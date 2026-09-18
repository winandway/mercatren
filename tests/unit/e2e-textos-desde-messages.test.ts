import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * LAS PRUEBAS E2E NO LLEVAN TEXTOS ESCRITOS A MANO (regla del proyecto).
 *
 * El 17 sep 2026 se cambió el lema de la portada («Compra en línea en
 * Estados Unidos, con el envío incluido») y `e2e/inicio.spec.ts` buscaba a
 * mano «Compra en Estados Unidos»: la publicación falló y el sitio se quedó
 * cuatro horas con la versión anterior sin que nadie lo viera. Los textos
 * salen de `messages/*.json`, así un cambio de copy no puede dejar el sitio
 * sin publicar. Esta prueba se pone roja si vuelve un literal a
 * `toContainText` / `toHaveText`.
 */

const CARPETA = join(process.cwd(), "e2e");
/* `\s*` cruza el salto de línea: el literal suele ir en la línea siguiente. */
const LITERAL = /to(?:Contain|Have)Text\(\s*[/"'`]/g;

describe("los textos de las pruebas e2e salen de messages/*.json", () => {
  const archivos = readdirSync(CARPETA).filter((a) => a.endsWith(".spec.ts"));

  it("hay pruebas que revisar", () => {
    expect(archivos.length).toBeGreaterThan(0);
  });

  for (const archivo of archivos) {
    it(archivo, () => {
      const codigo = readFileSync(join(CARPETA, archivo), "utf8");
      const culpables = [...codigo.matchAll(LITERAL)].map((m) => {
        const linea = codigo.slice(0, m.index).split("\n").length;
        return `${archivo}:${linea} ${m[0].replace(/\s+/g, " ")}`;
      });
      expect(
        culpables,
        "toContainText/toHaveText con un texto a mano: léelo de messages/es.json o en.json",
      ).toEqual([]);
    });
  }
});
