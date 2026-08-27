import { describe, expect, it } from "vitest";

import {
  desglosarDesdeBruto,
  impuestoDeArticulo,
  impuestoDelCarrito,
  impuestoDelMercado,
  precioConImpuesto,
  prorratearCargos,
  topeEnMonedaLocal,
} from "@/lib/impuestos/chile";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

const CHILE = impuestoDelMercado(mercadoPorCodigo("CL"))!;

/* Una tasa redonda para que los números de las pruebas se puedan comprobar a
   mano: 1.000 pesos por dólar deja el tope en 500.000 pesos exactos. */
const MIL = 1000;

describe("qué mercados cobran impuesto", () => {
  it("Chile cobra el 19 % y trae el número del SII", () => {
    expect(CHILE.puntosBase).toBe(1900);
    expect(CHILE.topeUsdCentavos).toBe(50_000);
    expect(CHILE.numeroDeUsuario).toBe("59330700K");
  });

  it("Estados Unidos no cobra nada, y eso NO es un olvido", () => {
    /* Hoy no hay impuesto de venta en el flujo de EE. UU. Devolver `null` es lo
       que deja al checkout no dibujar un renglón de impuestos en cero. */
    expect(impuestoDelMercado(mercadoPorCodigo("US"))).toBeNull();
  });

  it("un mercado sin regla declarada tampoco inventa una", () => {
    expect(impuestoDelMercado(mercadoPorCodigo("CO"))).toBeNull();
  });
});

describe("el tope de USD 500", () => {
  it("se convierte con la tasa del día", () => {
    expect(topeEnMonedaLocal(CHILE, MIL)).toBe(500_000);
    expect(topeEnMonedaLocal(CHILE, 967.42)).toBe(483_710);
  });

  it("USD 500,00 exactos SÍ es de bajo valor", () => {
    const r = impuestoDeArticulo({ mercancia: 500_000 }, CHILE, MIL);
    expect(r.esBajoValor).toBe(true);
    expect(r.impuesto).toBe(95_000);
  });

  it("USD 500,01 ya NO es de bajo valor y aquí no se cobra impuesto", () => {
    /* Ese artículo paga IVA MÁS arancel en la aduana, y lo asume quien recibe.
       Cobrárselo aquí también sería cobrárselo dos veces. */
    const r = impuestoDeArticulo({ mercancia: 500_001 }, CHILE, MIL);
    expect(r.esBajoValor).toBe(false);
    expect(r.impuesto).toBe(0);
    expect(r.total).toBe(500_001);
  });

  it("EL ENVÍO CUENTA para el tope, y puede sacar del régimen a un artículo", () => {
    /* Resolución 93, nota 1: el tope «incluye los cargos asociados a la compra
       del bien, tales como su envío, seguro o empaque adicional». Una
       mercancía de 499.000 con 2.000 de flete se pasa. */
    const sinFlete = impuestoDeArticulo({ mercancia: 499_000 }, CHILE, MIL);
    expect(sinFlete.esBajoValor).toBe(true);

    const conFlete = impuestoDeArticulo(
      { mercancia: 499_000, cargos: 2_000 },
      CHILE,
      MIL,
    );
    expect(conFlete.esBajoValor).toBe(false);
  });

  it("EL TOPE ES POR ARTÍCULO, NO POR CARRITO", () => {
    /* La regla que más se presta a error. Tres artículos de USD 200 suman 600
       y pasan enteros: el techo es de cada uno. Escribir esto sobre el total
       del carrito nos dejaría rechazando ventas perfectamente legales. */
    const carrito = impuestoDelCarrito(
      [{ mercancia: 200_000 }, { mercancia: 200_000 }, { mercancia: 200_000 }],
      CHILE,
      MIL,
    );
    expect(carrito.hayArticulosSobreElTope).toBe(false);
    expect(carrito.base).toBe(600_000);
    expect(carrito.impuesto).toBe(114_000);
  });

  it("los descuentos restan para el cómputo del tope", () => {
    const r = impuestoDeArticulo(
      { mercancia: 510_000, descuento: 20_000 },
      CHILE,
      MIL,
    );
    expect(r.esBajoValor).toBe(true);
    expect(r.base).toBe(490_000);
  });

  it("un descuento nunca deja la base en negativo", () => {
    /* Una base negativa sería devolverle impuesto a alguien que no pagó nada. */
    const r = impuestoDeArticulo(
      { mercancia: 1_000, descuento: 9_999 },
      CHILE,
      MIL,
    );
    expect(r.base).toBe(0);
    expect(r.impuesto).toBe(0);
  });

  it("un regalo no entra ni en el tope ni en la base", () => {
    const r = impuestoDeArticulo(
      { mercancia: 800_000, esRegalo: true },
      CHILE,
      MIL,
    );
    expect(r.base).toBe(0);
    expect(r.impuesto).toBe(0);
    expect(r.esBajoValor).toBe(true);
  });
});

