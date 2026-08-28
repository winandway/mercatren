import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { metodosDelDestino } from "@/lib/destino/metodos";

/**
 * CHILE Y COLOMBIA: SOLO TARJETA (28 ago 2026).
 *
 * Palabras del dueño: «Mercatren de Chile no usa Zelle. Va a ser pura
 * tarjeta y ya está. Mercatren de Colombia también: solo tarjeta.» Zelle es
 * una red entre bancos de EE. UU.; fuera de la casa (VE/US) ni se dibuja.
 */
describe("los métodos de pago por destino", () => {
  it("CHILE Y COLOMBIA SON PURA TARJETA — Zelle ni aparece", () => {
    expect(metodosDelDestino("CL")).toEqual(["stripe"]);
    expect(metodosDelDestino("CO")).toEqual(["stripe"]);
  });

  it("Venezuela y EE. UU. conservan sus métodos de siempre, tarjeta primera", () => {
    for (const destino of ["VE", "US"] as const) {
      const metodos = metodosDelDestino(destino);
      expect(metodos[0]).toBe("stripe");
      expect(metodos).toContain("zelle");
    }
  });

  it("el checkout dibuja la lista FILTRADA, no la cruda", () => {
    const fuente = readFileSync(
      "src/components/carrito/formulario-checkout.tsx",
      "utf-8",
    );
    expect(fuente).toContain("metodosDelDestino(");
    expect(fuente).toContain("metodosVisibles.map(");
    /* Si alguien vuelve a mapear METODOS directo, Zelle reaparece en Chile
       — en gris o entero, da igual: no existe en ese país. */
    expect(fuente).not.toContain("METODOS.map(");
  });

  it("EL CANDADO DEL SERVIDOR SIGUE PUESTO — la pantalla es cortesía", () => {
    const fuente = readFileSync("src/lib/pedidos/acciones.ts", "utf-8");
    /* crearPedido rechaza Zelle fuera de VE/US aunque el formulario se salte
       con la consola. Quitar este candado dejaría la decisión del dueño
       colgando de un componente de React. */
    expect(fuente).toContain('metodoPago === "zelle" &&');
    expect(fuente).toContain('destinoDelPedido !== "VE"');
    expect(fuente).toContain('destinoDelPedido !== "US"');
    expect(fuente).toContain('t("metodoNoDisponible")');
  });
});
