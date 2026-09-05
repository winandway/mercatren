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

  it("PAGA PRIMERO con payBalance (v1) por el orderId numérico; payBalanceV2 queda de respaldo", () => {
    /* Medido el 5 sep 2026: v1 con el orderId de CJ pagó PRUEBA-20260905184139
       y el saldo bajó $150 → $138.60. V2 pide un shipmentOrderId que un
       pedido de un solo envío no tiene; por eso el saldo nunca había bajado. */
    const bloque = fuente.slice(
      fuente.indexOf("async function pagarConSaldo"),
      fuente.indexOf("PREGUNTARLE A CJ CÓMO VA UN PEDIDO"),
    );
    const v1 = bloque.indexOf('"/shopping/pay/payBalance"');
    const v2 = bloque.indexOf('"/shopping/pay/payBalanceV2"');
    expect(v1).toBeGreaterThan(0);
    expect(v2).toBeGreaterThan(v1);
    expect(bloque).toContain("cuerpo: { orderId }");
    expect(bloque).toContain("cuerpo: { shipmentOrderId }");
    /* Y v2 solo si v1 no pagó. */
    expect(bloque.indexOf("if (!respuesta.ok) {")).toBeLessThan(v2);
    /* Recién creado está CREATED: se confirma y luego se paga. */
    expect(fuente).toContain("confirmarYPagarEnCj(db, id, pedido.numero)");
    expect(fuente).toContain("return pagarConSaldo(db, id, detalle);");
    expect(fuente).not.toContain("shipmentOrderId: externoId");
  });

  it("las compras que quedaron por pagar se reintentan solas desde el vigilante, menos las que pierden dinero", () => {
    expect(fuente).toContain(
      "export async function reintentarPagosPendientesDeCj(",
    );
    expect(fuente).toContain('startsWith("ESTA VENTA PIERDE")');
    const vigilante = readFileSync("src/lib/vigilante/correr.ts", "utf8");
    const actuar = vigilante.slice(
      vigilante.indexOf("async function actuar("),
      vigilante.indexOf("async function avisar("),
    );
    expect(actuar).toContain("reintentarPagosPendientesDeCj(");
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
      /try \{[\s\S]{0,300}pagoAutomatico = await confirmarYPagarEnCj/,
    );
  });
});
