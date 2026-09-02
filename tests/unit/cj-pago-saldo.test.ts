import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * EL PAGO AUTOMÁTICO CON EL SALDO DE CJ (27 ago 2026).
 *
 * La lógica vive pegada a la base y a la API, así que el candado mira la
 * FORMA del archivo: las garantías que, si se pierden, cuestan dinero.
 */
describe("el pago automático con el saldo", () => {
  const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf8");

  it("paga por payBalanceV2 con el shipmentOrderId, y el orderId de respaldo", () => {
    /* `payBalanceV2` pide el shipmentOrderId (doc y ejemplo de CJ). Se
       mandaba el orderId DENTRO de ese campo y el saldo nunca bajó. */
    expect(fuente).toContain("/shopping/pay/payBalanceV2");
    expect(fuente).toContain("cuerpo: { shipmentOrderId }");
    expect(fuente).toContain("pagarConSaldo(db, id, idsDePago)");
    expect(fuente).not.toContain("shipmentOrderId: externoId");
  });

  it("EL ENLACE DE TARJETA SIGUE EXISTIENDO: el pedido se crea con payType 1", () => {
    /* El automático es una capa encima del flujo que ya funcionaba, no un
       reemplazo. Si el saldo no alcanza, queda el enlace y el correo lo dice. */
    expect(fuente).toContain("payType: 1");
    expect(fuente).not.toContain("payType: 2");
  });

  it("marcar pagado RE-COMPRUEBA el estado dentro del update", () => {
    /* Si una persona pagó con tarjeta en la ventana entre crear y cobrar el
       saldo, no se pisa. Sin el estado en el WHERE, se pagaría dos veces. */
    const bloque = fuente.slice(
      fuente.indexOf("async function pagarConSaldo"),
      fuente.indexOf("PREGUNTARLE A CJ CÓMO VA UN PEDIDO"),
    );
    const updates = bloque.split(".update(pedidosProveedor)").length - 1;
    const conEstado =
      bloque.split('eq(pedidosProveedor.estado, "por_pagar")').length - 1;
    expect(updates).toBeGreaterThan(0);
    expect(conEstado).toBe(updates);
  });

  it("lo paga el sistema, SIN autor", () => {
    /* Ponerle el nombre de una persona sería atribuirle algo que no hizo. */
    expect(fuente).toContain("pagadoPorId: null");
  });

  it("el intento va en su propio try: fallar no puede tumbar la compra", () => {
    expect(fuente).toMatch(
      /try \{\s*\n\s*pagoAutomatico = await pagarConSaldo/,
    );
  });
});
