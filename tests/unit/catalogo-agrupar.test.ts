import { describe, expect, it } from "vitest";

import {
  agruparPorCodigo,
  type ProductoDeOrigen,
} from "@/lib/catalogo/agrupar";

/** Una línea del archivo del comercio, con lo mínimo para la prueba. */
const linea = (p: Partial<ProductoDeOrigen>): ProductoDeOrigen => ({
  id: "id-1",
  sku: "TUBO-1",
  title_es: "Tubo",
  price: 10,
  stock: 0,
  status: "published",
  ...p,
});

/**
 * UN CÓDIGO = UN PRODUCTO.
 *
 * De dónde salió (8 ago 2026): el sistema de Ferremateriales Bley manda una
 * línea por galpón. 757 líneas son 690 productos. Sin agrupar, el comprador ve
 * el mismo tubo dos veces con cantidades distintas.
 */
describe("las sucursales se suman en un solo producto", () => {
  it("el mismo código en dos galpones da UN producto con la suma", () => {
    const { grupos, fusionadas } = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", stock: 525 }),
      linea({ id: "bbb", sucursal: "caracas", stock: 22 }),
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0]!.existencias).toBe(547);
    expect(fusionadas).toBe(1);
  });

  it("códigos distintos no se mezclan", () => {
    const { grupos } = agruparPorCodigo([
      linea({ id: "aaa", sku: "TUBO-1", stock: 5 }),
      linea({ id: "bbb", sku: "TUBO-2", stock: 7 }),
    ]);
    expect(grupos).toHaveLength(2);
    expect(grupos.map((g) => g.existencias).sort()).toEqual([5, 7]);
  });

  it("sin código, cada línea va sola: no se funden por casualidad", () => {
    /* Fundir dos productos sin código porque los dos están vacíos sería juntar
       cosas que no tienen nada que ver. */
    const { grupos } = agruparPorCodigo([
      linea({ id: "aaa", sku: null, stock: 3 }),
      linea({ id: "bbb", sku: null, stock: 4 }),
    ]);
    expect(grupos).toHaveLength(2);
  });

  it("un comercio de un solo galpón, que no manda sucursal, no se ve afectado", () => {
    const { grupos, fusionadas } = agruparPorCodigo([
      linea({ id: "aaa", sku: "A", stock: 9 }),
      linea({ id: "bbb", sku: "B", stock: 4 }),
    ]);
    expect(grupos).toHaveLength(2);
    expect(fusionadas).toBe(0);
  });

  it("una línea sin identificador se descarta: no habría cómo reconocerla después", () => {
    const { grupos } = agruparPorCodigo([
      linea({ id: "", sku: "A" }),
      linea({ id: "  ", sku: "B" }),
      linea({ id: "ok", sku: "C", stock: 2 }),
    ]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0]!.ids).toEqual(["ok"]);
  });
});

describe("dos cargas del MISMO galpón no son más mercancía", () => {
  it("no se suman: se queda la que más tiene", () => {
    /* Hay 14 códigos cargados dos veces dentro de la misma sucursal. Sumarlos
       diría que hay el doble de lo que hay, y se vendería algo que no está. */
    const { grupos, repetidasEnUnGalpon } = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", stock: 20 }),
      linea({ id: "bbb", sucursal: "el_vigia", stock: 36 }),
    ]);

    expect(grupos[0]!.existencias).toBe(36);
    expect(repetidasEnUnGalpon).toBe(1);
  });

  it("y el orden en que vengan no cambia el resultado", () => {
    const alReves = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", stock: 36 }),
      linea({ id: "bbb", sucursal: "el_vigia", stock: 20 }),
    ]);
    expect(alReves.grupos[0]!.existencias).toBe(36);
  });

  it("un galpón duplicado y otro sano: se descarta la copia y se suma el otro", () => {
    const { grupos } = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", stock: 20 }),
      linea({ id: "bbb", sucursal: "el_vigia", stock: 36 }),
      linea({ id: "ccc", sucursal: "caracas", stock: 4 }),
    ]);
    expect(grupos[0]!.existencias).toBe(40);
  });
});

/**
 * LA PRUEBA QUE JUSTIFICA EL DISEÑO.
 *
 * El identificador canónico se elige por orden alfabético, NUNCA por
 * existencias. Si se eligiera "la línea que más tiene", cambiaría de galpón en
 * cuanto se venda algo, Mercatren dejaría de reconocer el producto y lo
 * duplicaría en la siguiente lectura.
 */
