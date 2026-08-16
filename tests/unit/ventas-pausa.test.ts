import { describe, expect, it } from "vitest";

import { EN_PAUSA, carritoPausado, ventaPausada } from "@/lib/ventas/pausa";

describe("la pausa de las ventas de Estados Unidos", () => {
  it("un producto de Estados Unidos no se puede comprar", () => {
    expect(ventaPausada("US")).toBe(EN_PAUSA);
  });

  it("Venezuela NO se toca", () => {
    /* Ahí hay comercios reales despachando de verdad. Su venta no puede pagar
       por una prueba que es nuestra. */
    expect(ventaPausada("VE")).toBe(false);
  });

  it("un producto sin país declarado se vende igual", () => {
    /* La mayoría del catálogo venezolano no trae el campo. Pausarlo por estar
       vacío apagaría la tienda entera. */
    expect(ventaPausada(null)).toBe(false);
    expect(ventaPausada(undefined)).toBe(false);
    expect(ventaPausada("")).toBe(false);
  });

  it("un « us » con espacios o en minúscula también queda pausado", () => {
    /* El país se escribe a mano en el panel. Comparar el texto crudo dejaría
       la venta abierta justo donde no debe estar. */
    expect(ventaPausada(" us ")).toBe(EN_PAUSA);
    expect(ventaPausada("Us")).toBe(EN_PAUSA);
  });

  it("basta UN producto pausado para detener el carrito entero", () => {
    /* Despachar la mitad y cobrar el total es peor que no vender nada. */
    expect(carritoPausado(["VE", "VE", "US"])).toBe(EN_PAUSA);
  });

  it("un carrito solo de Venezuela pasa", () => {
    expect(carritoPausado(["VE", null, "VE"])).toBe(false);
  });

  it("un carrito vacío no está pausado", () => {
    expect(carritoPausado([])).toBe(false);
  });
});
