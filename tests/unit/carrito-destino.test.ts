import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  carritoMezclado,
  destinoDelCarrito,
  lineasDeOtroDestino,
  sePuedeAgregar,
} from "@/lib/destino/carrito";

/**
 * UN CARRITO NO PUEDE MEZCLAR DESTINOS (24 ago 2026).
 *
 * Lo de Estados Unidos se despacha allá y lo de Venezuela se retira en el
 * comercio: no hay una entrega que sirva para los dos. Antes bastaba con que
 * UNO fuera de Estados Unidos para marcar el pedido entero como «US», y a la
 * mercancía venezolana se le pedía estado y código postal de allá. Esa venta
 * se cobra y no se puede entregar.
 */
const us = { tiendaPais: "US" };
const ve = { tiendaPais: "VE" };
const viejo = {}; // una línea guardada antes de esta regla: no dice de dónde es

describe("el destino de lo que ya hay", () => {
  it("sale del primer producto que sí lo dice", () => {
    expect(destinoDelCarrito([])).toBeNull();
    expect(destinoDelCarrito([us])).toBe("US");
    expect(destinoDelCarrito([ve, us])).toBe("VE");
  });

  it("una línea vieja sin país NO decide: lo que no se sabe, no manda", () => {
    expect(destinoDelCarrito([viejo])).toBeNull();
    expect(destinoDelCarrito([viejo, us])).toBe("US");
  });
});

describe("qué se puede agregar", () => {
  it("al carrito vacío, cualquier cosa", () => {
    expect(sePuedeAgregar([], us)).toEqual({ ok: true });
    expect(sePuedeAgregar([], ve)).toEqual({ ok: true });
  });

  it("del mismo destino, sí; del otro, NO — y se dice cuál es cuál", () => {
    expect(sePuedeAgregar([ve], ve)).toEqual({ ok: true });
    expect(sePuedeAgregar([ve], us)).toEqual({
      ok: false,
      hay: "VE",
      entra: "US",
    });
    expect(sePuedeAgregar([us], ve)).toEqual({
      ok: false,
      hay: "US",
      entra: "VE",
    });
  });

  it("con un carrito viejo (sin país) no se bloquea a nadie", () => {
    expect(sePuedeAgregar([viejo], us)).toEqual({ ok: true });
    expect(sePuedeAgregar([us], viejo)).toEqual({ ok: true });
  });
});

describe("un carrito que YA venía mezclado", () => {
  it("se detecta y se puede limpiar dejando uno de los dos", () => {
    expect(carritoMezclado([us, ve])).toBe(true);
    expect(carritoMezclado([us, us])).toBe(false);
    expect(carritoMezclado([viejo, us])).toBe(false);
    const lineas = [
      { productoId: "a", tiendaPais: "US" },
      { productoId: "b", tiendaPais: "VE" },
      { productoId: "c", tiendaPais: null },
    ];
    expect(lineasDeOtroDestino(lineas, "VE").map((l) => l.productoId)).toEqual([
      "a",
    ]);
    expect(lineasDeOtroDestino(lineas, "US").map((l) => l.productoId)).toEqual([
      "b",
    ]);
  });
});

describe("el candado de verdad está en el servidor", () => {
  it("crearPedido rechaza un pedido con dos destinos, decidiéndolo con la BASE", () => {
    const acciones = readFileSync("src/lib/pedidos/acciones.ts", "utf8");
    expect(acciones).toContain("destinos.size > 1");
    expect(acciones).toContain('t("destinosMezclados")');
    /* Y se decide con lo leído de la base (`encontrados`), no con lo que
       mande el navegador. */
    expect(acciones).toContain("encontrados.map((p)");
  });

  it("y el carrito guarda de dónde viene cada línea", () => {
    const store = readFileSync("src/lib/carrito/store.ts", "utf8");
    expect(store).toContain("tiendaPais?: string | null");
    expect(store).toContain("reemplazarPor");
    expect(store).toContain("quitarVarias");
  });
});
