import { describe, expect, it } from "vitest";

import {
  dejaMargenSuficiente,
  desglosarUs,
  MARGEN_MINIMO_CENTAVOS,
  precioPublicadoUs,
} from "@/lib/destino/precio-us";
import { COMISION_US_PB, precioConAjusteCentavos } from "@/lib/dinero";

/**
 * EL PRECIO DE UN PRODUCTO DE ESTADOS UNIDOS.
 *
 * El envío va gratis con su costo DENTRO del precio: es lo que espera un
 * comprador estadounidense y lo que Merchant Center enseña como etiqueta. Lo
 * que se vigila aquí es que los renglones cuadren al centavo — un centavo que
 * no cuadra en una pantalla de dinero rompe la confianza en todo lo demás.
 */

describe("el precio publicado", () => {
  it("el envío entra en el costo, no se cobra aparte", () => {
    /* Un producto de $10 con $4 de envío se publica igual que uno de $14 sin
       envío: para la fórmula es el mismo costo de poner la cosa en la puerta. */
    expect(precioPublicadoUs(1000, 400)).toBe(precioPublicadoUs(1400, 0));
  });

  it("el margen de EE. UU. NO es el de Venezuela, y es a proposito", () => {
    /* Alla el comercio pone la mercancia y responde por ella; aqui compramos,
       despachamos y asumimos la devolucion. Es venta al por menor, no comision
       de mercado — y el estandar del dropshipping es 15-30 %, no 3 %. */
    expect(COMISION_US_PB).toBe(3000);
    expect(precioPublicadoUs(1000, 400)).toBeGreaterThan(
      precioConAjusteCentavos(1400),
    );
  });

  it("un costo de cero no inventa un precio", () => {
    /* Un producto sin precio en el origen no se publica regalado ni a $0.32
       —el fijo de Stripe—: se publica en cero y la pantalla lo descarta. */
    expect(precioPublicadoUs(0, 0)).toBe(0);
  });

  it("un costo negativo se trata como cero, no rompe la cuenta", () => {
    expect(precioPublicadoUs(-500, 0)).toBe(0);
    expect(precioPublicadoUs(1000, -300)).toBe(precioPublicadoUs(1000, 0));
  });

  it("redondea hacia arriba, nunca hacia abajo", () => {
    /* Un centavo de menos sale del margen en CADA venta, y en 300 productos
       eso no se ve en ninguna pantalla. */
    for (const costo of [199, 457, 1013, 2999, 15737]) {
      const publicado = precioPublicadoUs(costo, 0);
      expect(desglosarUs(costo, 0).margenCentavos).toBeGreaterThan(0);
      expect(Number.isInteger(publicado)).toBe(true);
    }
  });
});

describe("el desglose", () => {
  it("los cuatro renglones suman EXACTAMENTE el publicado", () => {
    /* Es la prueba que de verdad importa: producto + envío + procesador +
       margen tiene que dar el precio, siempre y sin excepciones. */
    for (const [producto, envio] of [
      [1000, 400],
      [2599, 0],
      [499, 899],
      [12345, 678],
      [99, 50],
    ]) {
      const d = desglosarUs(producto!, envio!);
      const suma =
        d.costoProductoCentavos +
        d.costoEnvioCentavos +
        d.procesadorCentavos +
        d.margenCentavos;
      expect(suma, `${producto} + ${envio}`).toBe(d.publicadoCentavos);
    }
  });

  it("el procesador se lleva su 2.9 % más los 30 centavos", () => {
    const d = desglosarUs(10_000, 0);
    expect(d.procesadorCentavos).toBe(
      Math.round((d.publicadoCentavos * 290) / 10_000) + 30,
    );
  });

  it("el costo de CJ se devuelve tal como entró", () => {
    /* No se toca: es lo que de verdad hay que pagarle al proveedor. */
    const d = desglosarUs(1234, 567);
    expect(d.costoProductoCentavos).toBe(1234);
    expect(d.costoEnvioCentavos).toBe(567);
  });
});

describe("los productos que no valen la pena", () => {
  it("uno barato NO deja margen suficiente", () => {
    /* En un producto de $2 el 3 % son 6 centavos y el fijo de Stripe son 30:
       se vende a pérdida sin que nada avise. */
    expect(dejaMargenSuficiente(200, 0)).toBe(false);
  });

  it("uno normal deja un margen de verdad", () => {
    /* $25 + $5 de envio se publica a $45.16 y deja $13.55. Con el 3 % anterior
       dejaba 97 centavos: un contracargo se comia treinta ventas. */
    expect(dejaMargenSuficiente(2500, 500)).toBe(true);
    expect(desglosarUs(2500, 500).margenCentavos).toBe(1355);
    expect(desglosarUs(2500, 500).publicadoCentavos).toBe(4516);
  });

  it("el umbral marca los que no cubren ni una devolucion", () => {
    expect(desglosarUs(2500, 500).margenCentavos).toBeGreaterThanOrEqual(
      MARGEN_MINIMO_CENTAVOS,
    );
    expect(dejaMargenSuficiente(200, 0)).toBe(false);
  });

  it("el envio entra en el costo y sube el precio publicado", () => {
    /* Un producto de $5 con $12 de envio cuesta $17 poner en la puerta, y el
       precio sale de ahi — no del precio del producto solo. */
    const d = desglosarUs(500, 1200);
    expect(d.margenCentavos).toBeGreaterThan(0);
    expect(d.publicadoCentavos).toBeGreaterThan(1700);
  });
});
