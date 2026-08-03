import { describe, expect, it } from "vitest";

import { comercioEfectivo, type Alcance } from "@/lib/alcance";

/**
 * Mercatren da servicio a muchos comercios a la vez. Lo mas grave que puede
 * pasar es que un comercio vea los pagos de otro. Estas pruebas cuidan esa
 * puerta.
 */

const equipo: Alcance = { tipo: "todos", rol: "soporte" };
const comercioA: Alcance = {
  tipo: "tienda",
  rol: "vendedor",
  tiendaId: "tienda-a",
};

describe("un comercio solo puede ver lo suyo", () => {
  it("ignora el comercio que venga pedido en la direccion", () => {
    expect(comercioEfectivo(comercioA, "tienda-b")).toBe("tienda-a");
  });

  it("sigue siendo el suyo aunque no pidan ninguno", () => {
    expect(comercioEfectivo(comercioA)).toBe("tienda-a");
    expect(comercioEfectivo(comercioA, null)).toBe("tienda-a");
    expect(comercioEfectivo(comercioA, "")).toBe("tienda-a");
  });

  it("nunca devuelve nada, que significaria ver todos los comercios", () => {
    const intentos = ["tienda-b", "", null, undefined, "TIENDA-A"];
    for (const intento of intentos) {
      expect(comercioEfectivo(comercioA, intento)).toBe("tienda-a");
    }
  });
});

describe("el equipo de Mercatren ve la operacion completa", () => {
  it("sin filtro, ve todos los comercios", () => {
    expect(comercioEfectivo(equipo)).toBeNull();
    expect(comercioEfectivo(equipo, "")).toBeNull();
  });

  it("puede mirar el comercio que elija", () => {
    expect(comercioEfectivo(equipo, "tienda-b")).toBe("tienda-b");
  });
});
