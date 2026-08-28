import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { destinoDeEnvio } from "@/lib/cj/destino-fiscal";

describe("a qué país se le pide el despacho a CJ", () => {
  it("Estados Unidos, con su nombre completo y sin número fiscal", () => {
    /* Allá no hay régimen simplificado que declarar: el taxId va vacío, no
       `undefined`, para que el cuerpo de la petición no cambie de forma. */
    expect(destinoDeEnvio("US")).toEqual({
      codigo: "US",
      nombre: "United States",
      taxId: "",
    });
  });

  it("CHILE VIAJA CON EL NÚMERO DEL SII", () => {
    /* Resolución Ex. SII N°103 de 2025: sin ese número en el envío, la aduana
       chilena no puede saber que el IVA ya se cobró y se lo cobra otra vez al
       comprador. Paga dos veces y el que queda mal es Mercatren. */
    expect(destinoDeEnvio("CL")).toEqual({
      codigo: "CL",
      nombre: "Chile",
      taxId: "59330700K",
    });
  });

  it("un pedido sin país se trata como Estados Unidos", () => {
    /* Es lo que había antes de que existiera otro catálogo, y todos los
       pedidos viejos están así. Fallar aquí dejaría sin comprar pedidos que
       hoy funcionan. */
    for (const vacio of [null, undefined, "", "   "]) {
      expect(destinoDeEnvio(vacio)?.codigo).toBe("US");
    }
  });

  it("se acepta en minúscula y con espacios, como se escribe a mano", () => {
    expect(destinoDeEnvio(" cl ")?.codigo).toBe("CL");
    expect(destinoDeEnvio("Us")?.codigo).toBe("US");
  });

  it("LOS PEDIDOS VIEJOS GUARDAN EL NOMBRE Y SIGUEN FUNCIONANDO", () => {
    /* «United States» fue lo que se guardó en paisDestino hasta el 27 ago
       2026. Un reintento sobre un pedido de ayer no puede fallar por eso. */
    expect(destinoDeEnvio("United States")?.codigo).toBe("US");
    expect(destinoDeEnvio("UNITED STATES")?.codigo).toBe("US");
  });

  it("Colombia también viaja, sin número fiscal", () => {
    expect(destinoDeEnvio("CO")).toEqual({
      codigo: "CO",
      nombre: "Colombia",
      taxId: "",
    });
  });

  it("UN PAÍS DESCONOCIDO NO CAE EN ESTADOS UNIDOS: devuelve null", () => {
    /* Un respaldo silencioso aquí es mandar mercancía al otro lado del mundo
       y enterarse por el reclamo del comprador. */
    expect(destinoDeEnvio("VE")).toBeNull();
    expect(destinoDeEnvio("ZZ")).toBeNull();
  });
});

describe("el candado: el país no puede volver a escribirse a mano", () => {
  const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf8");

  it("el pedido a CJ NO lleva el país escrito en el código", () => {
    /* Iba `shippingCountryCode: "US"` fijo. Con eso, el primer pedido chileno
       se despacha al país equivocado con el comprador ya cobrado. */
    expect(fuente).not.toMatch(/shippingCountryCode:\s*["']/);
    expect(fuente).toContain("shippingCountryCode: destino.codigo");
  });

  it("y manda el taxId del destino", () => {
    expect(fuente).toContain("taxId: destino.taxId");
  });
});

describe("el almacén de cada plaza (China para CL/CO)", () => {
  it("CL y CO se surten de China; EE. UU. de su almacén local", async () => {
    const { almacenDeEntrega } = await import("@/lib/cj/plazas");
    expect(almacenDeEntrega("US")).toBe("US");
    expect(almacenDeEntrega("CL")).toBe("CN");
    expect(almacenDeEntrega("CO")).toBe("CN");
    /* Lo desconocido cae en EE. UU., nunca revienta. */
    expect(almacenDeEntrega("VE")).toBe("US");
  });

  it("EL PEDIDO NO LLEVA NI UN ALMACÉN ESCRITO A MANO", () => {
    /* Era `DESDE = "US"` para todo: un pedido chileno habría intentado salir
       de un almacén donde el producto no está. El origen se resuelve por
       pedido y manda en variantes, flete y fromCountryCode a la vez. */
    const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(fuente).not.toMatch(/fromCountryCode:\s*["']/);
    expect(fuente).toContain("fromCountryCode: almacen");
    expect(fuente).not.toMatch(/startCountryCode:\s*["']/);
  });
});
