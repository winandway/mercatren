import { describe, expect, it } from "vitest";

import {
  MINIMO_MAYORISTA,
  TIENDA_MAYORISTA,
  ajustarCantidad,
  cantidadMinima,
  esMayorista,
  vaAlMayorista,
} from "@/lib/cj/mayorista";
import { MARGEN_MINIMO_CENTAVOS, desglosarUs } from "@/lib/destino/precio-us";

/**
 * LA TIENDA MAYORISTA.
 *
 * Los productos que dejan menos de dos dólares sueltos —donde una sola
 * devolución convierte la venta en pérdida— se venden de a diez. El mismo
 * producto que deja $0.90 suelto deja nueve en un lote.
 */
describe("la tienda mayorista", () => {
  it("los que dejan poco van al mayorista", () => {
    /* Un producto barato de verdad: cuesta $2 en CJ. */
    const flaco = desglosarUs(200, 0);
    expect(flaco.margenCentavos).toBeLessThan(MARGEN_MINIMO_CENTAVOS);
    expect(vaAlMayorista(flaco.margenCentavos)).toBe(true);
  });

  it("los que dejan bien NO van al mayorista", () => {
    /* Uno de $30 de costo deja de sobra: ese se vende de a uno. */
    const bueno = desglosarUs(3000, 0);
    expect(vaAlMayorista(bueno.margenCentavos)).toBe(false);
  });

  it("justo en la línea NO va al mayorista", () => {
    /* Dos dólares es «suficiente», no «insuficiente». Si el límite se leyera
       al revés, media tienda se iría a lotes sin que nadie lo decidiera. */
    expect(vaAlMayorista(MARGEN_MINIMO_CENTAVOS)).toBe(false);
    expect(vaAlMayorista(MARGEN_MINIMO_CENTAVOS - 1)).toBe(true);
  });

  it("en la mayorista el mínimo son diez; en el resto, uno", () => {
    expect(cantidadMinima(TIENDA_MAYORISTA.id)).toBe(MINIMO_MAYORISTA);
    expect(cantidadMinima("tienda-us-ropa-calzado")).toBe(1);
    expect(cantidadMinima("tienda-bley-ferreteria")).toBe(1);
    expect(cantidadMinima(null)).toBe(1);
  });

  it("la cantidad SUBE al mínimo, nunca baja", () => {
    /* Quien pidió 25 se lleva 25. Un carrito que recorta lo que la persona ya
       eligió es un carrito que pierde la compra. */
    expect(ajustarCantidad(3, TIENDA_MAYORISTA.id)).toBe(10);
    expect(ajustarCantidad(25, TIENDA_MAYORISTA.id)).toBe(25);
    expect(ajustarCantidad(10, TIENDA_MAYORISTA.id)).toBe(10);
  });

  it("una cantidad rota no vacía el carrito", () => {
    /* Del navegador puede llegar cualquier cosa. Cero, negativo o basura se
       convierten en el mínimo — nunca en un pedido de cero unidades. */
    for (const roto of [0, -5, NaN, 0.4]) {
      expect(ajustarCantidad(roto, TIENDA_MAYORISTA.id)).toBe(10);
      expect(ajustarCantidad(roto, "tienda-us-ropa-calzado")).toBe(1);
    }
  });

  it("solo la mayorista es mayorista", () => {
    expect(esMayorista(TIENDA_MAYORISTA.id)).toBe(true);
    expect(esMayorista("tienda-mercatren-us")).toBe(false);
    expect(esMayorista(undefined)).toBe(false);
  });

  it("un lote de diez convierte un margen flaco en uno que vale la pena", () => {
    /* La razón entera de esta tienda, comprobada con números. */
    const flaco = desglosarUs(200, 0);
    expect(flaco.margenCentavos * MINIMO_MAYORISTA).toBeGreaterThan(
      MARGEN_MINIMO_CENTAVOS * 3,
    );
  });
});
