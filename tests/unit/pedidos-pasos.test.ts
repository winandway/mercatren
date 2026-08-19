import { describe, expect, it } from "vitest";

import {
  avisoDelPedido,
  estaPagado,
  PASOS,
  pasoActual,
} from "@/lib/pedidos/pasos";

describe("el aviso NUNCA dice que falta pagar algo ya pagado", () => {
  it("un pedido pagado con tarjeta lo dice, en verde", () => {
    /**
     * EL FALLO QUE ESTO EVITA (18 ago 2026): el dueño pagó $7.95 con tarjeta,
     * Stripe lo confirmó, y la pantalla siguió diciendo «Ahora falta el pago».
     * El aviso estaba escrito fijo, sin mirar el estado del pedido.
     *
     * Quien acaba de meter su tarjeta y lee «falta el pago» hace una de dos:
     * paga otra vez, o llama al banco. Las dos cuestan dinero.
     */
    const a = avisoDelPedido("pagado", "stripe", false);
    expect(a.clave).toBe("pagado");
    expect(a.tono).toBe("verde");
  });

  it("«preparando» TAMBIÉN está pagado", () => {
    /**
     * EL MISMO FALLO, VIVO POR OTRA PUERTA (lo destapó el compilador el 18 ago
     * 2026). `preparando` no estaba en la lista de estados y las pantallas lo
     * colaban con `as EstadoDePedido`, así que caía en la rama de «recién
     * creado»: en cuanto alguien marcara un pedido como «preparando» —que está
     * PAGADO, lo está armando el comercio— la pantalla volvía a decirle «ahora
     * falta el pago» a quien ya había pagado.
     */
    expect(estaPagado("preparando")).toBe(true);
    expect(avisoDelPedido("preparando", "stripe", false).clave).toBe("pagado");
    expect(avisoDelPedido("preparando", "stripe", false).tono).toBe("verde");
  });

  it("y sigue diciéndolo cuando ya se envió o se entregó", () => {
    /* El pago no se «deshace» al despachar: quien mire su pedido una semana
       después tiene que seguir viendo que está pagado. */
    expect(avisoDelPedido("enviado", "stripe", false).clave).toBe("pagado");
    expect(avisoDelPedido("entregado", "zelle", false).clave).toBe("pagado");
  });

  it("recién creado sí pide el pago", () => {
    expect(avisoDelPedido("pendiente_pago", "stripe", false).clave).toBe(
      "reciénCreado",
    );
  });
});

describe("Zelle y tarjeta no dicen lo mismo", () => {
  it("con la captura subida dice que se está verificando, no que falta pagar", () => {
    /* Con Zelle el pago puede estar HECHO y lo que falta es que una persona lo
       compruebe contra el banco. Decirle «falta el pago» a quien ya transfirió
       es como acaba pagando dos veces. */
    const a = avisoDelPedido("pendiente_pago", "zelle", true);
    expect(a.clave).toBe("esperandoVerificacion");
    expect(a.tono).toBe("ambar");
  });

  it("sin captura todavía, sí falta pagar", () => {
    expect(avisoDelPedido("pendiente_pago", "zelle", false).clave).toBe(
      "reciénCreado",
    );
  });

  it("con tarjeta no existe el estado intermedio", () => {
    /* El cobro con tarjeta es inmediato: o entró o no entró. Si apareciera
       «esperando verificación» sería una espera que no existe. */
    expect(avisoDelPedido("pendiente_pago", "stripe", true).clave).toBe(
      "reciénCreado",
    );
  });
});

describe("los pasos", () => {
  it("son tres, en orden", () => {
    expect(PASOS.map((p) => p.numero)).toEqual([1, 2, 3]);
  });

  it("sin pagar va en el 2; pagado, en el 3", () => {
    expect(pasoActual("pendiente_pago")).toBe(2);
    expect(pasoActual("pagado")).toBe(3);
  });

  it("pagar YA es el final para quien compró", () => {
    /* Aunque falte despachar. Su parte terminó cuando pagó, y dejarle la
       barra a medias le hace creer que todavía tiene que hacer algo. */
    expect(pasoActual("pagado")).toBe(PASOS.length);
    expect(pasoActual("enviado")).toBe(PASOS.length);
  });
});

describe("lo que se cae del camino feliz", () => {
  it("cancelado y reembolsado no se pintan de verde", () => {
    /* Verde es «todo bien». Un pedido cancelado en verde es una pantalla
       diciendo lo contrario de lo que pasó. */
    expect(avisoDelPedido("cancelado", "stripe", false).tono).toBe("gris");
    expect(avisoDelPedido("reembolsado", "stripe", false).tono).toBe("gris");
  });

  it("y no cuentan como pagados", () => {
    expect(estaPagado("cancelado")).toBe(false);
    expect(estaPagado("reembolsado")).toBe(false);
    expect(estaPagado("pendiente_pago")).toBe(false);
  });
});
