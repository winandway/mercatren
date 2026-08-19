import { describe, expect, it } from "vitest";

import {
  estadoParaMostrar,
  generarEnlace,
  DIAS_DE_VIDA_MAXIMO,
  DIAS_DE_VIDA_POR_DEFECTO,
  diasDeVida,
  MAXIMO_CENTAVOS,
  MINIMO_CENTAVOS,
  revisarPeticion,
  sePuedePagar,
  venceEn,
} from "@/lib/cobros/reglas";

const AHORA = new Date("2026-08-10T12:00:00Z");
const enHoras = (n: number) => new Date(AHORA.getTime() + n * 3_600_000);

const buena = {
  montoCentavos: 5_000,
  referencia: "F-00123",
  correo: "cliente@ejemplo.com",
  nombre: "Cliente",
};

describe("lo que manda el sistema del comercio", () => {
  it("una petición completa pasa", () => {
    expect(revisarPeticion(buena)).toEqual([]);
  });

  it("sin referencia de factura no se acepta", () => {
    /* Sin ella, cuando el cliente llame preguntando por su pago, nadie sabe de
       qué venta habla. */
    expect(revisarPeticion({ ...buena, referencia: "  " })).toContain(
      "sinReferencia",
    );
  });

  it("sin correo no se puede mandar el enlace", () => {
    expect(revisarPeticion({ ...buena, correo: "" })).toContain("sinContacto");
  });

  it("un correo mal escrito se rechaza", () => {
    expect(
      revisarPeticion({ ...buena, correo: "esto-no-es-correo" }),
    ).toContain("contactoInvalido");
  });

  it("el nombre es opcional", () => {
    const { nombre: _, ...sinNombre } = buena;
    expect(revisarPeticion(sinNombre)).toEqual([]);
  });
});

describe("el monto", () => {
  it("por debajo del mínimo no se acepta", () => {
    /* En $0.50 Stripe se lleva $0.31: cobrar eso es trabajar gratis y encima
       quedar mal. */
    expect(revisarPeticion({ ...buena, montoCentavos: 50 })).toContain(
      "montoMuyBajo",
    );
    expect(
      revisarPeticion({ ...buena, montoCentavos: MINIMO_CENTAVOS }),
    ).toEqual([]);
  });

  it("por encima del máximo tampoco", () => {
    // Freno contra el dedo pegado en el teclado.
    expect(
      revisarPeticion({ ...buena, montoCentavos: MAXIMO_CENTAVOS + 1 }),
    ).toContain("montoMuyAlto");
  });

  it("un monto con decimales no es un monto", () => {
    // Todo el dinero del proyecto va en centavos ENTEROS.
    expect(revisarPeticion({ ...buena, montoCentavos: 100.5 })).toContain(
      "montoInvalido",
    );
  });

  it("cero o negativo tampoco", () => {
    for (const m of [0, -100]) {
      expect(revisarPeticion({ ...buena, montoCentavos: m })).toContain(
        "montoInvalido",
      );
    }
  });

  it("un monto que no es número se rechaza sin reventar", () => {
    expect(
      revisarPeticion({ ...buena, montoCentavos: "mil" as unknown as number }),
    ).toContain("montoInvalido");
  });
});

