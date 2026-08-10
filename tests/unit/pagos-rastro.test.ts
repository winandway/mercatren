import { describe, expect, it } from "vitest";

import { estaCobrado, rastroDelPago } from "@/lib/pagos/rastro";

/**
 * LA REGLA QUE MÁS IMPORTA DE ESTE ARCHIVO.
 *
 * Un identificador de Stripe (`pi_...`) existe desde que se abre el intento de
 * cobro, mucho antes de que el dinero entre. Si el panel lo enseñara junto a un
 * pedido sin pagar, el comercio leería «tiene su referencia de pago» y
 * despacharía mercancía que nadie pagó.
 */
describe("sin cobro confirmado no se enseña la referencia de la tarjeta", () => {
  it("un intento pendiente no muestra el identificador", () => {
    const r = rastroDelPago({
      metodo: "stripe",
      estadoTarjeta: "pendiente",
      referenciaTarjeta: "pi_3U2vNHLDByFATg8R2sfSZsbA",
    });
    expect(r.estado).toBe("en_revision");
    expect(r.referencia).toBeNull();
  });

  it("un cobro rechazado tampoco", () => {
    const r = rastroDelPago({
      metodo: "stripe",
      estadoTarjeta: "rechazado",
      referenciaTarjeta: "pi_loquesea",
    });
    expect(r.estado).toBe("rechazado");
    expect(r.referencia).toBeNull();
  });

  it("confirmado sí la muestra: es lo que se busca en Stripe", () => {
    const r = rastroDelPago({
      metodo: "stripe",
      estadoTarjeta: "confirmado",
      referenciaTarjeta: "pi_3U2vNHLDByFATg8R2sfSZsbA",
    });
    expect(r.estado).toBe("confirmado");
    expect(r.referencia).toBe("pi_3U2vNHLDByFATg8R2sfSZsbA");
  });

  it("un reembolso conserva la referencia", () => {
    // Es justo cuando más falta hace: hay que ir a buscar ese cobro.
    const r = rastroDelPago({
      metodo: "stripe",
      estadoTarjeta: "reembolsado",
      referenciaTarjeta: "pi_abc",
    });
    expect(r.estado).toBe("reembolsado");
    expect(r.referencia).toBe("pi_abc");
  });

  it("una referencia vacía cuenta como que no hay", () => {
    const r = rastroDelPago({
      metodo: "stripe",
      estadoTarjeta: "confirmado",
      referenciaTarjeta: "   ",
    });
    expect(r.referencia).toBeNull();
  });
});

describe("un pedido sin pagar se distingue de uno rechazado", () => {
  it("recién creado, sin ninguna fila de pago", () => {
    const r = rastroDelPago({ metodo: "stripe" });
    expect(r.estado).toBe("sin_pago");
    expect(r.metodo).toBe("stripe");
  });

  it("el método se sabe aunque todavía no se haya pagado", () => {
    // Se eligió en el checkout: es información buena desde el primer momento.
    expect(rastroDelPago({ metodo: "zelle" }).metodo).toBe("zelle");
  });
});

