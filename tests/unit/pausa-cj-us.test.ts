import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { fichaDeProducto } from "@/lib/seo/datos-estructurados";
import { EN_PAUSA, ventaPausada } from "@/lib/ventas/pausa";

/**
 * ══ LA VENTA DE CJ EN ESTADOS UNIDOS, EN PAUSA (27 oct 2026) ══
 *
 * Richard: pausar las ventas de CJ en Estados Unidos y dejar los productos a
 * la vista. Mientras la pausa esté puesta, nada de Estados Unidos se anuncia
 * como disponible (ni en la ficha para buscadores ni en el feed de Google), y
 * Venezuela sigue vendiendo.
 */
const base = {
  slug: "producto-de-prueba",
  titulo: "Producto",
  descripcion: null,
  precioCentavos: 1000,
  moneda: "USD",
  existencias: 10,
  controlaExistencias: true,
  sku: null,
  marca: null,
  categoria: null,
  imagenes: [],
};

describe("la pausa de Estados Unidos", () => {
  it("está puesta", () => {
    expect(EN_PAUSA).toBe(true);
  });

  it("frena Estados Unidos y deja vender a Venezuela", () => {
    expect(ventaPausada("US")).toBe(true);
    expect(ventaPausada(" us ")).toBe(true);
    expect(ventaPausada("VE")).toBe(false);
  });

  it("el equipo sí puede comprar, para probar el circuito", () => {
    expect(ventaPausada("US", { esEquipoInterno: true })).toBe(false);
  });

  it("la ficha para buscadores dice «sin existencias» en Estados Unidos", () => {
    expect(
      fichaDeProducto({ ...base, paisOrigen: "US" }, "en").offers.availability,
    ).toBe("https://schema.org/OutOfStock");
    expect(
      fichaDeProducto({ ...base, paisOrigen: "VE" }, "es").offers.availability,
    ).toBe("https://schema.org/InStock");
  });

  it("el feed de Google respeta la pausa", () => {
    const feed = readFileSync(
      join(__dirname, "..", "..", "src/app/datos/google/route.ts"),
      "utf8",
    );
    expect(feed).toMatch(/!ventaPausada\("US"\)/);
  });
});