describe("el carrito avisa de lo que se pasa del tope", () => {
  it("basta UN artículo por encima para levantar la bandera", () => {
    /* A ese comprador le van a cobrar IVA más arancel en la aduana, de
       sorpresa. Es lo que hay que poder avisar ANTES de cobrar. */
    const carrito = impuestoDelCarrito(
      [{ mercancia: 10_000 }, { mercancia: 600_000 }],
      CHILE,
      MIL,
    );
    expect(carrito.hayArticulosSobreElTope).toBe(true);
    /* Y el que sí es de bajo valor se cobra igual: no se castiga al resto. */
    expect(carrito.articulos[0]?.impuesto).toBe(1_900);
    expect(carrito.articulos[1]?.impuesto).toBe(0);
  });

  it("un carrito vacío no rompe nada", () => {
    const carrito = impuestoDelCarrito([], CHILE, MIL);
    expect(carrito.base).toBe(0);
    expect(carrito.impuesto).toBe(0);
    expect(carrito.hayArticulosSobreElTope).toBe(false);
  });
});

describe("prorratear el flete del pedido entre sus artículos", () => {
  it("reparte en proporción al valor", () => {
    expect(prorratearCargos(300, [100, 200])).toEqual([100, 200]);
  });

  it("LA SUMA DE LAS PARTES ES SIEMPRE EL TOTAL EXACTO", () => {
    /* El resto se reparte de a una unidad entre las primeras, nunca todo junto
       al final. Un peso que no cuadra en una declaración obliga a explicarlo. */
    for (const total of [100, 999, 1_000, 7_475, 12_345]) {
      const partes = prorratearCargos(total, [333, 333, 334]);
      expect(partes.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it("con todos los valores en cero reparte parejo, sin inventar proporción", () => {
    expect(prorratearCargos(10, [0, 0, 0])).toEqual([4, 3, 3]);
  });

  it("sin artículos devuelve una lista vacía, no un error", () => {
    expect(prorratearCargos(500, [])).toEqual([]);
  });

  it("prorratear y luego calcular da lo mismo que cobrar el flete aparte", () => {
    const cargos = prorratearCargos(3_000, [100_000, 200_000]);
    const carrito = impuestoDelCarrito(
      [
        { mercancia: 100_000, cargos: cargos[0] },
        { mercancia: 200_000, cargos: cargos[1] },
      ],
      CHILE,
      MIL,
    );
    expect(carrito.base).toBe(303_000);
  });
});

describe("el precio se enseña con IVA incluido, como en cualquier tienda chilena", () => {
  it("el neto y el impuesto SIEMPRE suman el bruto exacto", () => {
    /* Calcular las dos partes por separado deja un peso suelto una de cada
       tantas, y un peso que no cuadra rompe la confianza en toda la pantalla. */
    for (let bruto = 1; bruto <= 5_000; bruto += 7) {
      const d = desglosarDesdeBruto(bruto, CHILE);
      expect(d.neto + d.impuesto).toBe(bruto);
    }
  });

  it("un neto de 100.000 se enseña en 119.000", () => {
    expect(precioConImpuesto(100_000, CHILE)).toBe(119_000);
  });

  it("enseñar y desglosar son la vuelta el uno del otro", () => {
    for (const neto of [1_000, 9_990, 23_450, 199_999]) {
      const bruto = precioConImpuesto(neto, CHILE);
      expect(desglosarDesdeBruto(bruto, CHILE).neto).toBe(neto);
    }
  });
});
