import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { IVA_GENERAL_ES_PB, ivaIncluidoEnEspana } from "@/lib/impuestos/espana";

/**
 * EL IVA DE ESPAÑA EN EL PEDIDO Y EN LAS FACTURAS (5 nov 2026). El precio ya
 * lo lleva dentro: se desglosa, no se suma. Lo que no puede pasar sin que esto
 * se ponga en rojo: sumarle el IVA al precio, un desglose que no cuadra con el
 * total, una factura de España sin el NIF español cuando ya exista, o una
 * orden de compra que no le diga al comercio a quién facturarnos.
 */
const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");

describe("el IVA va dentro del precio y se desglosa", () => {
  it("21 % general", () => {
    expect(IVA_GENERAL_ES_PB).toBe(2100);
    expect(ivaIncluidoEnEspana(12_100)).toEqual({
      neto: 10_000,
      impuesto: 2_100,
    });
  });

  it("las dos partes suman siempre el total exacto", () => {
    for (const total of [1, 99, 2490, 12_891, 999_999]) {
      const { neto, impuesto } = ivaIncluidoEnEspana(total);
      expect(neto + impuesto).toBe(total);
    }
  });

  it("el pedido de España lo anota y no lo suma al total", () => {
    const accion = leer("src/lib/pedidos/acciones.ts");
    expect(accion).toContain('mercadoDeLaCompra.codigo === "ES"');
    expect(accion).toContain("ivaIncluidoEnEspana(total).impuesto");
    expect(accion).toContain("const total = subtotal + envioCentavos;");
  });
});

describe("las facturas de España", () => {
  it("la de venta lleva el NIF español cuando exista, y dice «IVA incluido»", () => {
    expect(leer("src/lib/facturas/emitir.ts")).toContain(
      'if (pedido.mercado === "ES" && LEGALES_ES.nifEspana) {',
    );
    expect(
      leer("src/app/[locale]/(tienda)/factura/[numero]/page.tsx"),
    ).toContain('t("ivaIncluidoEspana")');
  });

  it("la orden de compra le dice al comercio español a quién facturarnos", () => {
    const orden = leer("src/app/[locale]/panel/ordenes-compra/[id]/page.tsx");
    expect(orden).toContain('orden.mercado === "ES" && LEGALES_ES.nifEspana');
    expect(orden).toContain('t("facturanosEspanaTexto"');
  });
});
