import { describe, expect, it } from "vitest";

import {
  calcularCupo,
  diasParaVencer,
  estadoDelPedido,
  fechaVencimiento,
  pendienteDePedido,
  porcentajeAbonado,
  puedeComprarACredito,
} from "@/lib/credito/cupo";

/**
 * LAS CUENTAS DEL CRÉDITO.
 *
 * Esto es dinero de un comercio de verdad: MEGAYES le da $2.000 de cupo a un
 * taller, el taller se lleva la mercancía y abona por partes. Un error de una
 * unidad aquí es un error de un centavo en la cuenta de alguien, y multiplicado
 * por cientos de abonos, es plata que se reclama.
 */

const DIA = 24 * 60 * 60 * 1000;
/* Una fecha fija: las pruebas no pueden depender de qué día se corran. */
const AHORA = new Date("2026-08-06T12:00:00Z").getTime();

describe("lo que falta por pagar de un pedido", () => {
  it("resta lo abonado del total", () => {
    expect(
      pendienteDePedido({ totalCentavos: 200_000, abonadoCentavos: 50_000 }),
    ).toBe(150_000);
  });

  it("un pedido sin abonos debe todo", () => {
    expect(
      pendienteDePedido({ totalCentavos: 200_000, abonadoCentavos: 0 }),
    ).toBe(200_000);
  });

  it("NUNCA devuelve una deuda negativa", () => {
    /* Pasa de verdad: el cliente debía $480 y manda $500 redondo. Ese pedido
       está saldado; el sobrante se mira aparte, no se convierte en una deuda
       al revés que descuadre todas las sumas. */
    expect(
      pendienteDePedido({ totalCentavos: 48_000, abonadoCentavos: 50_000 }),
    ).toBe(0);
  });
});

describe("el cupo del cliente", () => {
  it("sin pedidos abiertos, tiene el tope entero", () => {
    const c = calcularCupo(200_000, []);
    expect(c.usadoCentavos).toBe(0);
    expect(c.disponibleCentavos).toBe(200_000);
  });

  it("descuenta lo que debe de varios pedidos", () => {
    const c = calcularCupo(200_000, [
      { totalCentavos: 80_000, abonadoCentavos: 30_000 }, // debe 50.000
      { totalCentavos: 40_000, abonadoCentavos: 0 }, // debe 40.000
    ]);
    expect(c.usadoCentavos).toBe(90_000);
    expect(c.disponibleCentavos).toBe(110_000);
  });

  it("CADA ABONO LIBERA CUPO", () => {
    /* Es lo que hace útil el sistema y hay que dejarlo escrito: el cliente con
       $2.000 de tope que ya abonó $1.700 puede volver a comprar $1.700 sin
       esperar a saldar los $300 que le faltan. Así el comercio vende más. */
    const antes = calcularCupo(200_000, [
      { totalCentavos: 200_000, abonadoCentavos: 0 },
    ]);
    const despues = calcularCupo(200_000, [
      { totalCentavos: 200_000, abonadoCentavos: 170_000 },
    ]);

    expect(antes.disponibleCentavos).toBe(0);
    expect(despues.disponibleCentavos).toBe(170_000);
  });

  it("un pedido ya pagado no ocupa cupo", () => {
    const c = calcularCupo(200_000, [
      { totalCentavos: 200_000, abonadoCentavos: 200_000 },
    ]);
    expect(c.disponibleCentavos).toBe(200_000);
  });

  it("si le recortan el tope por debajo de lo que debe, el disponible es CERO", () => {
    /* Nunca un número negativo: alguna pantalla lo restaría mal y le
       aparecería al cliente un cupo fantasma. */
    const c = calcularCupo(50_000, [
      { totalCentavos: 200_000, abonadoCentavos: 0 },
    ]);
    expect(c.disponibleCentavos).toBe(0);
    expect(c.usadoCentavos).toBe(200_000);
  });
});

describe("si puede comprar a crédito", () => {
  const cupo = calcularCupo(200_000, [
    { totalCentavos: 100_000, abonadoCentavos: 0 },
  ]); // le quedan 100.000

  it("deja comprar dentro de lo disponible", () => {
    expect(puedeComprarACredito(cupo, "activo", 90_000)).toEqual({
      puede: true,
    });
  });

  it("deja comprar EXACTAMENTE lo disponible", () => {
    /* El borde. Si aquí se usara `>=` en vez de `>`, un cliente con $1.000 de
       cupo no podría gastar sus $1.000 y no entendería por qué. */
    expect(puedeComprarACredito(cupo, "activo", 100_000)).toEqual({
      puede: true,
    });
  });

  it("corta si se pasa aunque sea por un centavo", () => {
    const r = puedeComprarACredito(cupo, "activo", 100_001);
    expect(r).toEqual({ puede: false, motivo: "noAlcanza" });
  });

  it("corta si no tiene crédito", () => {
    expect(puedeComprarACredito(null, null, 1000)).toEqual({
      puede: false,
      motivo: "sinCredito",
    });
  });

  it("corta si el comercio se lo suspendió", () => {
    /* El comercio puede cortarle el cupo en cualquier momento y eso manda por
       encima de que le quede disponible. */
    expect(puedeComprarACredito(cupo, "suspendido", 1000)).toEqual({
      puede: false,
      motivo: "suspendido",
    });
  });

  it("rechaza montos que no son dinero entero y positivo", () => {
    for (const malo of [0, -5000, 1500.5, NaN, Infinity]) {
      expect(
        puedeComprarACredito(cupo, "activo", malo).puede,
        `aceptó ${malo}`,
      ).toBe(false);
    }
  });
});

