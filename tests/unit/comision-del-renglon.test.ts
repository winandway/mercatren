import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  baseDesdePublicado,
  precioConAjusteCentavos,
  precioZelleCentavos,
} from "@/lib/dinero";

/**
 * LA AUDITORÍA DE LA CALCULADORA (31 ago 2026).
 *
 * La pidió el dueño con una venta real delante (la antena Starlink Mini,
 * pagada por Zelle). El comercio recibe SU precio exacto; el margen y el
 * procesador van ENCIMA — nunca salen de su bolsillo ni del nuestro.
 */
describe("el comercio recibe su precio exacto", () => {
  /** La comisión del renglón como la guarda crearPedido. */
  const comision = (subtotal: number, base: number, cantidad: number) =>
    Math.max(0, subtotal - base * cantidad);

  it("EL CASO STARLINK, al centavo: base $423 → Zelle cobra $436.09 → neto $423.00", () => {
    const base = 42_300;
    expect(precioConAjusteCentavos(base)).toBe(44_985); // la ficha real
    const cobrado = precioZelleCentavos(base);
    expect(cobrado).toBe(43_609); // lo que pagó el cliente
    expect(cobrado - comision(cobrado, base, 1)).toBe(base);
  });

  it("CON TARJETA el fee de Stripe ya NO se le regala al comercio", () => {
    /* Antes: comisión = 3% del cobrado → el 2.9% + $0.30 del procesador,
       que viene DENTRO del precio, terminaba acreditado al comercio y
       Stripe nos lo cobraba a nosotros. Margen real: ~$0.15 por venta. */
    const base = 42_300;
    const publicado = precioConAjusteCentavos(base); // 44985
    const neto = publicado - comision(publicado, base, 1);
    expect(neto).toBe(base); // recibe su precio, ni más ni menos
    // Y la comisión cubre margen + procesador: $26.85, no $13.50.
    expect(comision(publicado, base, 1)).toBe(2_685);
  });

  it("la base deducida de un publicado vuelve al mismo número", () => {
    expect(baseDesdePublicado(44_985)).toBe(42_300);
  });

  it("con varias unidades, la base se multiplica por la cantidad", () => {
    const base = 10_000;
    const publicado = precioConAjusteCentavos(base);
    expect(comision(publicado * 3, base, 3)).toBe((publicado - base) * 3);
  });

  it("EL CANDADO: crearPedido guarda la comisión como subtotal − base", () => {
    const fuente = readFileSync("src/lib/pedidos/acciones.ts", "utf-8");
    expect(fuente).toContain(
      "comisionCentavos: Math.max(0, subtotalLinea - base * cantidad)",
    );
    /* La versión vieja — el 3% a secas — es la fuga del procesador. */
    expect(fuente).not.toContain("comisionCentavos: calcularComisionCentavos(");
  });

  it("y el formulario del comercio enseña las tres cifras en vivo", () => {
    const fuente = readFileSync(
      "src/components/panel/formulario-producto.tsx",
      "utf-8",
    );
    expect(fuente).toContain("VistaPreviaDelPrecio");
    expect(fuente).toContain('t("previaPrecio"');
  });
});
