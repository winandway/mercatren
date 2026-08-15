import { describe, expect, it } from "vitest";

import { filasDeCj } from "@/lib/cj/lista";

/**
 * DÓNDE VIENEN LOS PRODUCTOS DENTRO DE LA RESPUESTA DE CJ.
 *
 * ══ POR QUÉ EXISTE ESTA PRUEBA ══
 *
 * Porque el buscador estuvo devolviendo **cero productos para cualquier
 * palabra** —«wallet», «phone», «led lamp»— y no había forma de verlo: la
 * llamada a CJ iba bien, así que no salía ningún error. Solo un cartel diciendo
 * «nada con existencias», que hace pensar que el problema es lo que uno
 * escribió.
 *
 * La causa era una suposición mía: di por hecho que `listV2` devolvía la lista
 * en `data.list`, como el endpoint viejo. La devuelve en
 * `data.content[].productList[]`, un nivel más adentro.
 *
 * El trozo de JSON de abajo es la forma documentada por CJ, no una inventada
 * por mí. Si mañana cambian la envoltura, esta prueba se pone roja el mismo día
 * en vez de dejar una pantalla vacía que nadie sabe leer.
 */
describe("dónde vienen los productos dentro de la respuesta de CJ", () => {
  it("los saca de content[].productList, que es donde los pone listV2", () => {
    const respuesta = {
      pageSize: 20,
      pageNumber: 1,
      totalRecords: 1000,
      totalPages: 50,
      content: [
        {
          productList: [
            { id: "A", nameEn: "Wallet", sellPrice: "11.85" },
            { id: "B", nameEn: "Card holder", sellPrice: "9.50" },
          ],
          relatedCategoryList: [{ categoryId: "x", categoryName: "Bags" }],
          keyWord: "wallet",
        },
      ],
    };

    expect(filasDeCj(respuesta).map((f) => f.id)).toEqual(["A", "B"]);
  });

  it("junta los productos de todos los bloques, no solo del primero", () => {
    const respuesta = {
      content: [
        { productList: [{ id: "A" }] },
        { productList: [{ id: "B" }, { id: "C" }] },
      ],
    };

    expect(filasDeCj(respuesta)).toHaveLength(3);
  });

  it("sigue entendiendo la forma vieja, la de /product/list", () => {
    /* Es la que usa la sonda de Configuración, y es una respuesta real de CJ
       igual de válida. Entender solo una de las dos obligaría a duplicar este
       parseo el día que las dos hagan falta. */
    const respuesta = { list: [{ pid: "A" }, { pid: "B" }], total: 2 };

    expect(filasDeCj(respuesta).map((f) => f.pid)).toEqual(["A", "B"]);
  });

  it("un bloque sin productList no rompe el resto", () => {
    /* CJ manda bloques que traen categorías relacionadas y ninguna lista. Si
       uno de esos tumbara el parseo, la búsqueda fallaría entera por un bloque
       que ni siquiera trae productos. */
    const respuesta = {
      content: [
        { relatedCategoryList: [{ categoryId: "x", categoryName: "Bags" }] },
        { productList: [{ id: "A" }] },
      ],
    };

    expect(filasDeCj(respuesta).map((f) => f.id)).toEqual(["A"]);
  });

  it("una respuesta vacía o sin datos devuelve una lista vacía, no revienta", () => {
    expect(filasDeCj(undefined)).toEqual([]);
    expect(filasDeCj({})).toEqual([]);
    expect(filasDeCj({ content: [] })).toEqual([]);
  });
});
