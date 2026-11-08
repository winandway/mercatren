import { describe, expect, it } from "vitest";
import { tituloDeSugerencia } from "@/lib/catalogo/titulo-de-sugerencia";

describe("el desplegable del buscador habla el idioma de la página", () => {
  const p = { titulo: "Zapatos de cuero", tituloEn: "Leather shoes" };
  it("en /en sale el título en inglés", () => {
    expect(tituloDeSugerencia(p, "en")).toBe("Leather shoes");
  });
  it("en /es sale el título en español", () => {
    expect(tituloDeSugerencia(p, "es")).toBe("Zapatos de cuero");
  });
  it("sin traducción, el español en las dos", () => {
    expect(tituloDeSugerencia({ titulo: "Mesa", tituloEn: "  " }, "en")).toBe(
      "Mesa",
    );
    expect(tituloDeSugerencia({ titulo: "Mesa", tituloEn: null }, "en")).toBe(
      "Mesa",
    );
  });
});

describe("el servidor manda el título en inglés al desplegable", () => {
  it("buscar.ts incluye tituloEn en cada sugerencia", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/catalogo/buscar.ts", "utf8");
    expect(fuente).toMatch(/tituloEn: f\.tituloEn/);
  });
});
