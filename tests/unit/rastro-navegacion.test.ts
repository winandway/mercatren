import { describe, expect, it } from "vitest";

import {
  anotarRuta,
  rutaAnteriorA,
  type AlmacenMinimo,
} from "@/lib/navegacion/rastro";

function almacen(): AlmacenMinimo & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => void datos.set(k, v),
  };
}

/**
 * Dentro del sitio Next navega sin recargar y `document.referrer` no se
 * actualiza: la flecha «← Volver» necesita este rastro para saber de dónde
 * venía la persona. Ver `src/lib/navegacion/rastro.ts`.
 */
describe("el rastro de navegación", () => {
  it("anota la página actual y la anterior", () => {
    const a = almacen();
    anotarRuta(a, "/es/tienda/la-mia");
    anotarRuta(a, "/es/producto/taladro");
    expect(rutaAnteriorA(a, "/es/producto/taladro")).toBe("/es/tienda/la-mia");
  });

  it("sirve ANTES de que el efecto anote la página actual (primer dibujo)", () => {
    const a = almacen();
    anotarRuta(a, "/es/tienda/la-mia");
    /* La ficha se dibuja; el efecto que la anota todavía no corrió. */
    expect(rutaAnteriorA(a, "/es/producto/taladro")).toBe("/es/tienda/la-mia");
  });

  it("repetir la misma ruta (recarga, re-render) no mueve el rastro", () => {
    const a = almacen();
    anotarRuta(a, "/es/tienda/la-mia");
    anotarRuta(a, "/es/producto/taladro");
    anotarRuta(a, "/es/producto/taladro");
    expect(rutaAnteriorA(a, "/es/producto/taladro")).toBe("/es/tienda/la-mia");
  });

  it("sin rastro, no inventa nada", () => {
    expect(rutaAnteriorA(almacen(), "/es/producto/taladro")).toBeNull();
  });

  it("un almacén con basura no rompe", () => {
    const a = almacen();
    a.setItem("mercatren-rastro", "{no es json");
    expect(rutaAnteriorA(a, "/x")).toBeNull();
    expect(() => anotarRuta(a, "/x")).not.toThrow();
    expect(rutaAnteriorA(a, "/y")).toBe("/x");
  });
});
