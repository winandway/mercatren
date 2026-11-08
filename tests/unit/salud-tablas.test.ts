import { describe, expect, it } from "vitest";
import {
  TABLAS_ESPERADAS,
  tablasQueFaltan,
} from "@/lib/salud/tablas-esperadas";

describe("sonda de tablas de las migraciones 0051-0054", () => {
  it("no falta nada cuando están todas", () => {
    expect(
      tablasQueFaltan(TABLAS_ESPERADAS, [...TABLAS_ESPERADAS, "user"]),
    ).toEqual([]);
  });
  it("dice exactamente cuál falta", () => {
    const sinUna = TABLAS_ESPERADAS.filter((t) => t !== "desistimientos");
    expect(tablasQueFaltan(TABLAS_ESPERADAS, sinUna)).toEqual([
      "desistimientos",
    ]);
  });
  it("cubre las siete tablas de 0051 a 0054", () => {
    expect(TABLAS_ESPERADAS).toHaveLength(7);
  });
});
