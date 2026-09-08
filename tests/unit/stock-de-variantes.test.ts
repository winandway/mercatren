import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (r: string) => readFileSync(r, "utf8");
const guardar = leer("src/lib/cj/guardar.ts");
const barrido = leer("src/lib/cj/verificados.ts");
const selector = leer("src/components/catalogo/selector-variante.tsx");

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
