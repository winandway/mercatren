import { describe, expect, it } from "vitest";

import {
  esTiendaDeLaCasa,
  llevaOrdenDeCompra,
} from "@/lib/facturas/de-la-casa";

/**
 * MT-OC-000003 salió a nombre de «Sole & Thread» con el estado «Falta tu
 * factura». Sole & Thread es una tienda NUESTRA —`us-ropa-calzado`, una de las
 * del catálogo de Estados Unidos— así que el sistema le estaba pidiendo una
 * factura a Mercatren para Mercatren.
 */

describe("qué tiendas somos nosotros", () => {
  it("las de rubro del catálogo de EE. UU.", () => {
    /* Los ids reales: «Sole & Thread» es `tienda-us-ropa-calzado`, y
       «Ridgeback Outdoors» es `tienda-us-deportes-aire-libre`. */
    expect(esTiendaDeLaCasa("tienda-us-ropa-calzado")).toBe(true);
    expect(esTiendaDeLaCasa("tienda-us-bicicletas")).toBe(true);
    expect(esTiendaDeLaCasa("tienda-us-deportes-aire-libre")).toBe(true);
  });

  it("la general y la mayorista", () => {
    expect(esTiendaDeLaCasa("tienda-mercatren-us")).toBe(true);
    /* La mayorista es `tienda-us-mayorista`: ya la captura el prefijo, y lo
       comprobamos igual para que se note si alguien le cambia el id. */
    expect(esTiendaDeLaCasa("tienda-us-mayorista")).toBe(true);
  });

  it("UN COMERCIO DE VERDAD NO", () => {
    /* Este es el que importa de los dos lados: si se pusiera rojo, dejaríamos
       de pedirle factura a un proveedor real y quedaría una compra sin
       respaldo en la contabilidad. */
    expect(esTiendaDeLaCasa("tienda-bley-ferreteria")).toBe(false);
    expect(esTiendaDeLaCasa("inversiones-multiservicios-ac0803")).toBe(false);
  });

  it("un id vacío o nulo no es de la casa", () => {
    expect(esTiendaDeLaCasa("")).toBe(false);
    expect(esTiendaDeLaCasa("   ")).toBe(false);
    expect(esTiendaDeLaCasa(null)).toBe(false);
    expect(esTiendaDeLaCasa(undefined)).toBe(false);
  });

  it("un id que solo EMPIEZA parecido tampoco engaña al revés", () => {
    /* `tienda-usados-caracas` no es `tienda-us-…`: el prefijo lleva su guion. */
    expect(esTiendaDeLaCasa("tienda-usados-caracas")).toBe(false);
  });
});

describe("a quién se le pide factura", () => {
  it("a los comercios de verdad, sí", () => {
    expect(llevaOrdenDeCompra("inversiones-multiservicios-ac0803")).toBe(true);
    expect(llevaOrdenDeCompra("tienda-bley-ferreteria")).toBe(true);
  });

  it("a nosotros mismos, no", () => {
    expect(llevaOrdenDeCompra("tienda-us-ropa-calzado")).toBe(false);
  });
});

describe("el candado en el emisor", () => {
  it("emitir salta las tiendas de la casa", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/facturas/emitir.ts", "utf8");
    const bloque = fuente.slice(
      fuente.indexOf("async function emitirOrdenesDeCompra"),
    );
    expect(
      bloque.slice(0, 1600),
      "el emisor volvió a crear órdenes de compra a nombre de tiendas nuestras",
    ).toContain("llevaOrdenDeCompra(r.tiendaId)");
  });
});
