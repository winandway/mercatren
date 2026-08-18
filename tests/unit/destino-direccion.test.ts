import { describe, expect, it } from "vitest";

import {
  camposDeEntrega,
  esCodigoPostalUS,
  esEstadoUS,
  ESTADOS_US,
  faltantesDeEntrega,
} from "@/lib/destino/direccion";

describe("qué pide cada destino", () => {
  it("Venezuela NO pide dirección: se retira en el depósito", () => {
    /* El sitio entero dice que se retira. Pedir calle y número haría creer
       que llevamos, y eso contradice cada ficha del catálogo. */
    const nombres = camposDeEntrega("VE").map((c) => c.nombre);
    expect(nombres).toEqual(["nombre", "telefono", "ciudad"]);
    expect(nombres).not.toContain("direccion");
    expect(nombres).not.toContain("codigoPostal");
  });

  it("Estados Unidos pide la dirección completa", () => {
    const nombres = camposDeEntrega("US").map((c) => c.nombre);
    expect(nombres).toEqual([
      "nombre",
      "telefono",
      "direccion",
      "direccion2",
      "ciudad",
      "estado",
      "codigoPostal",
    ]);
  });

  it("el apartamento es opcional; el estado y el código postal NO", () => {
    /* Mucha gente vive en una casa. Pero sin estado, CJ rechaza el pedido —
       `shippingProvince` es obligatorio en su API— y sin código postal el
       transportista entrega a ciegas. */
    const us = camposDeEntrega("US");
    const obligatorio = (n: string) =>
      us.find((c) => c.nombre === n)?.obligatorio;

    expect(obligatorio("direccion2")).toBe(false);
    expect(obligatorio("estado")).toBe(true);
    expect(obligatorio("codigoPostal")).toBe(true);
    expect(obligatorio("direccion")).toBe(true);
  });
});

describe("qué falta por llenar", () => {
  it("se devuelven TODOS los que faltan, no el primero", () => {
    /* Quien está comprando tiene que poder arreglarlo de una pasada. Ir de
       una casilla en una es como se abandona una compra a medias. */
    const faltan = faltantesDeEntrega("US", { nombre: "Ana" });
    expect(faltan).toEqual([
      "telefono",
      "direccion",
      "ciudad",
      "estado",
      "codigoPostal",
    ]);
  });

  it("los espacios en blanco no cuentan como lleno", () => {
    const faltan = faltantesDeEntrega("US", {
      nombre: "Ana",
      telefono: "4085550142",
      direccion: "   ",
      ciudad: "Miami",
      estado: "FL",
      codigoPostal: "33101",
    });
    expect(faltan).toEqual(["direccion"]);
  });

  it("con todo puesto no falta nada", () => {
    expect(
      faltantesDeEntrega("US", {
        nombre: "Ana",
        telefono: "4085550142",
        direccion: "500 Main St",
        ciudad: "Miami",
        estado: "FL",
        codigoPostal: "33101",
      }),
    ).toEqual([]);
  });

  it("a Venezuela no se le exige lo que no se le pide", () => {
    /* Si el destino de Venezuela heredara los campos de EE. UU., cada compra
       de la ferretería se caería pidiendo un código postal que allá nadie usa. */
    expect(
      faltantesDeEntrega("VE", {
        nombre: "Ana",
        telefono: "04141234567",
        ciudad: "Caracas",
      }),
    ).toEqual([]);
  });
});

describe("el estado de Estados Unidos", () => {
  it("están los 50 más el Distrito de Columbia", () => {
    expect(ESTADOS_US).toHaveLength(51);
  });

  it("se acepta el código, en mayúscula o minúscula", () => {
    expect(esEstadoUS("FL")).toBe(true);
    expect(esEstadoUS("fl")).toBe(true);
    expect(esEstadoUS(" MI ")).toBe(true);
  });

  it("el NOMBRE largo NO vale: CJ compara el código", () => {
    /* «Florida» no es lo mismo que «FL» para su tabla, y un estado que no
       reconocen es un pedido rechazado. Por eso se elige de una lista. */
    expect(esEstadoUS("Florida")).toBe(false);
    expect(esEstadoUS("")).toBe(false);
    expect(esEstadoUS(null)).toBe(false);
  });

  it("Hawái y Alaska están en la lista aunque el mapa no los dibuje", () => {
    /* El mapa de la ficha no los pinta porque el envío estándar no siempre
       llega — pero quien vive allá puede comprar igual. */
    expect(esEstadoUS("HI")).toBe(true);
    expect(esEstadoUS("AK")).toBe(true);
  });
});

describe("el código postal", () => {
  it("cinco dígitos, con o sin los cuatro de más", () => {
    expect(esCodigoPostalUS("33101")).toBe(true);
    expect(esCodigoPostalUS("33101-4521")).toBe(true);
    expect(esCodigoPostalUS(" 48377 ")).toBe(true);
  });

  it("lo que no tiene forma de código postal se rechaza", () => {
    expect(esCodigoPostalUS("3310")).toBe(false);
    expect(esCodigoPostalUS("ABCDE")).toBe(false);
    expect(esCodigoPostalUS("")).toBe(false);
  });
});
