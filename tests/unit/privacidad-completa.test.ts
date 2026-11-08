import { describe, expect, it } from "vitest";

import { PRIVACIDAD_EN, PRIVACIDAD_ES } from "@/contenido/paginas/privacidad";

/** Lo que Google Play pidió que la política nombre (dictamen del 8 nov 2026). */
const texto = (p: unknown) => JSON.stringify(p);

describe("la política de privacidad cubre todo lo que se recoge", () => {
  it("en español", () => {
    const t = texto(PRIVACIDAD_ES);
    for (const x of [
      "Stripe",
      "tu tienda",
      "Fotos y videos",
      "comentarios",
      "Búsquedas",
      "Denuncias y bloqueos",
    ]) {
      expect(t).toContain(x);
    }
    expect(t).not.toContain("no procesamos tarjetas");
  });
  it("en inglés", () => {
    const t = texto(PRIVACIDAD_EN);
    for (const x of [
      "Stripe",
      "store details",
      "Photos and videos",
      "comments",
      "Searches",
      "Reports and blocks",
    ]) {
      expect(t).toContain(x);
    }
    expect(t).not.toContain("we don't process cards");
  });
});