describe("el vencimiento", () => {
  it("suma los días de plazo", () => {
    const vence = fechaVencimiento(AHORA, 30);
    expect(vence.getTime()).toBe(AHORA + 30 * DIA);
  });

  it("nunca vence el mismo día ni antes", () => {
    /* Un plazo de cero o negativo dejaría el pedido vencido en el momento de
       comprarlo. */
    for (const dias of [0, -10]) {
      expect(fechaVencimiento(AHORA, dias).getTime()).toBeGreaterThan(AHORA);
    }
  });

  it("cuenta los días que faltan", () => {
    expect(diasParaVencer(AHORA + 7 * DIA, AHORA)).toBe(7);
  });

  it("cuenta en negativo los días que ya pasaron", () => {
    expect(diasParaVencer(AHORA - 3 * DIA, AHORA)).toBe(-3);
  });
});

describe("el estado de un pedido a crédito", () => {
  const vence = AHORA + 10 * DIA;

  it("abierto mientras deba y no se pase la fecha", () => {
    const e = estadoDelPedido(
      { totalCentavos: 200_000, abonadoCentavos: 50_000 },
      vence,
      AHORA,
    );
    expect(e).toBe("abierto");
  });

  it("pagado cuando ya no debe nada", () => {
    const e = estadoDelPedido(
      { totalCentavos: 200_000, abonadoCentavos: 200_000 },
      vence,
      AHORA,
    );
    expect(e).toBe("pagado");
  });

  it("vencido si pasó la fecha y todavía debe", () => {
    const e = estadoDelPedido(
      { totalCentavos: 200_000, abonadoCentavos: 50_000 },
      AHORA - DIA,
      AHORA,
    );
    expect(e).toBe("vencido");
  });

  it("PAGADO GANA SOBRE VENCIDO", () => {
    /* Terminó de abonar un día tarde. Marcarlo "vencido" cuando ya no debe
       nada sería decirle que está en falta a alguien que cumplió. */
    const e = estadoDelPedido(
      { totalCentavos: 200_000, abonadoCentavos: 200_000 },
      AHORA - DIA,
      AHORA,
    );
    expect(e).toBe("pagado");
  });
});

describe("la barra de avance del cliente", () => {
  it("da el porcentaje abonado", () => {
    expect(
      porcentajeAbonado({ totalCentavos: 200_000, abonadoCentavos: 170_000 }),
    ).toBe(85);
  });

  it("nunca se sale de 0 a 100", () => {
    expect(
      porcentajeAbonado({ totalCentavos: 200_000, abonadoCentavos: 0 }),
    ).toBe(0);
    expect(
      porcentajeAbonado({ totalCentavos: 200_000, abonadoCentavos: 500_000 }),
    ).toBe(100);
  });

  it("un total de cero no pinta NaN en la pantalla", () => {
    expect(porcentajeAbonado({ totalCentavos: 0, abonadoCentavos: 0 })).toBe(
      100,
    );
  });
});

describe("el ejemplo del documento que aprobó el abogado", () => {
  it("los números del PDF cuadran exactamente", () => {
    /* Página 4 del PDF: cupo de $2.000, compra de $2.000, y abonos de $500,
       $1.200 y $300. Si esta prueba se pone roja, el sistema dejó de hacer lo
       que se le prometió por escrito a un comercio. */
    const TOPE = 200_000; // $2.000
    const total = 200_000;

    const dia1 = calcularCupo(TOPE, [
      { totalCentavos: total, abonadoCentavos: 0 },
    ]);
    expect(dia1.disponibleCentavos).toBe(0);

    const trasPrimerAbono = calcularCupo(TOPE, [
      { totalCentavos: total, abonadoCentavos: 50_000 },
    ]);
    expect(trasPrimerAbono.disponibleCentavos).toBe(50_000); // $500

    const trasSegundo = calcularCupo(TOPE, [
      { totalCentavos: total, abonadoCentavos: 170_000 },
    ]);
    expect(trasSegundo.disponibleCentavos).toBe(170_000); // $1.700
    expect(
      pendienteDePedido({ totalCentavos: total, abonadoCentavos: 170_000 }),
    ).toBe(30_000); // debe $300

    const trasTercero = calcularCupo(TOPE, [
      { totalCentavos: total, abonadoCentavos: 200_000 },
    ]);
    expect(trasTercero.disponibleCentavos).toBe(200_000); // cupo entero otra vez
  });
});
