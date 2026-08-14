import { describe, expect, it } from "vitest";

import {
  motivoSinBotonDeEntrega,
  puedeMarcarEntrega,
} from "@/lib/pedidos/quien-entrega";

/**
 * QUIÉN MARCA UNA ENTREGA.
 *
 * El motivo de esta regla, en palabras del dueño: si el equipo de Mercatren
 * pulsa «entregado» por error, el comprador llama al comercio reclamándole una
 * entrega que nunca ocurrió. El sistema mete a dos personas en una discusión
 * por algo que no hizo ninguna de las dos.
 */

describe("quién puede marcar entregado", () => {
  it("el comercio que vendió, que es quien tiene la mercancía", () => {
    expect(puedeMarcarEntrega("vendedor")).toBe(true);
  });

  it("Soporte NO, aunque sea el dueño de la plataforma", () => {
    /* No entrega nada. Marcarlo por él sería firmar en su nombre. */
    expect(puedeMarcarEntrega("soporte")).toBe(false);
  });

  it("un validador tampoco", () => {
    /* Revisa comprobantes de pago; la mercancía no pasa por sus manos. */
    expect(puedeMarcarEntrega("validador")).toBe(false);
  });

  it("un cliente, ni hablar", () => {
    expect(puedeMarcarEntrega("cliente")).toBe(false);
  });

  it("sin sesión, no", () => {
    expect(puedeMarcarEntrega(null)).toBe(false);
    expect(puedeMarcarEntrega(undefined)).toBe(false);
    expect(puedeMarcarEntrega("")).toBe(false);
  });

  it("un rol que nadie ha visto NO hereda el permiso", () => {
    /* Si mañana se agrega un rol y se olvida esta lista, lo seguro es que no
       pueda — no que pueda por descuido. */
    expect(puedeMarcarEntrega("loQueSea")).toBe(false);
  });
});

describe("por qué no se le enseña el botón", () => {
  it("al equipo se le dice que no entrega mercancía", () => {
    expect(motivoSinBotonDeEntrega("soporte")).toBe("no_entrega_mercancia");
    expect(motivoSinBotonDeEntrega("validador")).toBe("no_entrega_mercancia");
  });

  it("a quien sí puede, no hay nada que explicarle", () => {
    expect(motivoSinBotonDeEntrega("vendedor")).toBeNull();
  });
});
