import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  candidatosDeCodigoCj,
  elegirLogisticaConStock,
  esFalloDeInventario,
} from "@/lib/cj/reconciliar";

/**
 * CJ SE NIEGA A CONFIRMAR POR INVENTARIO (1 sep 2026).
 *
 * El transporte más barato estaba atado a un almacén sin la talla. CJ
 * mismo dice qué transportes tienen stock para ese pedido: se le pregunta,
 * se cambia, y se confirma. Y «descartar» borra el pedido en CJ, o volver a
 * pedir adopta el mismo pedido atascado.
 */
describe("el fallo de inventario se reconoce", () => {
  it("con el mensaje real de CJ", () => {
    expect(
      esFalloDeInventario(
        "Confirm order failed, 1. The selected logistics is assigned to a warehouse with insufficient inventory. Please change the logistics option and try to resubmit.",
      ),
    ).toBe(true);
  });
  it("y no se confunde con otros fallos", () => {
    expect(
      esFalloDeInventario("Order exist, please do not duplicate create"),
    ).toBe(false);
    expect(esFalloDeInventario(null)).toBe(false);
  });
});

describe("se elige el transporte más barato CON stock", () => {
  it("ignora los que no tienen stock aunque sean más baratos", () => {
    const elegido = elegirLogisticaConStock([
      { id: 1, logisticsName: "GOFO+", postage: 1.7, hasStock: false },
      { id: 2, logisticsName: "USPS+", postage: 3.1, hasStock: true },
      { id: 3, logisticsName: "CJPacket", postage: 2.4, hasStock: "true" },
    ]);
    expect(elegido?.logisticsName).toBe("CJPacket");
  });
  it("sin ninguno con stock devuelve null — y eso se dice, no se adivina", () => {
    expect(
      elegirLogisticaConStock([
        { id: 1, logisticsName: "GOFO+", hasStock: false },
      ]),
    ).toBeNull();
  });
});

describe("los candados en el código", () => {
  it("al fallar la confirmación por inventario, se cambia el transporte y se reintenta UNA vez", () => {
    const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf-8");
    expect(fuente).toContain("esFalloDeInventario(confirmacion.motivo)");
    expect(fuente).toContain(
      "/shopping/order/getOrderLogisticsInfo?orderCode=",
    );
    expect(fuente).toContain('"/shopping/order/updateLogistics"');
    /* Y el reintento es UNO: dos llamadas a confirmOrder en ese bloque. */
    const bloque = fuente.slice(
      fuente.indexOf("export async function confirmarYPagarEnCj"),
      fuente.indexOf("export async function comoVaEnCj"),
    );
    expect(bloque.split('"/shopping/order/confirmOrder"').length - 1).toBe(2);
  });

  it("descartar intenta BORRAR en CJ antes de marcarlo aquí, y cierra aquí aunque CJ se niegue", () => {
    const fuente = readFileSync("src/lib/cj/proveedor-acciones.ts", "utf-8");
    const borra = fuente.indexOf("/shopping/order/deleteOrder?orderId=");
    const marca = fuente.indexOf("Descartada por ${usuario?.name");
    expect(borra).toBeGreaterThan(0);
    expect(marca).toBeGreaterThan(borra);
    /* «Order delete fail» no puede dejar al dueño atrapado. */
    expect(fuente).toContain("CJ no dejó borrarlo allá");
    expect(fuente).not.toContain("No se descarta aquí para no dejar dos");
  });
});

describe("el código con el que se le piden los transportes a CJ", () => {
  it("prueba TODOS los identificadores, del SD… al numérico, sin repetir", () => {
    /* En un pedido sin confirmar `cjOrderId` llega null (ejemplo de la doc)
       y con el numérico CJ contesta «The CJ order does not exist». */
    expect(
      candidatosDeCodigoCj(
        {
          cjOrderId: null,
          shipmentOrderId: "",
          orderNum: "MT-000011",
          orderId: "210823100016290555",
        },
        "MT-000011",
      ),
    ).toEqual(["MT-000011", "210823100016290555"]);
    expect(
      candidatosDeCodigoCj(
        { cjOrderId: "SD26083100222", orderId: "1" },
        "MT-1",
      )[0],
    ).toBe("SD26083100222");
  });

  it("y si ninguno sirve, deja escrito lo que CJ devolvió del pedido", () => {
    const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf-8");
    expect(fuente).toContain("candidatosDeCodigoCj(detalle, numero)");
    expect(fuente).toContain("Detalle de CJ: ${visto}");
  });
});
