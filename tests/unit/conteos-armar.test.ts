import { describe, expect, it } from "vitest";

import {
  armarCobertura,
  armarComercios,
  armarDepartamentos,
  armarMenuDeCategorias,
  type CategoriaPlana,
  type TiendaPlana,
  TIENDA_PRIMERA,
} from "@/lib/catalogo/conteos-armar";

/**
 * LOS CONTEOS DEL CATÁLOGO SE ARMAN EN CÓDIGO (emergencia de costo, 17 sep 2026).
 *
 * Antes cada uno era una consulta con agregados sobre el catálogo entero,
 * rehecha en cada visita. Ahora entra un GROUP BY plano y esto arma lo que
 * las pantallas esperan. Estas pruebas fijan que el resultado es EL MISMO
 * que daban las consultas: hijos sumados al departamento, menú por slug de
 * más a menos, la mayorista primera y las tiendas vacías en cero, y ninguna
 * ciudad inventada en los bombillos.
 */

const CATEGORIAS: CategoriaPlana[] = [
  {
    id: "ferre",
    slug: "ferreteria-y-construccion",
    nombreEs: "Ferretería",
    nombreEn: "Hardware",
    padreId: null,
    tiendaId: null,
  },
  {
    id: "ropa",
    slug: "ropa-y-calzado",
    nombreEs: "Ropa",
    nombreEn: "Clothing",
    padreId: null,
    tiendaId: null,
  },
  {
    id: "motos",
    slug: "motos",
    nombreEs: "Motos",
    nombreEn: "Motorcycles",
    padreId: null,
    tiendaId: null,
  },
  /* Las de Bley cuelgan de Ferretería. */
  {
    id: "pvc",
    slug: "pvc",
    nombreEs: "PVC",
    nombreEn: null,
    padreId: "ferre",
    tiendaId: "bley",
  },
  {
    id: "hierro",
    slug: "hierro",
    nombreEs: "Hierro",
    nombreEn: null,
    padreId: "ferre",
    tiendaId: "bley",
  },
  /* Dos comercios con «ropa»: el menú las junta por slug. */
  {
    id: "ropa-a",
    slug: "ropa",
    nombreEs: "Ropa de A",
    nombreEn: null,
    padreId: "ropa",
    tiendaId: "a",
  },
  {
    id: "ropa-b",
    slug: "ropa",
    nombreEs: "Ropa de B",
    nombreEn: null,
    padreId: "ropa",
    tiendaId: "b",
  },
];

const POR_CATEGORIA = new Map<string, number>([
  ["ferre", 3],
  ["pvc", 400],
  ["hierro", 222],
  ["ropa-a", 5],
  ["ropa-b", 7],
]);

describe("armarDepartamentos: el departamento suma a sus hijos", () => {
  it("Ferretería cuenta lo suyo más PVC y Hierro (622 de Bley + 3 directos)", () => {
    const d = armarDepartamentos(POR_CATEGORIA, CATEGORIAS);
    expect(d["ferreteria-y-construccion"]).toBe(625);
  });

  it("un departamento sin nada directo suma solo a sus hijos", () => {
    const d = armarDepartamentos(POR_CATEGORIA, CATEGORIAS);
    expect(d["ropa-y-calzado"]).toBe(12);
  });

  it("los departamentos vacíos salen en cero, no desaparecen", () => {
    const d = armarDepartamentos(POR_CATEGORIA, CATEGORIAS);
    expect(d.motos).toBe(0);
    expect(Object.keys(d).sort()).toEqual([
      "ferreteria-y-construccion",
      "motos",
      "ropa-y-calzado",
    ]);
  });

  it("las categorías de un comercio nunca son departamento", () => {
    const d = armarDepartamentos(POR_CATEGORIA, CATEGORIAS);
    expect(d).not.toHaveProperty("pvc");
    expect(d).not.toHaveProperty("ropa");
  });
});

