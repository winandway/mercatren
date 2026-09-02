import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  esPedidoYaCreado,
  idsParaPagar,
  leerEstadoDeCj,
} from "@/lib/cj/reconciliar";

/**
 * LA COMPRA A CJ, RECONCILIADA (1 sep 2026).
 *
 * La MT-000011 quedó «No se pudo crear» con CJ diciendo «Order exist, please
 * do not duplicate create»: el pedido existía allá y aquí solo se sabía
 * volver a crearlo. Estas pruebas fijan el camino que faltaba.
 */
describe("«ya existe» no es un error", () => {
  it("se reconoce el mensaje real de CJ", () => {
    expect(
      esPedidoYaCreado("Order exist, please do not duplicate create"),
    ).toBe(true);
    expect(esPedidoYaCreado("order already exists")).toBe(true);
  });

  it("un fallo de verdad NO se confunde con «ya existe»", () => {
    expect(esPedidoYaCreado("Order create fail")).toBe(false);
    expect(esPedidoYaCreado("No variants found for provided SKUs")).toBe(false);
    expect(esPedidoYaCreado(null)).toBe(false);
  });
});

describe("el estado de CJ, leído en nuestras palabras", () => {
  it("sin pagar → se paga", () => {
    for (const s of ["CREATED", "IN_CART", "UNPAID", ""]) {
      expect(leerEstadoDeCj(s)).toEqual({
        pagable: true,
        pagado: false,
        cancelado: false,
      });
    }
  });

  it("YA PAGADO → no se vuelve a pagar (pagar dos veces es el error caro)", () => {
    for (const s of [
      "PENDING",
      "PROCESSING",
      "UNSHIPPED",
      "SHIPPED",
      "DELIVERED",
    ]) {
      expect(leerEstadoDeCj(s).pagado).toBe(true);
      expect(leerEstadoDeCj(s).pagable).toBe(false);
    }
  });

  it("cancelado por CJ → se dice, no se paga", () => {
    expect(leerEstadoDeCj("CANCELLED").cancelado).toBe(true);
    expect(leerEstadoDeCj("cancelled").pagable).toBe(false);
  });
});

describe("con qué id se paga", () => {
  it("shipmentOrderId PRIMERO, orderId de respaldo, sin repetidos", () => {
    expect(
      idsParaPagar({ shipmentOrderId: "S1", orderId: "O1", cjOrderId: "O1" }),
    ).toEqual(["S1", "O1"]);
    expect(idsParaPagar({ orderId: "O1" })).toEqual(["O1"]);
    expect(idsParaPagar({})).toEqual([]);
  });
});

describe("los candados en el código", () => {
  const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf-8");

  it("ANTES de crear se pregunta si ya existe, y si existe se adopta", () => {
    const antes = fuente.indexOf("await buscarPedidoEnCj(pedido.numero)");
    const crear = fuente.indexOf('"/shopping/order/createOrderV2"');
    expect(antes).toBeGreaterThan(0);
    expect(antes).toBeLessThan(crear);
  });

  it("si crear contesta «ya existe», se adopta en vez de marcar error", () => {
    expect(fuente).toContain("esPedidoYaCreado(respuesta.motivo)");
    expect(fuente).toContain("adoptarPedidoExistente(db, {");
  });

  it("al adoptar, lo que CJ ya cobró NO se paga otra vez", () => {
    const bloque = fuente.slice(
      fuente.indexOf("async function adoptarPedidoExistente"),
      fuente.indexOf("export async function comoVaEnCj"),
    );
    expect(bloque).toContain("if (lectura.pagable) {");
    /* Adoptado se CONFIRMA y luego se paga: sin confirmar rebota. */
    expect(bloque).toContain("confirmarYPagarEnCj(db, a.id, a.numero)");
  });

  it("SE CONFIRMA ANTES DE PAGAR: CREATED → confirmOrder → UNPAID → payBalanceV2", () => {
    /* Lo enseñó el panel de CJ: el pedido adoptado estaba en «Preparación
       de pedidos», no en «En espera de pago». Sin confirmar, el saldo
       rebota. */
    const bloque = fuente.slice(
      fuente.indexOf("export async function confirmarYPagarEnCj"),
      fuente.indexOf("export async function comoVaEnCj"),
    );
    const confirma = bloque.indexOf('"/shopping/order/confirmOrder"');
    const paga = bloque.indexOf("pagarConSaldo(db, id, idsParaPagar(detalle))");
    expect(confirma).toBeGreaterThan(0);
    expect(paga).toBeGreaterThan(confirma);
    expect(bloque).toContain('metodo: "PATCH"');
    expect(bloque).toContain("if (lectura.pagado) {");
    expect(readFileSync("src/lib/cj/proveedor-acciones.ts", "utf-8")).toContain(
      "export async function pagarConSaldoDesdePanel",
    );
  });
});
