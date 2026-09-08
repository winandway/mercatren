import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { stockDeVariante } from "@/lib/cj/masivo";

const leer = (r: string) => readFileSync(r, "utf8");
const guardar = leer("src/lib/cj/guardar.ts");
const barrido = leer("src/lib/cj/verificados.ts");
const selector = leer("src/components/catalogo/selector-variante.tsx");
const refresco = leer("src/lib/cj/existencias.ts");

/**
 * ══ 2.642 FICHAS QUE NADIE PODÍA COMPRAR (8 sep 2026) ══
 *
 * Richard mandó dos fichas suyas: arriba decían «Quedan 2» y abajo, en la
 * talla, «Sin existencias». Medido en producción ese día: **863 productos en
 * Colombia y 1.779 en Estados Unidos** estaban a la venta con TODAS sus
 * variantes en cero. Llevaban días acumulándose con cada importación.
 *
 * La causa era una línea: `guardarTallas` escribía `existencias: 0` fijo,
 * con el número de CJ delante en la misma variable. El stock del PRODUCTO sí
 * se refrescaba —por eso decía «Quedan 2»— pero la ficha decide si una talla
 * se puede comprar mirando el de la VARIANTE.
 */
describe("el stock de cada talla", () => {
  it("SE GUARDA EL DE CJ, nunca un cero fijo", () => {
    expect(guardar).toContain("existencias: stockDeVariante(");
    /* El cero a mano no puede volver: es exactamente lo que rompió esto. */
    const bloque = guardar.slice(
      guardar.indexOf("export async function guardarTallas"),
    );
    expect(bloque).not.toContain("existencias: 0,");
  });

  it("EL REFRESCO DE STOCK ESCRIBE CADA TALLA, no solo el total", () => {
    /**
     * Es la vía por la que se reparan las 2.642 fichas que ya estaban mal:
     * el refresco toca lo publicado primero y, con esto, deja cada talla con
     * su número. Y como CJ solo devuelve las variantes CON inventario, antes
     * se ponen todas a cero: una talla que allá se agotó no puede seguir
     * diciendo que queda.
     */
    const cuerpo = refresco.slice(
      refresco.indexOf("export async function refrescarExistenciasCj"),
    );
    expect(cuerpo).toContain(".update(variantesProducto)");
    expect(cuerpo).toContain("set({ existencias: 0,");
    expect(cuerpo).toContain("set({ existencias: stockDe(v),");
    expect(cuerpo).toContain("eq(variantesProducto.sku, sku)");
  });

  it("la ficha decide con el stock de la VARIANTE, no con el del producto", () => {
    /* Si esto cambiara, el fallo dejaría de verse sin dejar de existir. */
    expect(selector).toContain("v.existencias > 0");
    expect(selector).toContain("elegida.existencias <= 0");
  });

  it("UN PRODUCTO SIN NINGUNA TALLA COMPRABLE NO SE QUEDA A LA VENTA", () => {
    /* El total del producto no basta como filtro: hay que preguntar si queda
       alguna combinación que una persona pueda meter al carrito. */
    expect(barrido).toContain("conVarianteComprable");
    const retiro = barrido.slice(
      barrido.indexOf('estado: "en_revision"'),
      barrido.indexOf("const conEnvioBueno"),
    );
    expect(retiro).toContain("notInArray(productos.id, conVarianteComprable)");
  });

  it("y vuelve a la venta cuando alguna talla tenga existencia otra vez", () => {
    /**
     * Sin esta mitad, el barrido lo retiraría y lo republicaría en la misma
     * vuelta para siempre: la condición de publicar tiene que ser la inversa
     * exacta de la de retirar.
     */
    const publica = barrido.slice(barrido.indexOf("const conEnvioBueno"));
    expect(publica).toContain("inArray(productos.id, conVarianteComprable)");
    /* Un producto sin tallas cargadas se rige por su propio stock y no queda
       atrapado por esta regla. */
    expect(publica).toContain("notInArray(productos.id, conVariantes)");
  });
});

describe("cómo se lee el stock que manda CJ", () => {
  it("LEE `inventoryNum`, que es el campo real, y SIN DATO ES CERO", () => {
    /**
     * Respuesta real de `/product/variant/query` del 8 sep 2026, recortada:
     * el stock viene en `inventoryNum`, y las variantes agotadas vienen
     * igual, con 0. El lector viejo no conocía ese nombre y, sin dato,
     * inventaba 1: 1.771 productos en EE. UU. con stock igual a su número
     * de tallas. El checkout cobraba fiado en ese 1.
     */
    expect(
      stockDeVariante({ variantSku: "CJYS173928907GT", inventoryNum: 0 }),
    ).toBe(0);
    expect(stockDeVariante({ inventoryNum: 37 })).toBe(37);
    expect(stockDeVariante({ inventoryNum: "12" })).toBe(12);
    /* Los nombres viejos siguen valiendo por si CJ los manda. */
    expect(stockDeVariante({ variantStock: 5 })).toBe(5);
    expect(stockDeVariante({ stockNum: 3 })).toBe(3);
    /* Y lo que no trae número NO vale uno. */
    expect(stockDeVariante({ variantSku: "X" })).toBe(0);
    expect(stockDeVariante({ inventoryNum: null })).toBe(0);
    expect(stockDeVariante({ inventoryNum: "muchos" })).toBe(0);
  });
});
