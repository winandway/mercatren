import { describe, expect, it } from "vitest";

import {
  ENVIO_ESTIMADO_CENTAVOS,
  envioAUsar,
  precioSinEnvio,
} from "@/lib/destino/envio-us";
import { desglosarUs } from "@/lib/destino/precio-us";

/**
 * EL CANDADO DE DINERO DE ESTE BLOQUE.
 *
 * Si algo de aquí se pone rojo, los productos vuelven a publicarse con el
 * envío en cero — que es el fallo que se encontró el 19 ago 2026 y que hacía
 * que una venta dejara $0.82 en vez de $3.09, sin que se viera en ninguna
 * pantalla.
 */

describe("qué envío se mete en el precio", () => {
  it("si el proveedor cotiza, se usa lo que dijo", () => {
    const r = envioAUsar({ costoCentavos: 157, transporte: "USPS+" });
    expect(r.costoCentavos).toBe(157);
    expect(r.origen).toBe("cotizado");
    expect(r.transporte).toBe("USPS+");
  });

  it("EL RESPALDO NUNCA ES CERO", () => {
    /* La regla que manda. Volver a cero «porque es lo que había antes» es
       reproducir el fallo: se regala el margen en cada venta, para siempre y
       en silencio. */
    for (const caso of [
      {},
      { costoCentavos: null },
      { costoCentavos: undefined },
      { costoCentavos: Number.NaN },
      { costoCentavos: -100 },
    ]) {
      const r = envioAUsar(caso);
      expect(r.costoCentavos).toBeGreaterThan(0);
      expect(r.origen).toBe("estimado");
    }
  });

  it("un CERO cotizado tampoco se toma por bueno", () => {
    /* Ningún transportista lleva nada gratis: un cero significa respuesta
       vacía o mal leída. */
    const r = envioAUsar({ costoCentavos: 0, transporte: "USPS+" });
    expect(r.costoCentavos).toBe(ENVIO_ESTIMADO_CENTAVOS);
    expect(r.origen).toBe("estimado");
  });

  it("lo estimado se marca como estimado, para poder volver a mirarlo", () => {
    expect(envioAUsar({}).origen).toBe("estimado");
    expect(envioAUsar({ costoCentavos: 200 }).origen).toBe("cotizado");
  });
});

describe("el precio con envío dentro", () => {
  /* El caso medido de verdad: MT-000004, envío $1.57. */
  const COSTO = 1000; // $10 de producto
  const ENVIO_REAL = 157;

  it("PUBLICAR CON CERO Y PAGAR EL ENVÍO DE VERDAD ES LO QUE COMÍA EL MARGEN", () => {
    /* Aquí está el fallo, dicho con números.
       El margen NO baja al meter el envío en el cálculo: al revés, sube, porque
       el 30 % se aplica también sobre el flete. Lo que pasaba era peor y más
       callado: se publicaba el precio como si el envío fuera cero, y después
       CJ cobraba el envío igual. Ese dinero salía del margen sin aparecer en
       ninguna pantalla. */
    const bien = desglosarUs(COSTO, ENVIO_REAL);

    const comoSePublicaba = desglosarUs(COSTO, 0);
    const margenQueDeVerdadQuedaba =
      comoSePublicaba.publicadoCentavos -
      comoSePublicaba.procesadorCentavos -
      COSTO -
      ENVIO_REAL;

    expect(margenQueDeVerdadQuedaba).toBeLessThan(bien.margenCentavos);

    /* Y la diferencia es justo el envío más su parte del recargo: no es un
       redondeo, es plata. */
    expect(bien.margenCentavos - margenQueDeVerdadQuedaba).toBeGreaterThan(
      ENVIO_REAL,
    );
  });

  it("los renglones suman el publicado, al centavo", () => {
    /* Un centavo que no cuadra en una pantalla de dinero rompe la confianza
       en todo lo demás. */
    const d = desglosarUs(COSTO, ENVIO_REAL);
    expect(
      d.costoProductoCentavos +
        d.costoEnvioCentavos +
        d.procesadorCentavos +
        d.margenCentavos,
    ).toBe(d.publicadoCentavos);
  });

  it("con el envío dentro, el comprador paga más y el margen se respeta", () => {
    const d = desglosarUs(COSTO, ENVIO_REAL);
    expect(d.publicadoCentavos).toBeGreaterThan(
      desglosarUs(COSTO, 0).publicadoCentavos,
    );
    expect(d.costoEnvioCentavos).toBe(ENVIO_REAL);
  });
});

describe("el candado: reconocer un precio armado sin envío", () => {
  it("cero y nulo son «sin envío»", () => {
    expect(precioSinEnvio(0)).toBe(true);
    expect(precioSinEnvio(null)).toBe(true);
    expect(precioSinEnvio(-1)).toBe(true);
  });

  it("cualquier envío de verdad no lo es", () => {
    expect(precioSinEnvio(157)).toBe(false);
    expect(precioSinEnvio(ENVIO_ESTIMADO_CENTAVOS)).toBe(false);
  });

  it("lo que sale de envioAUsar NUNCA es «sin envío»", () => {
    /* La garantía completa, dicha de una vez: pase lo que pase con el
       proveedor, del cálculo no puede salir un precio sin envío. */
    for (const caso of [
      {},
      { costoCentavos: 0 },
      { costoCentavos: null },
      { costoCentavos: 157 },
    ]) {
      expect(precioSinEnvio(envioAUsar(caso).costoCentavos)).toBe(false);
    }
  });
});
