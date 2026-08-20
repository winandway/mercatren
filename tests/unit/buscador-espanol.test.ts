import { describe, expect, it } from "vitest";
import { expandir } from "@/lib/catalogo/sinonimos";

describe("contra los títulos REALES del catálogo publicado", () => {
  const CATALOGO = [
    "S26109 Elecony 26 Inch Fat Tire Bike Youth Full Shimano 21 Speed",
    "Hand Truck, 600 Lbs Load Capacity, Heavy-Duty",
    "Mechanics Tool Set, 314-Piece Mechanic Tool Kit, 1/4 In, 3/8 In",
    "Level 2 Portable EV Charger, 40A 240V, Electric Vehicle",
    "Winch Straps, 6000 Lbs Load Capacity, 18000 Lbs Break Strength",
    "1Pc Mini Bike Inflator Portable Bicycle Tire Inflator Ball Air",
  ];
  const encuentra = (busqueda: string) => {
    const formas = expandir(busqueda);
    return CATALOGO.filter((t) =>
      formas.some((f) => t.toLowerCase().includes(f)),
    );
  };

  it("«bicicleta» encuentra las bicicletas escritas en inglés", () => {
    const r = encuentra("bicicleta");
    expect(r.length).toBeGreaterThan(0);
    expect(r.join(" ")).toContain("Bike");
  });

  it("«herramientas» encuentra el juego de mecánico", () => {
    expect(encuentra("herramientas").join(" ")).toContain("Tool");
  });

  it("«carretilla» encuentra el hand truck", () => {
    expect(encuentra("carretilla").join(" ")).toContain("Hand Truck");
  });

  it("«cargador» encuentra el charger", () => {
    expect(encuentra("cargador").join(" ")).toContain("Charger");
  });

  it("y ANTES del diccionario, ninguna encontraba nada", () => {
    for (const b of ["bicicleta", "herramientas", "carretilla", "cargador"]) {
      const crudo = CATALOGO.filter((t) => t.toLowerCase().includes(b));
      expect(crudo).toHaveLength(0);
    }
  });
});

describe("el candado: que nadie desconecte el diccionario sin querer", () => {
  /**
   * Las pruebas de arriba comprueban el diccionario. Esta comprueba que esté
   * ENCHUFADO, que es distinto: `expandir()` puede seguir perfecto mientras el
   * buscador dejó de llamarlo, y entonces todo pasa en verde con el catálogo
   * de Estados Unidos otra vez invisible en español.
   *
   * Es el mismo tipo de candado que usa el proyecto para el ojito de las
   * contraseñas y para el nombre de la sociedad: se mira el archivo.
   */
  it("el buscador usa `expandir` al armar la condición", async () => {
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/catalogo/buscar.ts", "utf8");

    expect(
      fuente,
      "buscar.ts dejó de importar el diccionario de sinónimos",
    ).toContain('from "./sinonimos"');

    const bloque = fuente.slice(fuente.indexOf("function todasLasPalabras"));
    expect(
      bloque.slice(0, 900),
      "todasLasPalabras dejó de expandir las palabras: el catálogo en inglés vuelve a ser invisible en español",
    ).toContain("expandir(");
  });

  it("el texto que se busca incluye el nombre del departamento", async () => {
    /* Es lo que hace que «ferreteria» encuentre un producto cuya ficha entera
       está en inglés. Se pierde con quitar una línea. */
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/catalogo/buscar.ts", "utf8");
    const bloque = fuente.slice(
      fuente.indexOf("const TEXTO_PRODUCTO"),
      fuente.indexOf("const TITULO"),
    );
    expect(bloque).toContain("categorias.nombreEs");
  });
});