describe("el identificador canónico no se mueve", () => {
  it("es el mismo aunque las existencias se den la vuelta", () => {
    const antes = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", stock: 500 }),
      linea({ id: "bbb", sucursal: "caracas", stock: 3 }),
    ]);

    // Se vendió casi todo El Vigía y llegó mercancía a Caracas.
    const despues = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", stock: 1 }),
      linea({ id: "bbb", sucursal: "caracas", stock: 900 }),
    ]);

    expect(antes.grupos[0]!.ids[0]).toBe(despues.grupos[0]!.ids[0]);
  });

  it("tampoco depende del orden en que lleguen las líneas", () => {
    const unOrden = agruparPorCodigo([
      linea({ id: "zzz", sucursal: "caracas" }),
      linea({ id: "aaa", sucursal: "el_vigia" }),
    ]);
    const elOtro = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia" }),
      linea({ id: "zzz", sucursal: "caracas" }),
    ]);

    expect(unOrden.grupos[0]!.ids).toEqual(elOtro.grupos[0]!.ids);
    expect(unOrden.grupos[0]!.ids[0]).toBe("aaa");
  });

  it("los demás identificadores del grupo quedan listados, para retirar sus fichas viejas", () => {
    const { grupos } = agruparPorCodigo([
      linea({ id: "bbb", sucursal: "caracas" }),
      linea({ id: "aaa", sucursal: "el_vigia" }),
    ]);
    expect(grupos[0]!.ids).toEqual(["aaa", "bbb"]);
  });

  it("el título y el precio salen de la línea canónica, no de una cualquiera", () => {
    const { grupos } = agruparPorCodigo([
      linea({ id: "zzz", title_es: "El de Caracas", price: 99, stock: 900 }),
      linea({ id: "aaa", title_es: "El principal", price: 10, stock: 1 }),
    ]);
    expect(grupos[0]!.principal.title_es).toBe("El principal");
    expect(grupos[0]!.principal.price).toBe(10);
  });
});

describe("avisos para el comercio", () => {
  it("cuenta los grupos donde los galpones no coinciden en el precio", () => {
    const { preciosDiscrepantes } = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", price: 10 }),
      linea({ id: "bbb", sucursal: "caracas", price: 12 }),
    ]);
    expect(preciosDiscrepantes).toBe(1);
  });

  it("mismo precio en los dos galpones no es discrepancia", () => {
    const { preciosDiscrepantes } = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", price: 10 }),
      linea({ id: "bbb", sucursal: "caracas", price: 10 }),
    ]);
    expect(preciosDiscrepantes).toBe(0);
  });

  it("un galpón sin precio no cuenta como precio distinto", () => {
    /* Falta de dato no es contradicción: avisar de algo que no lo es hace que
       el comercio deje de mirar los avisos. */
    const { preciosDiscrepantes } = agruparPorCodigo([
      linea({ id: "aaa", sucursal: "el_vigia", price: 10 }),
      linea({ id: "bbb", sucursal: "caracas", price: null }),
    ]);
    expect(preciosDiscrepantes).toBe(0);
  });
});

describe("los números reales de Ferremateriales Bley", () => {
  it("757 líneas de dos galpones quedan en 690 productos", () => {
    /* Los números que el comercio confirmó el 8 ago 2026: 620 líneas de El
       Vigía, 137 de Caracas, 44 códigos presentes en ambos galpones y 14
       códigos cargados más de una vez dentro del mismo galpón.
       Con esas cuatro cifras el reparto queda determinado. */
    const lineas: ProductoDeOrigen[] = [];

    // 553 códigos que solo están en El Vigía.
    for (let i = 0; i < 553; i++) {
      lineas.push(
        linea({ id: `vig-${i}`, sku: `SOLO-VIG-${i}`, sucursal: "el_vigia" }),
      );
    }
    // 44 códigos que están en los dos galpones: dos líneas cada uno.
    for (let i = 0; i < 44; i++) {
      lineas.push(
        linea({ id: `amb-v-${i}`, sku: `AMBOS-${i}`, sucursal: "el_vigia" }),
      );
      lineas.push(
        linea({ id: `amb-c-${i}`, sku: `AMBOS-${i}`, sucursal: "caracas" }),
      );
    }
    // 93 códigos que solo están en Caracas.
    for (let i = 0; i < 93; i++) {
      lineas.push(
        linea({ id: `car-${i}`, sku: `SOLO-CAR-${i}`, sucursal: "caracas" }),
      );
    }
    /* 14 códigos mal cargados en El Vigía. No son 14 líneas de más: nueve de
       ellos están cargados tres veces y cinco dos veces, o sea 23 líneas
       sobrantes. Es lo que hace cuadrar las 620 líneas del galpón. */
    for (let i = 0; i < 9; i++) {
      lineas.push(
        linea({ id: `dupA-${i}`, sku: `SOLO-VIG-${i}`, sucursal: "el_vigia" }),
        linea({ id: `dupB-${i}`, sku: `SOLO-VIG-${i}`, sucursal: "el_vigia" }),
      );
    }
    for (let i = 9; i < 14; i++) {
      lineas.push(
        linea({ id: `dupA-${i}`, sku: `SOLO-VIG-${i}`, sucursal: "el_vigia" }),
      );
    }

    const deElVigia = lineas.filter((l) => l.sucursal === "el_vigia");
    const deCaracas = lineas.filter((l) => l.sucursal === "caracas");
    expect(deElVigia).toHaveLength(620);
    expect(deCaracas).toHaveLength(137);
    expect(lineas).toHaveLength(757);

    const { grupos, fusionadas, repetidasEnUnGalpon } =
      agruparPorCodigo(lineas);

    expect(grupos).toHaveLength(690);
    expect(fusionadas).toBe(67); // 757 − 690
    expect(repetidasEnUnGalpon).toBe(23); // líneas sobrantes, no códigos
  });
});
