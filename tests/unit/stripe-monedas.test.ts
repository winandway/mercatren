import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { montoDesdeStripe, montoParaStripe } from "@/lib/stripe/monedas";

/**
 * LA ADUANA DE MONTOS CON STRIPE (30 ago 2026).
 *
 * La MT-000010 (65.423 COP) no se podía pagar: Stripe trata el peso
 * colombiano CON dos decimales y el nuestro va en pesos enteros — el intento
 * le llegó como 654,23 pesos (~16 centavos de dólar), bajo su mínimo, y
 * murió al crearse. El chileno SÍ es cero-decimales para Stripe: la
 * suposición de que eran iguales fue el fallo entero.
 */
describe("la aduana de montos con Stripe", () => {
  it("EL CASO MT-000010: 65.423 COP viajan como 6.542.300 y vuelven enteros", () => {
    expect(montoParaStripe(65_423, "COP")).toBe(6_542_300);
    expect(montoDesdeStripe(6_542_300, "COP")).toBe(65_423);
  });

  it("el peso chileno viaja tal cual — para Stripe no tiene decimales", () => {
    expect(montoParaStripe(96_742, "CLP")).toBe(96_742);
    expect(montoDesdeStripe(96_742, "CLP")).toBe(96_742);
  });

  it("el dólar viaja tal cual — centavos de los dos lados", () => {
    expect(montoParaStripe(3_187, "USD")).toBe(3_187);
    expect(montoDesdeStripe(3_187, "USD")).toBe(3_187);
  });

  it("ida y vuelta nunca pierde un peso", () => {
    for (const moneda of ["USD", "CLP", "COP"]) {
      for (const monto of [1, 199, 65_423, 96_742, 12_345_678]) {
        expect(montoDesdeStripe(montoParaStripe(monto, moneda), moneda)).toBe(
          monto,
        );
      }
    }
  });

  it("LOS CUATRO CRUCES CON STRIPE PASAN POR LA ADUANA", () => {
    /* Crear el intento y reusarlo, conciliar, el webhook y devolver. Un
       `amount` crudo en cualquiera es la MT-000010 otra vez. */
    const acciones = readFileSync("src/lib/stripe/acciones.ts", "utf-8");
    expect(acciones).toContain("amount: montoParaStripe(");
    expect(acciones).not.toContain("amount: pedido.totalCentavos,");
    const conciliar = readFileSync("src/lib/stripe/conciliar.ts", "utf-8");
    expect(conciliar).toContain("montoDesdeStripe(enStripe.amount");
    const webhook = readFileSync("src/app/datos/stripe/route.ts", "utf-8");
    expect(webhook).toContain("montoDesdeStripe(intento.amount");
    const devolver = readFileSync("src/lib/stripe/devolver.ts", "utf-8");
    expect(devolver).toContain("montoParaStripe(centavos");
  });

  it("y el pago fallido se escucha y se anota — antes no dejaba rastro", () => {
    const webhook = readFileSync("src/app/datos/stripe/route.ts", "utf-8");
    expect(webhook).toContain("payment_intent.payment_failed");
    expect(webhook).toContain("anotarEnBitacora");
  });
});