describe("cuánto dura el enlace", () => {
  /**
   * ERAN 48 HORAS Y ESTABA MAL (19 ago 2026).
   *
   * Lo reportó el comercio piloto con el caso medido: en un abono de una
   * ferretería del interior de Venezuela la cadena es de tres personas, y quien
   * paga muchas veces tiene que hablar con un familiar en Estados Unidos.
   * **Tardan hasta una semana en cerrar un pago.**
   */
  it("por defecto dura una semana", () => {
    expect(venceEn(AHORA).getTime()).toBe(
      enHoras(DIAS_DE_VIDA_POR_DEFECTO * 24).getTime(),
    );
  });

  it("el comercio puede pedir otro plazo", () => {
    expect(venceEn(AHORA, 3).getTime()).toBe(enHoras(72).getTime());
    expect(venceEn(AHORA, 15).getTime()).toBe(enHoras(360).getTime());
  });

  it("lo que se pase del techo se recorta, NO tumba el cobro", () => {
    /* Quien pide 30 días quiere que dure mucho, no que su venta se caiga por
       un número. Se le da el máximo y se sigue. */
    expect(diasDeVida(30)).toBe(DIAS_DE_VIDA_MAXIMO);
    expect(diasDeVida(9999)).toBe(DIAS_DE_VIDA_MAXIMO);
  });

  it("un dato raro cae en el defecto, nunca deja el cobro sin vencimiento", () => {
    expect(diasDeVida(undefined)).toBe(DIAS_DE_VIDA_POR_DEFECTO);
    expect(diasDeVida(null)).toBe(DIAS_DE_VIDA_POR_DEFECTO);
    expect(diasDeVida("siete")).toBe(DIAS_DE_VIDA_POR_DEFECTO);
    expect(diasDeVida(0)).toBe(DIAS_DE_VIDA_POR_DEFECTO);
    expect(diasDeVida(-5)).toBe(DIAS_DE_VIDA_POR_DEFECTO);
  });

  it("acepta el texto de un JSON, que es como llega de verdad", () => {
    /* Los sistemas de los comercios mandan números como texto más a menudo de
       lo que uno cree. Rechazarlos sería rechazar cobros buenos. */
    expect(diasDeVida("10")).toBe(10);
  });

  it("los decimales se truncan hacia abajo", () => {
    expect(diasDeVida(7.9)).toBe(7);
  });
});

/**
 * EL VENCIMIENTO SE CALCULA, NO SE GUARDA.
 *
 * Un estado `vencido` guardado depende de que algo lo escriba a tiempo. Si ese
 * algo falla, un enlace caducado sigue diciendo que se puede pagar — y alguien
 * paga una venta que el comercio ya dio por perdida.
 */
describe("el estado que ve quien abre el enlace", () => {
  it("dentro del plazo, abierto", () => {
    expect(estadoParaMostrar("abierto", enHoras(10), AHORA)).toBe("abierto");
  });

  it("pasado el plazo, vencido, aunque en la base diga abierto", () => {
    expect(estadoParaMostrar("abierto", enHoras(-1), AHORA)).toBe("vencido");
  });

  it("justo en el segundo del vencimiento ya está vencido", () => {
    expect(estadoParaMostrar("abierto", AHORA, AHORA)).toBe("vencido");
  });

  it("lo ya pagado no vence por el paso del tiempo", () => {
    /* Sería absurdo y peligroso: un cobro pagado hace tres días no puede
       aparecer como caducado. */
    expect(estadoParaMostrar("pagado", enHoras(-100), AHORA)).toBe("pagado");
  });

  it("lo cancelado se queda cancelado", () => {
    expect(estadoParaMostrar("cancelado", enHoras(10), AHORA)).toBe(
      "cancelado",
    );
  });

  it("sin fecha de vencimiento no vence solo", () => {
    expect(estadoParaMostrar("abierto", null, AHORA)).toBe("abierto");
  });
});

describe("cuándo se puede pagar", () => {
  it("solo si sigue abierto y en plazo", () => {
    expect(sePuedePagar("abierto", enHoras(1), AHORA)).toBe(true);
    expect(sePuedePagar("abierto", enHoras(-1), AHORA)).toBe(false);
    expect(sePuedePagar("pagado", enHoras(1), AHORA)).toBe(false);
    expect(sePuedePagar("cancelado", enHoras(1), AHORA)).toBe(false);
  });
});

/**
 * EL ENLACE ES UN SECRETO APARTE.
 *
 * No puede ser el identificador del cobro: ese aparece en el sistema del
 * comercio, en sus registros y en sus pantallas, y cualquiera que lo viera
 * podría abrir el cobro de otro.
 */
describe("el enlace", () => {
  it("es largo y hexadecimal", () => {
    expect(generarEnlace()).toMatch(/^[0-9a-f]{48}$/);
  });

  it("no se repite", () => {
    const muchos = new Set(Array.from({ length: 200 }, () => generarEnlace()));
    expect(muchos.size).toBe(200);
  });
});
