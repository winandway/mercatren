import { describe, expect, it } from "vitest";

import { DEPARTAMENTOS } from "@/lib/catalogo/departamentos";
import {
  TIENDA_US_GENERAL,
  esDepartamentoReal,
  nombrePropuesto,
  tiendaDeRubro,
  tiendaParaElProducto,
} from "@/lib/cj/rubros";

/**
 * A QUÉ TIENDA VA CADA PRODUCTO DE ESTADOS UNIDOS.
 *
 * La regla del dueño: si estando en la tienda de repuestos se agrega una
 * cartera, la cartera se va sola a la de carteras. El equipo no tiene que
 * acordarse de cambiar de tienda antes de cada producto — que es justo donde
 * se equivocaría, y donde el error no se ve hasta que un comprador entra a una
 * tienda de repuestos llena de bolsos.
 */
describe("a qué tienda va un producto de Estados Unidos", () => {
  const abiertos = ["ropa-calzado", "repuestos-carro"];

  it("va a la tienda de su rubro, no a la que estaba abierta", () => {
    expect(tiendaParaElProducto("ropa-calzado", abiertos)).toBe(
      "tienda-us-ropa-calzado",
    );
    expect(tiendaParaElProducto("repuestos-carro", abiertos)).toBe(
      "tienda-us-repuestos-carro",
    );
  });

  it("un rubro SIN tienda propia se queda en la general, nunca se descarta", () => {
    /* Perder mercancía por no tener dónde ponerla es mucho peor que tenerla
       un tiempo en la tienda genérica. */
    expect(tiendaParaElProducto("mascotas", abiertos)).toBe(TIENDA_US_GENERAL);
  });

  it("un producto sin departamento también se queda en la general", () => {
    expect(tiendaParaElProducto(null, abiertos)).toBe(TIENDA_US_GENERAL);
    expect(tiendaParaElProducto(undefined, abiertos)).toBe(TIENDA_US_GENERAL);
    expect(tiendaParaElProducto("", abiertos)).toBe(TIENDA_US_GENERAL);
  });

  it("un departamento inventado NO crea una tienda fantasma", () => {
    /* `productos.categoria_id` y `productos.tienda_id` tienen llave foránea.
       Un slug mal escrito apuntaría a una tienda que no existe y la base
       rechazaría el producto entero. */
    expect(tiendaParaElProducto("ropa-calzados", ["ropa-calzados"])).toBe(
      TIENDA_US_GENERAL,
    );
    expect(esDepartamentoReal("ropa-calzados")).toBe(false);
    expect(esDepartamentoReal("ropa-calzado")).toBe(true);
  });

  it("el id y la dirección de una tienda salen del departamento, siempre igual", () => {
    /* Derivarlos del slug es lo que impide que se desincronicen: el
       departamento manda y la tienda es su consecuencia. */
    expect(tiendaDeRubro("mascotas")).toEqual({
      id: "tienda-us-mascotas",
      slug: "us-mascotas",
    });
  });

  it("cada departamento real da una dirección distinta", () => {
    /* `tiendas.slug` es único: dos rubros con la misma dirección harían
       fallar el alta de la segunda tienda. */
    const direcciones = DEPARTAMENTOS.map((d) => tiendaDeRubro(d.slug).slug);
    expect(new Set(direcciones).size).toBe(DEPARTAMENTOS.length);
  });

  it("el nombre propuesto sale en el idioma del panel y NO lleva «Mercatren»", () => {
    /* La gracia es que cada tienda tenga su propia cara. Quién vende y
       factura se dice en la ficha, que es donde tiene valor legal. */
    expect(nombrePropuesto("ropa-calzado", "es")).toBe("Ropa y calzado");
    expect(nombrePropuesto("ropa-calzado", "en")).toBe("Clothing & Shoes");
    expect(nombrePropuesto("ropa-calzado", "es")).not.toMatch(/mercatren/i);
    expect(nombrePropuesto("noexiste", "es")).toBe("");
  });
});