describe("armarMenuDeCategorias: por slug, de más a menos, solo con productos", () => {
  it("junta las dos «ropa» y ordena por cuantos", () => {
    const menu = armarMenuDeCategorias(POR_CATEGORIA, CATEGORIAS);
    expect(menu.map((c) => [c.slug, c.cuantos])).toEqual([
      ["pvc", 400],
      ["hierro", 222],
      ["ropa", 12],
      ["ferreteria-y-construccion", 3],
    ]);
  });

  it("el nombre es el de la primera que aparece", () => {
    const menu = armarMenuDeCategorias(POR_CATEGORIA, CATEGORIAS);
    expect(menu.find((c) => c.slug === "ropa")?.nombreEs).toBe("Ropa de A");
  });

  it("una categoría sin productos no sale en el menú", () => {
    const menu = armarMenuDeCategorias(POR_CATEGORIA, CATEGORIAS);
    expect(menu.find((c) => c.slug === "motos")).toBeUndefined();
    expect(menu.find((c) => c.slug === "ropa-y-calzado")).toBeUndefined();
  });
});

const TIENDAS: TiendaPlana[] = [
  {
    id: "a",
    slug: "tienda-a",
    nombre: "A",
    descripcionEs: null,
    descripcionEn: null,
    paisOrigen: "US",
    logoClave: null,
    ciudad: null,
    creadoEnMs: 1,
  },
  {
    id: "nueva",
    slug: "recien-abierta",
    nombre: "Nueva",
    descripcionEs: "Sin nada aún",
    descripcionEn: null,
    paisOrigen: "US",
    logoClave: null,
    ciudad: "Novi",
    creadoEnMs: 2,
  },
  {
    id: "bley",
    slug: "bley-ferreteria",
    nombre: "Bley",
    descripcionEs: null,
    descripcionEn: null,
    paisOrigen: "VE",
    logoClave: "logo",
    ciudad: "El Vigía",
    creadoEnMs: 3,
  },
  {
    id: "may",
    slug: TIENDA_PRIMERA,
    nombre: "Mayorista",
    descripcionEs: null,
    descripcionEn: null,
    paisOrigen: "US",
    logoClave: null,
    ciudad: null,
    creadoEnMs: 4,
  },
];

describe("armarComercios: la mayorista primera, las vacías al final en cero", () => {
  const comercios = armarComercios(
    new Map([
      ["a", 5],
      ["bley", 622],
      ["may", 40],
    ]),
    TIENDAS,
  );

  it("orden: mayorista, después por tamaño de catálogo", () => {
    expect(comercios.map((c) => c.slug)).toEqual([
      TIENDA_PRIMERA,
      "bley-ferreteria",
      "tienda-a",
      "recien-abierta",
    ]);
  });

  it("una tienda recién abierta sale, con cero (se tiene que encontrar en /tiendas)", () => {
    const nueva = comercios.find((c) => c.slug === "recien-abierta");
    expect(nueva?.cuantos).toBe(0);
    expect(nueva?.descripcionEs).toBe("Sin nada aún");
  });

  it("lleva lo que el directorio dibuja y no el id interno", () => {
    const bley = comercios.find((c) => c.slug === "bley-ferreteria")!;
    expect(bley).toMatchObject({
      nombre: "Bley",
      logoClave: "logo",
      ciudad: "El Vigía",
      paisOrigen: "VE",
      creadoEnMs: 3,
      cuantos: 622,
    });
    expect(bley).not.toHaveProperty("id");
  });
});

describe("armarCobertura: solo ciudades que existen en el mapa", () => {
  it("suma por zona y descarta la que no está en el mapa o viene nula", () => {
    const existe = (slug: string) => slug === "caracas" || slug === "el-vigia";
    const c = armarCobertura(
      [
        { zona: "caracas", cuantos: 114 },
        { zona: "el-vigia", cuantos: 600 },
        { zona: "caracas", cuantos: 1 },
        { zona: "narnia", cuantos: 9 },
        { zona: null, cuantos: 9 },
      ],
      existe,
    );
    expect(c).toEqual({ caracas: 115, "el-vigia": 600 });
  });
});
