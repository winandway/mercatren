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

describe("el intento de pago no se sombrea a sí mismo", () => {
  it("EL CREATE ASIGNA LA VARIABLE DE AFUERA, jamás un const interior", () => {
    /* El 30 ago 2026 un `const intento` DENTRO del try sombreó la variable
       exterior: el cobro se creaba perfecto en Stripe y la función devolvía
       «falló» — toda compra con tarjeta rota una noche (MT-000011), con el
       cliente leyendo «revisa tu tarjeta» sin haberla escrito. */
    const fuente = readFileSync("src/lib/stripe/acciones.ts", "utf-8");
    expect(fuente).toContain("intento = await stripe.paymentIntents.create(");
    expect(fuente).not.toContain(
      "const intento = await stripe.paymentIntents.create(",
    );
  });
});

describe("la compra al proveedor deja rastro", () => {
  it("EL MOTIVO DEL FALLO SE ESCRIBE — no se tira (31 ago 2026)", () => {
    /* El resultado de comprarAlProveedor se ignoraba: una venta cobrada en
       Stripe y cero pedidos en CJ, sin saber por qué. Ahora el motivo
       exacto queda en la bitácora del pedido, salga bien o mal. */
    const fuente = readFileSync("src/lib/stripe/acreditar.ts", "utf-8");
    expect(fuente).toContain("const compra = await comprarAlProveedor(");
    expect(fuente).toContain("compra_proveedor_creada");
    expect(fuente).toContain("compra_proveedor_fallo");
    expect(fuente).toContain("detalle: compra.ok");
  });

  it("y el canario dice si la llave del proveedor sigue viva", () => {
    const fuente = [
      readFileSync("src/app/datos/salud/route.ts", "utf-8"),
      readFileSync("src/lib/salud/piezas.ts", "utf-8"),
    ].join("\n");
    expect(fuente).toContain("saludDelProveedor");
    expect(fuente).toContain("sin_llave");
    /* Ni un carácter del token sale del canario. */
    expect(fuente).not.toContain("CJ_API_KEY");
  });

  it("y también si el AVISO de Stripe está armado (31 ago 2026)", () => {
    /* Sin ese webhook, los cobros entran al banco y los pedidos se quedan
       en «esperando el pago» sin un solo error en pantalla — la regla
       global de pagos exige que el canario lo vigile. */
    const fuente = [
      readFileSync("src/app/datos/salud/route.ts", "utf-8"),
      readFileSync("src/lib/salud/piezas.ts", "utf-8"),
    ].join("\n");
    expect(fuente).toContain("avisoDeStripeArmado");
    expect(fuente).toContain("avisoStripe");
    expect(fuente).toContain('"sin_secreto"');
    expect(fuente).toContain('"sin_evento"');
    /* Solo lectura: la lista de webhooks, jamás crear ni borrar nada. */
    expect(fuente).toContain("webhook_endpoints?limit=16");
    expect(fuente).not.toMatch(
      /method:\s*"POST"[\s\S]{0,200}webhook_endpoints/,
    );
  });
});
