import { describe, expect, it } from "vitest";

import {
  cuantasPartes,
  MAXIMO_PARTES,
  repartirEnPartes,
} from "@/lib/cobros/partes";

/**
 * COBRAR UNA FACTURA EN VARIAS PARTES (26 ago 2026).
 *
 * El caso: una factura de $7.475 y un cliente cuyo banco le deja mandar
 * $2.500 por Zelle al día. Con un solo cobro no puede pagarla.
 */
describe("repartir el monto", () => {
  it("las partes SIEMPRE suman el total exacto", () => {
    /* Un centavo que no cuadra en una conciliación bancaria cuesta una
       llamada. Se prueban montos que no dividen redondo a propósito. */
    for (const total of [747_500, 286_071, 100, 33_333, 1]) {
      for (const partes of [1, 2, 3, 4, 7, 12]) {
        const r = repartirEnPartes(total, partes, "F-1");
        expect(
          r.reduce((s, p) => s + p.montoCentavos, 0),
          `${total} en ${partes}`,
        ).toBe(total);
      }
    }
  });

  it("ninguna parte se aleja más de un centavo de las demás", () => {
    const r = repartirEnPartes(747_500, 3, "F-00123");
    const montos = r.map((p) => p.montoCentavos);
    expect(Math.max(...montos) - Math.min(...montos)).toBeLessThanOrEqual(1);
    expect(montos).toEqual([249_167, 249_167, 249_166]);
  });

  it("numera las referencias, y con UNA parte no toca nada", () => {
    expect(
      repartirEnPartes(747_500, 3, "F-00123").map((p) => p.referencia),
    ).toEqual(["F-00123 (1/3)", "F-00123 (2/3)", "F-00123 (3/3)"]);
    /* Un cobro de una parte es el cobro de siempre: su referencia intacta. */
    const una = repartirEnPartes(747_500, 1, "F-00123");
    expect(una).toHaveLength(1);
    expect(una[0]!.referencia).toBe("F-00123");
    expect(una[0]!.montoCentavos).toBe(747_500);
  });

  it("cuantasPartes acota lo que llega del formulario", () => {
    expect(cuantasPartes("3")).toBe(3);
    expect(cuantasPartes(0)).toBe(1);
    expect(cuantasPartes(-5)).toBe(1);
    expect(cuantasPartes("hola")).toBe(1);
    /* Más partes que meses no es un abono, es un crédito. */
    expect(cuantasPartes(999)).toBe(MAXIMO_PARTES);
  });
});

describe("el número de factura NO se adivina sobre un texto (26 ago 2026)", () => {
  it("`siguienteReferencia` está retirada: era la idea equivocada", async () => {
    const partes = await import("@/lib/cobros/partes");
    /* Proponía el número sumándole uno al último que alguien hubiera escrito
       a mano. Un `MT-100009` tecleado con prisa se propagaba para siempre. */
    expect("siguienteReferencia" in partes).toBe(false);
  });

  it("los cobros tienen su propia serie, con prefijo distinto al de pedidos", async () => {
    const { SERIES } = await import("@/lib/facturas/numeracion");
    expect(SERIES.cobroEnlace.id).toBe("cobro_enlace");
    /* `MT-C-` no se confunde con el número de PEDIDO (`MT-000009`), que es lo
       que se copió aquella vez. */
    expect(SERIES.cobroEnlace.prefijo).toBe("MT-C-");
    for (const otra of [SERIES.facturaVenta, SERIES.ordenCompra]) {
      expect(otra.prefijo).not.toBe(SERIES.cobroEnlace.prefijo);
    }
  });

  it("y el número sale consecutivo, con seis dígitos", async () => {
    const { formatearNumero, SERIES } =
      await import("@/lib/facturas/numeracion");
    expect(formatearNumero(SERIES.cobroEnlace.prefijo, 1)).toBe("MT-C-000001");
    expect(formatearNumero(SERIES.cobroEnlace.prefijo, 10)).toBe("MT-C-000010");
    /* Nunca empieza por un millón, que es lo que se vio en pantalla. */
    expect(formatearNumero(SERIES.cobroEnlace.prefijo, 1)).not.toContain("100");
  });

  it("al crear, se toma de la serie salvo que el comercio ponga el suyo", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    expect(fuente).toContain("siguienteNumero(db, SERIES.cobroEnlace)");
    /* Si escribió `VIG-02497` —su propio talonario— se respeta tal cual. */
    expect(fuente).toContain("startsWith(SERIES.cobroEnlace.prefijo)");
  });
});
