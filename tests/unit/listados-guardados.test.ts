import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ══ LOS LISTADOS QUE ORDENAN EL CATÁLOGO ENTERO SE GUARDAN YA ORDENADOS ══
 * (emergencia de costo, 18 sep 2026 — cuarta parte)
 *
 * Tres páginas ordenaban el catálogo entero en cada visita (54 millones de
 * filas a la hora): la parrilla de la portada, el catálogo sin filtros y
 * las bandas. Ahora el reloj guarda el orden cada cinco minutos y la página
 * corta su tramo y trae esas dos docenas por id. Y la página de una tienda
 * dejó de contar y ordenar sus miles de productos: dos fases por índice y
 * el total desde la foto de conteos.
 *
 * Comprobada en rojo el 18 sep 2026 quitando el paso 0c del reloj.
 */

const leer = (r: string) => readFileSync(join(process.cwd(), r), "utf8");
const sinComentarios = (c: string) =>
  c.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("los listados guardados", () => {
  const consultas = sinComentarios(leer("src/lib/catalogo/consultas.ts"));

  it("la parrilla, el catálogo sin filtros y las bandas leen la foto cuando no hay ciudad", () => {
    expect(consultas).toContain('listadoGuardado(mercado, "parrilla"');
    expect(consultas).toContain('listadoGuardado(mercado, "catalogo"');
    expect(consultas).toContain("bandasGuardadas(mercado, async () => ({");
    /* y traen los productos POR ID, en el orden guardado y filtrando lo visible */
    expect(consultas).toContain(
      "and(inArray(productos.id, ids), visibleAqui(mercado))",
    );
    expect(consultas).toContain(".map((id) => porId.get(id))");
  });

  it("con ciudad elegida o más allá del tope, se consulta en vivo", () => {
    expect(consultas).toContain(
      "if (desde < guardado.ids.length || desde >= total) {",
    );
    expect(consultas).toContain(
      "if (desde < guardado.ids.length || desde >= totalGuardado) {",
    );
    expect(consultas).toContain("if (!zona?.length) {");
    expect(consultas).toContain(
      "parrillaSinCache(mercado, semilla, pagina, porPagina, zona)",
    );
  });

  it("el reloj los rehace cada cinco minutos y el canario los vigila", () => {
    const tick = sinComentarios(leer("src/lib/reloj/tick.ts"));
    expect(tick).toContain("recalcularTodosLosListados()");
    expect(tick).toContain("LISTADOS_CADA_MS");
    const modulo = leer("src/lib/catalogo/listados-guardados.ts");
    expect(modulo).toContain("LISTADOS_CADA_MS = 5 * 60_000");
    expect(modulo).toContain("LISTADO_TOPE = 1000");
    const salud = leer("src/app/datos/salud/route.ts");
    expect(salud).toContain("edadDeLosListados()");
    expect(salud).toContain("listados,");
  });

  it("la primera pantalla de la portada sigue girando con la semilla de la visita", () => {
    expect(consultas).toContain(
      "productos: pagina === 1 ? rotarComienzo(lista, semilla) : lista,",
    );
  });
});

describe("la página de una tienda", () => {
  const consultas = sinComentarios(leer("src/lib/catalogo/consultas.ts"));

  it("va por listarProductosDeTienda cuando el único filtro es el comercio", () => {
    expect(consultas).toContain(
      "return listarProductosDeTienda(mercado, filtros.comercio, pagina, porPagina);",
    );
  });

  it("dos fases por índice: los nuevos por creado_en, el resto caminando actualizado_en", () => {
    expect(consultas).toContain("sql`${productos.creadoEn} > ${corte}`");
    expect(consultas).toContain("sql`+${productos.creadoEn} <= ${corte}`");
    expect(consultas).toContain(".offset(Math.max(0, desde - nuevos.length))");
    const schema = leer("schema.sql");
    expect(schema).toContain(
      "CREATE INDEX IF NOT EXISTS `idx_productos_tienda_estado_actualizado` ON `productos` (`tienda_id`,`estado`,`actualizado_en`);",
    );
  });

  it("el total sale de la foto de conteos, no de un count(*)", () => {
    const tienda = consultas.slice(
      consultas.indexOf("async function listarProductosDeTienda("),
      consultas.indexOf("export async function obtenerProductoPorSlug("),
    );
    expect(tienda).toContain("(await conteosDe(mercado)).comercios.find(");
    expect(tienda).not.toContain("count(");
  });
});
