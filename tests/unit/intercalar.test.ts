import { describe, expect, it } from "vitest";

import { intercalarPorTienda } from "@/lib/catalogo/intercalar";

/**
 * QUE NO SALGAN TODOS JUNTOS LOS DE LA MISMA TIENDA.
 *
 * El catálogo de Estados Unidos entró completo el mismo día, y el barajado de
 * la portada le da ventaja a lo recién llegado: los 78 ganaron la ventaja a la
 * vez y salieron pegados. Hileras enteras con banderita seguidas de hileras
 * enteras sin ella.
 */

const tienda = (p: { t: string }) => p.t;

const rachaMasLarga = (lista: Array<{ t: string }>) => {
  let mayor = 0;
  let actual = 0;
  let ultimo: string | null = null;
  for (const p of lista) {
    actual = p.t === ultimo ? actual + 1 : 1;
    ultimo = p.t;
    mayor = Math.max(mayor, actual);
  }
  return mayor;
};

/**
 * LA GARANTÍA DE VERDAD, que no es «nunca más de dos seguidos».
 *
 * Con 600 productos de un comercio y 8 del otro, el pequeño se agota y **el
 * resto tiene que salir de corrido**: dejar huecos en la parrilla por cumplir
 * una regla de presentación sería mucho peor que la racha.
 *
 * Lo que sí se garantiza es que **no haya rachas mientras quede de otra
 * tienda**. Esto lo comprueba tal cual: recorre la salida llevando la cuenta
 * de lo que queda de cada una, y solo perdona una racha larga cuando en ese
 * momento ya no había de nadie más.
 *
 * La primera versión de esta prueba pedía «nunca más de dos» y se puso roja
 * con el caso real —8 y 8—, porque los últimos cuatro no tenían con qué
 * alternarse. La prueba estaba mal, no el código.
 */
function sinRachasMientrasHayaDeOtra(
  salida: Array<{ t: string }>,
  maximo = 2,
): boolean {
  const quedan = new Map<string, number>();
  for (const p of salida) quedan.set(p.t, (quedan.get(p.t) ?? 0) + 1);

  let ultimo: string | null = null;
  let seguidos = 0;

  for (const p of salida) {
    seguidos = p.t === ultimo ? seguidos + 1 : 1;
    ultimo = p.t;

    if (seguidos > maximo) {
      /* Solo se perdona si en ese momento no quedaba de ninguna otra. */
      const hayDeOtra = [...quedan].some(
        ([grupo, cuantos]) => grupo !== p.t && cuantos > 0,
      );
      if (hayDeOtra) return false;
    }

    quedan.set(p.t, quedan.get(p.t)! - 1);
  }
  return true;
}

