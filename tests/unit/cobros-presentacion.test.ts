import { describe, expect, it } from "vitest";

import {
  esModoDeCobro,
  modoPedido,
  queSeEnsena,
} from "@/lib/cobros/presentacion";

const COMERCIO = "Ferremateriales Bley C.A";

describe("el cobro de siempre nombra al comercio", () => {
  it("se ve arriba y en el pie", () => {
    /* Ver el nombre de su ferretería es lo que le da confianza al cliente para
       pagar. Quitarlo haría que dejaran de pagar los cobros que hoy funcionan. */
    const v = queSeEnsena("comercio", COMERCIO);
    expect(v.comercio).toBe(COMERCIO);
    expect(v.nombrarEnElPie).toBe(true);
  });

  it("y ese es el comportamiento cuando no se pide nada", () => {
    /* Un cobro de antes de que esto existiera no puede quedarse sin nombre de
       un día para otro. */
    expect(queSeEnsena(null, COMERCIO).comercio).toBe(COMERCIO);
    expect(queSeEnsena(undefined, COMERCIO).comercio).toBe(COMERCIO);
  });
});

describe("el modo callado no nombra a NADIE más que a Mercatren", () => {
  /**
   * EL CASO REAL (19 ago 2026): Bley le fía a la Ferretería B, y quien paga es
   * un cliente de la Ferretería B. Ese cliente le compró a B, no a Bley.
   *
   * Nombrar a Bley le enseña un negocio con el que no tiene nada que ver. Y
   * nombrar a B le cuenta a su propio cliente a quién le compra y cuánto le
   * debe — información comercial de B que no es nuestra para repartirla.
   */
  it("no sale el comercio ni arriba ni en el pie", () => {
    const v = queSeEnsena("solo_mercatren", COMERCIO);
    expect(v.comercio).toBeNull();
    expect(v.nombrarEnElPie).toBe(false);
  });

  it("el nombre del comercio NO viaja aunque se lo pasen", () => {
    /* La función recibe el nombre y aun así devuelve null: así el nombre no
       llega al navegador ni escondido en el HTML. */
    const v = queSeEnsena("solo_mercatren", COMERCIO);
    expect(JSON.stringify(v)).not.toContain("Bley");
  });

  it("PERO la referencia se sigue viendo, y es imprescindible", () => {
    /* Sin nombre y sin referencia queda una pantalla que pide dinero sin decir
       por qué. Eso es exactamente como se ve una estafa. */
    expect(queSeEnsena("solo_mercatren", COMERCIO).mostrarReferencia).toBe(true);
    expect(queSeEnsena("comercio", COMERCIO).mostrarReferencia).toBe(true);
  });
});

describe("lo que llega de fuera", () => {
  it("solo se aceptan los dos modos que existen", () => {
    expect(esModoDeCobro("comercio")).toBe(true);
    expect(esModoDeCobro("solo_mercatren")).toBe(true);
    expect(esModoDeCobro("otro")).toBe(false);
    expect(esModoDeCobro(null)).toBe(false);
  });

  it("lo que no se entiende cae en el modo NORMAL, nunca en el callado", () => {
    /**
     * Si un dato mal escrito activara el modo callado, un cobro corriente
     * perdería el nombre de su ferretería y el cliente dejaría de pagarlo sin
     * que nadie supiera por qué. Al revés no pasa nada.
     */
    expect(modoPedido("cualquier cosa")).toBe("comercio");
    expect(modoPedido(undefined)).toBe("comercio");
    expect(modoPedido(true)).toBe("comercio");
    expect(modoPedido("SOLO_MERCATREN")).toBe("comercio");
  });

  it("y el callado solo se activa escribiéndolo exacto", () => {
    expect(modoPedido("solo_mercatren")).toBe("solo_mercatren");
  });
});
