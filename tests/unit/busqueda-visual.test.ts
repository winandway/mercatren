import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  bytesAVector,
  DIMENSION,
  masParecidos,
  productoPunto,
  UMBRAL_DE_PARECIDO,
  vectorABytes,
} from "@/lib/busqueda-imagen/similitud";

/**
 * EL BUSCADOR VISUAL DE VERDAD (30 ago 2026).
 *
 * Orden del dueño tras cazar el parche de los sinónimos: «debes buscar no
 * solamente por texto, sino también por imagen, como funcionan todos los
 * sistemas de búsqueda de imagen». Investigado en la fuente: embeddings
 * multimodales (gemini-embedding-2) + similitud de coseno — el patrón de
 * todos los buscadores de imagen serios.
 */
describe("la matemática del buscador visual", () => {
  it("el vector va y vuelve de la base sin perder un bit", () => {
    const v = Float32Array.from(
      Array.from({ length: DIMENSION }, (_, i) => Math.sin(i) * 0.1),
    );
    expect(bytesAVector(vectorABytes(v))).toEqual(v);
  });

  it("vectores normalizados iguales dan parecido 1; ortogonales dan 0", () => {
    const a = new Float32Array(DIMENSION);
    const b = new Float32Array(DIMENSION);
    a[0] = 1;
    b[1] = 1;
    expect(productoPunto(a, a)).toBeCloseTo(1);
    expect(productoPunto(a, b)).toBeCloseTo(0);
  });

  it("masParecidos ordena del más parecido al menos y respeta el umbral", () => {
    const consulta = new Float32Array(DIMENSION);
    consulta[0] = 1;
    const casi = new Float32Array(DIMENSION);
    casi[0] = 0.95;
    casi[1] = 0.31;
    const lejos = new Float32Array(DIMENSION);
    lejos[2] = 1;
    const vecinos = masParecidos(
      consulta,
      [
        { id: "lejos", vector: lejos },
        { id: "exacto", vector: consulta },
        { id: "casi", vector: casi },
      ],
      12,
    );
    expect(vecinos.map((v) => v.id)).toEqual(["exacto", "casi"]);
    /* «lejos» queda bajo el umbral: enseñarlo sería la brocha de maquillaje
       otra vez, ahora en visual. */
    expect(vecinos.find((v) => v.id === "lejos")).toBeUndefined();
    expect(UMBRAL_DE_PARECIDO).toBeGreaterThan(0);
  });

  it("EL MATCH VISUAL MANDA Y EL TEXTUAL ES EL RESPALDO — fijado en la fuente", () => {
    const fuente = readFileSync("src/lib/busqueda-imagen/acciones.ts", "utf-8");
    expect(fuente).toContain("embeddingDeImagen(bytes");
    expect(fuente).toContain("masParecidos(");
    expect(fuente).toContain(
      "productos: visuales.length > 0 ? visuales : encontradosFoto,",
    );
    /* El índice nunca tumba la búsqueda: su try propio. */
    expect(fuente).toContain("El índice visual nunca tumba la búsqueda");
  });

  it("el indexador es idempotente y guarda el motivo del fallo", () => {
    const fuente = readFileSync(
      "src/lib/busqueda-imagen/indexador.ts",
      "utf-8",
    );
    expect(fuente).toContain("notInArray(productos.id, yaHechos)");
    expect(fuente).toContain("error: r.ok ? null : r.motivo");
  });
});
