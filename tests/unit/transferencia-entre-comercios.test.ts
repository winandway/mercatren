import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { esTiendaDeLaCasa } from "@/lib/retiros/casa";

/**
 * EL RETIRO «A OTRO COMERCIO» — completo de las DOS puntas (31 ago 2026).
 *
 * Lo pidió el dueño urgente. El lado del que ENVÍA existía desde el 10 de
 * agosto; al pagarse, al receptor solo se le sumaba un espejo que ninguna
 * pantalla lee: el dinero recibido NO aparecía en su disponible ni lo podía
 * retirar. Estas pruebas fijan la otra punta.
 */
describe("el que recibe VE su dinero", () => {
  it("la posición suma lo recibido de otros comercios (quinta fuente)", () => {
    const fuente = readFileSync("src/lib/zelle/billetera.ts", "utf-8");
    expect(fuente).toContain("recibidoDeOtrosCentavos");
    /* La fuente son los HECHOS — retiros pagados con esta tienda de
       destino — nunca el espejo de `billeteras.saldo`. */
    expect(fuente).toContain("retiros.destinoTiendaId");
    /* Y entra al neto, que es de donde sale el disponible. */
    expect(fuente).toContain("Number(recibido?.total ?? 0);");
  });

  it("y le sale en los movimientos, con el nombre de quien envió", () => {
    const fuente = readFileSync("src/lib/zelle/billetera.ts", "utf-8");
    expect(fuente).toContain("`Transferencia de ${r.deQuien}`");
  });

  it("y se le avisa por correo al acreditarse", () => {
    const acciones = readFileSync("src/lib/retiros/acciones.ts", "utf-8");
    expect(acciones).toContain("correoTransferenciaRecibida");
    /* En su propio try: un correo caído no deshace un pago hecho. */
    expect(acciones).toContain("el aviso al receptor fallo");
  });
});

describe("a una vitrina de la casa no se le envía dinero", () => {
  it("las tiendas internas se reconocen todas", () => {
    expect(esTiendaDeLaCasa("tienda-mercatren-us")).toBe(true);
    expect(esTiendaDeLaCasa("tienda-us-mayorista")).toBe(true);
    expect(esTiendaDeLaCasa("tienda-us-ropa-calzado")).toBe(true);
    expect(esTiendaDeLaCasa("tienda-mercatren-secciones")).toBe(true);
    expect(esTiendaDeLaCasa("tienda-cl-general")).toBe(true);
    expect(esTiendaDeLaCasa("tienda-co-general")).toBe(true);
  });

  it("un comercio de verdad NO es de la casa", () => {
    expect(esTiendaDeLaCasa("tienda-bley-ferreteria")).toBe(false);
    expect(esTiendaDeLaCasa("tienda-inversiones-multiservicios")).toBe(false);
  });

  it("el candado está en el selector Y en el servidor", () => {
    const consultas = readFileSync("src/lib/retiros/consultas.ts", "utf-8");
    expect(consultas).toContain("!esTiendaDeLaCasa(t.id)");
    /* El del selector se salta con la consola; el del servidor no. */
    const acciones = readFileSync("src/lib/retiros/acciones.ts", "utf-8");
    expect(acciones).toContain("esTiendaDeLaCasa(String(d.destinoTiendaId");
  });
});