describe("Zelle", () => {
  it("«aprobado» y «confirmado» son lo mismo para quien mira", () => {
    /* Uno lo aprueba una persona contra el banco y el otro lo confirma Stripe
       solo. El dinero entró en los dos casos. */
    expect(
      rastroDelPago({ metodo: "zelle", estadoZelle: "aprobado" }).estado,
    ).toBe("confirmado");
  });

  it("la referencia es el código de confirmación del banco", () => {
    const r = rastroDelPago({
      metodo: "zelle",
      estadoZelle: "aprobado",
      codigoZelle: "ABC123XYZ",
      bancoZelle: "Bank of America",
      ultimosCuatroZelle: "1030",
    });
    expect(r.referencia).toBe("ABC123XYZ");
  });

  it("sin código, sirve el banco con los últimos cuatro", () => {
    const r = rastroDelPago({
      metodo: "zelle",
      estadoZelle: "pendiente",
      bancoZelle: "Chase",
      ultimosCuatroZelle: "4417",
    });
    expect(r.referencia).toBe("Chase ····4417");
  });

  it("los últimos cuatro SOLOS no se enseñan", () => {
    /* Cuatro dígitos sueltos, sin decir de qué cuenta son, no llevan a
       ninguna parte y parecen un dato más de los que ya hay. */
    const r = rastroDelPago({
      metodo: "zelle",
      estadoZelle: "pendiente",
      ultimosCuatroZelle: "4417",
    });
    expect(r.referencia).toBeNull();
  });

  it("en revisión SÍ se enseña la referencia", () => {
    /* Al revés que en la tarjeta: es justo lo que el validador busca en el
       banco para poder aprobarlo. */
    const r = rastroDelPago({
      metodo: "zelle",
      estadoZelle: "pendiente",
      codigoZelle: "PENDIENTE1",
    });
    expect(r.estado).toBe("en_revision");
    expect(r.referencia).toBe("PENDIENTE1");
  });

  it("sin comprobante todavía, no hay referencia", () => {
    const r = rastroDelPago({ metodo: "zelle", codigoZelle: "NODEBERIA" });
    expect(r.estado).toBe("sin_pago");
    expect(r.referencia).toBeNull();
  });
});

/**
 * UN PEDIDO ENTREGADO NO PUEDE DECIR «SIN PAGAR».
 *
 * Se vio en pantalla: la lista enseñaba «Entregado» y «Zelle · sin pagar» en la
 * misma línea, porque el histórico importado llegó sin enlazar a su pedido. Un
 * comercio que lee eso deja de creerle al panel.
 */
describe("el estado del pedido manda cuando no aparece el cobro", () => {
  for (const estadoPedido of ["pagado", "preparando", "enviado", "entregado"]) {
    it(`un pedido «${estadoPedido}» sin fila de cobro se da por cobrado`, () => {
      const r = rastroDelPago({ metodo: "zelle", estadoPedido });
      expect(r.estado).toBe("confirmado");
      // Pero sin comprobante no hay referencia que enseñar.
      expect(r.referencia).toBeNull();
    });
  }

  it("vale igual para la tarjeta", () => {
    expect(
      rastroDelPago({ metodo: "stripe", estadoPedido: "entregado" }).estado,
    ).toBe("confirmado");
  });

  it("un pedido esperando el pago sigue sin pagar", () => {
    expect(
      rastroDelPago({ metodo: "zelle", estadoPedido: "pendiente_pago" }).estado,
    ).toBe("sin_pago");
  });

  it("uno cancelado NO se da por cobrado", () => {
    expect(
      rastroDelPago({ metodo: "zelle", estadoPedido: "cancelado" }).estado,
    ).toBe("sin_pago");
  });

  it("NO tapa un cobro rechazado", () => {
    /* Ahí sí hay una contradicción de verdad, y esconderla sería esconder
       justo lo que hay que revisar. */
    const r = rastroDelPago({
      metodo: "stripe",
      estadoTarjeta: "rechazado",
      estadoPedido: "entregado",
    });
    expect(r.estado).toBe("rechazado");
  });

  it("NO tapa un comprobante en revisión", () => {
    const r = rastroDelPago({
      metodo: "zelle",
      estadoZelle: "pendiente",
      estadoPedido: "entregado",
    });
    expect(r.estado).toBe("en_revision");
  });
});

describe("no se adivina lo que no se sabe", () => {
  it("un pedido viejo sin método guardado no inventa uno", () => {
    expect(rastroDelPago({ metodo: null }).metodo).toBeNull();
  });

  it("un método desconocido se trata como no sabido", () => {
    expect(rastroDelPago({ metodo: "paypal" }).metodo).toBeNull();
  });
});

describe("estaCobrado", () => {
  it("solo es verdad cuando el dinero entró", () => {
    const cobrado = rastroDelPago({
      metodo: "stripe",
      estadoTarjeta: "confirmado",
    });
    expect(estaCobrado(cobrado)).toBe(true);

    for (const estadoTarjeta of ["pendiente", "rechazado", "reembolsado"]) {
      expect(
        estaCobrado(rastroDelPago({ metodo: "stripe", estadoTarjeta })),
      ).toBe(false);
    }
  });
});
