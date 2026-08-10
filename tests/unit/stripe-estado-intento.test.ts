import { describe, expect, it } from "vitest";

import {
  cobroConfirmado,
  intentoMuerto,
  valeLaPenaPreguntar,
  type EstadoIntento,
} from "@/lib/stripe/estado-intento";

const TODOS: EstadoIntento[] = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
  "requires_capture",
  "canceled",
  "succeeded",
];

/**
 * DE ESTA DECISIÓN CUELGA QUE SE DESPACHE MERCANCÍA.
 *
 * Stripe tiene siete estados y solo uno significa que el dinero entró. Los
 * otros seis se parecen lo suficiente como para equivocarse leyendo rápido.
 */
describe("solo «succeeded» es dinero que entró", () => {
  it("succeeded sí", () => {
    expect(cobroConfirmado("succeeded")).toBe(true);
  });

  it("ningún otro estado cuenta como cobrado", () => {
    for (const estado of TODOS.filter((e) => e !== "succeeded")) {
      expect(cobroConfirmado(estado)).toBe(false);
    }
  });

  it("«processing» NO cuenta, aunque en Stripe se vea avanzando", () => {
    // Es el que más se presta a error: el cobro va en camino y aún puede fallar.
    expect(cobroConfirmado("processing")).toBe(false);
  });

  it("«requires_capture» NO cuenta: autorizado no es cobrado", () => {
    /* La tarjeta está autorizada pero el dinero no se tomó. Aquí no se usa
       autorización diferida, así que si aparece es que algo se configuró
       distinto — y ante eso, no acreditar. */
    expect(cobroConfirmado("requires_capture")).toBe(false);
  });

  it("sin estado tampoco", () => {
    expect(cobroConfirmado(null)).toBe(false);
    expect(cobroConfirmado(undefined)).toBe(false);
    expect(cobroConfirmado("")).toBe(false);
  });

  it("un estado que Stripe invente mañana no acredita nada", () => {
    // Ante lo desconocido no se mueve dinero.
    expect(cobroConfirmado("partially_funded")).toBe(false);
  });
});

describe("cuándo vale la pena volver a preguntarle a Stripe", () => {
  it("un intento a medias sí: todavía puede cambiar", () => {
    for (const estado of [
      "requires_payment_method",
      "requires_confirmation",
      "requires_action",
      "processing",
      "requires_capture",
    ]) {
      expect(valeLaPenaPreguntar(estado)).toBe(true);
    }
  });

  it("uno cobrado o cancelado no: ya no cambia más", () => {
    expect(valeLaPenaPreguntar("succeeded")).toBe(false);
    expect(valeLaPenaPreguntar("canceled")).toBe(false);
  });
});

describe("cuándo el intento está muerto", () => {
  it("solo cancelado es definitivo", () => {
    expect(intentoMuerto("canceled")).toBe(true);
  });

  it("un «requires_action» NO está muerto", () => {
    /* El comprador puede volver mañana y terminar de pagar con el mismo
       intento: es justo lo que hace `crearIntentoDePago` al reutilizarlo. */
    expect(intentoMuerto("requires_action")).toBe(false);
  });
});
