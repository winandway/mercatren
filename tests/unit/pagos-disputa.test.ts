import { describe, expect, it } from "vitest";

import {
  diasParaResponder,
  esUrgente,
  estadoDesdeStripe,
  sigueAbierta,
} from "@/lib/pagos/disputa";

const HOY = new Date("2026-08-10T12:00:00Z");
const enDias = (n: number) => new Date(HOY.getTime() + n * 86_400_000);

describe("cómo llama Stripe a cada desenlace", () => {
  it("won es ganada y lost es perdida", () => {
    expect(estadoDesdeStripe("won")).toBe("ganada");
    expect(estadoDesdeStripe("lost")).toBe("perdida");
  });

  it("un aviso previo cerrado se cuenta como retirada", () => {
    // No llegó a disputa formal: no hay nada que responder y no salió dinero.
    expect(estadoDesdeStripe("warning_closed")).toBe("retirada");
  });

  it("todo lo demás está abierta", () => {
    for (const e of [
      "needs_response",
      "under_review",
      "warning_needs_response",
      "warning_under_review",
    ]) {
      expect(estadoDesdeStripe(e)).toBe("abierta");
    }
  });

  it("ante un estado desconocido, abierta", () => {
    /* Que alguien la mire es el error barato; darla por cerrada sola es el
       caro. */
    expect(estadoDesdeStripe("algo_nuevo_de_stripe")).toBe("abierta");
    expect(estadoDesdeStripe(null)).toBe("abierta");
  });
});

describe("si todavía se puede hacer algo", () => {
  it("solo una abierta admite pruebas", () => {
    expect(sigueAbierta("abierta")).toBe(true);
    for (const e of ["ganada", "perdida", "retirada"] as const) {
      expect(sigueAbierta(e)).toBe(false);
    }
  });
});

describe("cuántos días quedan para responder", () => {
  it("cuenta los días que faltan", () => {
    expect(diasParaResponder(enDias(7), HOY)).toBe(7);
  });

  it("una vencida da 0, nunca un número negativo", () => {
    expect(diasParaResponder(enDias(-5), HOY)).toBe(0);
  });

  it("sin fecha límite devuelve null, NO cero", () => {
    /* Cero significa «hoy es el último día», que es una alarma. Confundir
       «no sé» con «se acaba hoy» hace correr al equipo sin motivo — o, peor,
       deja de hacerlo correr cuando sí toca. */
    expect(diasParaResponder(null, HOY)).toBeNull();
  });
});

describe("cuándo hay que gritar", () => {
  it("abierta con tres días o menos es urgente", () => {
    expect(esUrgente("abierta", 3)).toBe(true);
    expect(esUrgente("abierta", 0)).toBe(true);
  });

  it("abierta con margen no lo es", () => {
    expect(esUrgente("abierta", 10)).toBe(false);
  });

  it("abierta SIN fecha límite también es urgente", () => {
    // No saber cuánto queda es motivo de mirarlo, no de dejarlo pasar.
    expect(esUrgente("abierta", null)).toBe(true);
  });

  it("una cerrada nunca es urgente, aunque no tenga fecha", () => {
    for (const e of ["ganada", "perdida", "retirada"] as const) {
      expect(esUrgente(e, null)).toBe(false);
      expect(esUrgente(e, 0)).toBe(false);
    }
  });
});