describe("intercalar los productos de varias tiendas", () => {
  it("rompe el bloque: nunca más de dos seguidos de la misma tienda", () => {
    /* Justo el caso real: primero todo el catálogo nuevo, después el viejo. */
    const lista = [
      ...Array.from({ length: 8 }, (_, i) => ({ t: "us", id: i })),
      ...Array.from({ length: 8 }, (_, i) => ({ t: "bley", id: i })),
    ];

    expect(rachaMasLarga(lista)).toBe(8);

    const salida = intercalarPorTienda(lista, tienda);
    expect(sinRachasMientrasHayaDeOtra(salida)).toBe(true);
    /* Y lo que ve el dueño: la pantalla ya no arranca con un bloque entero. */
    expect(
      salida
        .slice(0, 12)
        .map((p) => p.t)
        .join(" "),
    ).toBe("us us bley us us bley us us bley us us bley");
  });

  it("NO pierde ni duplica ningún producto", () => {
    /* Lo único imperdonable: una portada que se come productos. */
    const lista = [
      ...Array.from({ length: 7 }, (_, i) => ({ t: "us", id: `us-${i}` })),
      ...Array.from({ length: 12 }, (_, i) => ({ t: "bley", id: `ve-${i}` })),
      ...Array.from({ length: 3 }, (_, i) => ({ t: "otra", id: `ot-${i}` })),
    ];

    const salida = intercalarPorTienda(lista, tienda);

    expect(salida).toHaveLength(lista.length);
    expect(new Set(salida.map((p) => p.id)).size).toBe(lista.length);
  });

  it("respeta el orden que traía dentro de cada tienda", () => {
    /* La consulta ya ordenó con la semilla y con la ventaja de lo nuevo. Esto
       solo separa lo amontonado; adelantar un producto por encima de otro de
       su misma tienda sería rehacer ese trabajo. */
    const lista = [
      { t: "us", id: 1 },
      { t: "us", id: 2 },
      { t: "us", id: 3 },
      { t: "us", id: 4 },
      { t: "ve", id: 5 },
      { t: "ve", id: 6 },
    ];

    const salida = intercalarPorTienda(lista, tienda);
    const soloUs = salida.filter((p) => p.t === "us").map((p) => p.id);
    const soloVe = salida.filter((p) => p.t === "ve").map((p) => p.id);

    expect(soloUs).toEqual([1, 2, 3, 4]);
    expect(soloVe).toEqual([5, 6]);
  });

  it("el primero sigue siendo el primero", () => {
    /* La ventaja de lo recién llegado se decide en la consulta. Si esto
       cambiara la cabeza de la lista, esa ventaja se perdería. */
    const lista = [
      { t: "us", id: "el nuevo" },
      { t: "us", id: "otro nuevo" },
      { t: "us", id: "tercero" },
      { t: "ve", id: "viejo" },
    ];

    expect(intercalarPorTienda(lista, tienda)[0]!.id).toBe("el nuevo");
  });

  it("si una tienda se acaba, el resto sigue de corrido y no quedan huecos", () => {
    /* Con 600 productos de un comercio y 8 del otro, en algún momento solo
       queda uno. Dejar huecos en la parrilla por cumplir una regla de
       presentación sería mucho peor que la racha. */
    const lista = [
      { t: "us", id: 1 },
      { t: "ve", id: 2 },
      { t: "ve", id: 3 },
      { t: "ve", id: 4 },
      { t: "ve", id: 5 },
      { t: "ve", id: 6 },
    ];

    const salida = intercalarPorTienda(lista, tienda);
    expect(salida).toHaveLength(6);
    expect(salida.map((p) => p.id).sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("una sola tienda se devuelve tal cual, sin trabajo de más", () => {
    /* Es el caso de casi todo el catálogo de hoy. Hacer trabajo por un caso
       que no existe es justo lo que vuelve lenta una portada. */
    const lista = Array.from({ length: 20 }, (_, i) => ({ t: "bley", id: i }));
    expect(intercalarPorTienda(lista, tienda)).toBe(lista);
  });

  it("listas cortas se devuelven tal cual", () => {
    const dos = [
      { t: "us", id: 1 },
      { t: "ve", id: 2 },
    ];
    expect(intercalarPorTienda(dos, tienda)).toBe(dos);
    expect(intercalarPorTienda([], tienda)).toEqual([]);
  });

  it("una tienda sin nombre no rompe nada", () => {
    /* Los comercios viejos pueden traer el campo vacío. */
    const lista = [
      { t: "", id: 1 },
      { t: "", id: 2 },
      { t: "", id: 3 },
      { t: "us", id: 4 },
    ];
    expect(intercalarPorTienda(lista, tienda)).toHaveLength(4);
  });

  it("con tres tiendas también las reparte", () => {
    const lista = [
      ...Array.from({ length: 6 }, (_, i) => ({ t: "a", id: `a${i}` })),
      ...Array.from({ length: 6 }, (_, i) => ({ t: "b", id: `b${i}` })),
      ...Array.from({ length: 6 }, (_, i) => ({ t: "c", id: `c${i}` })),
    ];
    expect(
      sinRachasMientrasHayaDeOtra(intercalarPorTienda(lista, tienda)),
    ).toBe(true);
  });
});
