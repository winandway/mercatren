import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MERCADOS } from "@/lib/mercado/mercados";
import { esVisibleEn } from "@/lib/mercado/visibilidad";

/**
 * ══ LA TRAMPA DEL ÍNDICE DE ESTADO (emergencia de costo, 18 sep 2026 — quinta parte) ══
 *
 * Medido por YaDominios con EXPLAIN y rows_read en la base de producción:
 *
 *   WHERE id IN (21 ids)                  →     42 filas
 *   WHERE id IN (21 ids) AND estado = ?   → 25.136 filas
 *
 * La base no tenía estadísticas (no existía `sqlite_stat1`) y SQLite, sin
 * ellas, cree que `estado = 'publicado'` es selectivo: elige el índice de
 * estado, recorre TODOS los publicados y descarta, y deja la clave primaria
 * sin usar. Se comía 53 de los 98 millones de filas por hora.
 *
 * Lo que la cierra, y lo que esta prueba vigila:
 *  1. Las búsquedas por lista de ids piden SOLO `WHERE id IN (…)`; la
 *     visibilidad se decide en código (`esVisibleEn`, las mismas tres
 *     condiciones de `visibleEn`).
 *  2. Donde hace falta el filtro en SQL junto a un índice de orden (los
 *     similares, el barrido por ids), el estado va con `+` delante: la
 *     condición es la misma pero ya no puede usar índice.
 *  3. La base tiene estadísticas: la puerta corre ANALYZE a pedido y el
 *     reloj `PRAGMA optimize` una vez al día.
 *
 * Comprobada en rojo el 18 sep 2026 devolviendo `visibleAqui(mercado)` al
 * WHERE de `productosPorIds`.
 */

const leer = (r: string) => readFileSync(join(process.cwd(), r), "utf8");
const sinComentarios = (c: string) =>
  c.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const US = MERCADOS.find((m) => m.codigo === "US")!;
const VE = MERCADOS.find((m) => m.codigo === "VE")!;

describe("esVisibleEn: las mismas tres condiciones que visibleEn, en código", () => {
  const fila = {
    estado: "publicado",
    tiendaEstado: "activa",
    tiendaMercado: "US",
  };

  it("publicado, tienda activa y de este mercado: se ve", () => {
    expect(esVisibleEn(fila, US)).toBe(true);
  });

  it("de otro mercado, no (un chileno no ve stock de otro país)", () => {
    expect(esVisibleEn(fila, VE)).toBe(false);
  });

  it("tienda suspendida o producto sin publicar, no", () => {
    expect(esVisibleEn({ ...fila, tiendaEstado: "suspendida" }, US)).toBe(
      false,
    );
    expect(esVisibleEn({ ...fila, estado: "borrador" }, US)).toBe(false);
    expect(esVisibleEn({ ...fila, estado: "agotado" }, US)).toBe(false);
  });

  it("«en revisión» solo para el equipo", () => {
    const enRevision = { ...fila, estado: "en_revision" };
    expect(esVisibleEn(enRevision, US)).toBe(false);
    expect(esVisibleEn(enRevision, US, true)).toBe(true);
    expect(esVisibleEn({ ...fila, estado: "borrador" }, US, true)).toBe(false);
  });

  it("sin datos de la tienda (join roto), no se ve", () => {
    expect(
      esVisibleEn({ ...fila, tiendaEstado: null, tiendaMercado: null }, US),
    ).toBe(false);
  });
});

describe("las búsquedas por lista de ids piden SOLO la clave primaria", () => {
  const consultas = sinComentarios(leer("src/lib/catalogo/consultas.ts"));

  it("productosPorIds y la ficha", () => {
    const porIds = consultas.slice(
      consultas.indexOf("async function productosPorIds("),
      consultas.indexOf("function rotarComienzo("),
    );
    expect(porIds).toContain(".where(inArray(productos.id, ids));");
    expect(porIds).not.toContain("visibleAqui(");
    expect(porIds).toContain("esVisibleEn(f, mercado)");
    const ficha = consultas.slice(
      consultas.indexOf("export async function obtenerProductoPorSlug("),
      consultas.indexOf(
        "const fotos = await db",
        consultas.indexOf("export async function obtenerProductoPorSlug("),
      ),
    );
    expect(ficha).not.toContain("visibleAqui(");
    expect(ficha).toContain("esVisibleEn(");
  });

  it("los trabajos de fondo que remiran por id: afinado, stock y traductor", () => {
    expect(sinComentarios(leer("src/lib/cj/afinar.ts"))).toContain(
      ".where(inArray(productos.id, turno))",
    );
    expect(sinComentarios(leer("src/lib/cj/existencias.ts"))).toContain(
      ".where(inArray(productos.id, turno))",
    );
    const tanda = sinComentarios(leer("src/lib/traduccion/tanda.ts"));
    expect(
      tanda.match(/\.where\(inArray\(productos\.id, turno\)\)/g)?.length,
    ).toBe(2);
  });

  it("donde el filtro va en SQL junto a un índice de orden, el estado lleva +", () => {
    const repositorio = sinComentarios(leer("src/lib/mercado/repositorio.ts"));
    expect(repositorio).toContain("sql`+${productos.estado} = 'publicado'`");
    const similares = consultas.slice(
      consultas.indexOf("export async function productosSimilares("),
      consultas.indexOf("export async function listarCategoriasConProductos("),
    );
    expect(similares).toContain("visibleEnSinIndiceDeEstado(mercado)");
    const verificados = sinComentarios(leer("src/lib/cj/verificados.ts"));
    expect(verificados).toContain("sql`+${productos.estado} = ${valor}`");
    expect(verificados).toContain(
      "sql`+${productos.tiendaId} in ${tiendasDePlaza}`",
    );
  });
});

describe("la base tiene estadísticas", () => {
  it("el reloj corre PRAGMA optimize una vez al día, reclamando la marca", () => {
    const tick = sinComentarios(leer("src/lib/reloj/tick.ts"));
    expect(tick).toContain('sql.raw("PRAGMA optimize=0x10002")');
    expect(tick).toContain(
      "reclamarMarca(LLAVE_OPTIMIZAR_BASE, OPTIMIZAR_CADA_MS, arranque)",
    );
    expect(tick).toContain("const OPTIMIZAR_CADA_MS = 24 * 60 * 60_000;");
  });

  it("la puerta corre ANALYZE a pedido y enseña los planes antes y después", () => {
    const puerta = leer("src/app/datos/probar-compra/route.ts");
    expect(puerta).toContain('accion: z.literal("optimizar")');
    expect(puerta).toContain(
      'e.modo === "analyze" ? "ANALYZE" : "PRAGMA optimize=0x10002"',
    );
    expect(puerta).toContain("resultado = { corrio, antes, despues };");
  });
});

describe("la consulta de pedidos del vigilante parte de los pedidos", () => {
  it("EXISTS por pedido, sin materializar los items de CJ, con su índice", () => {
    const hechos = sinComentarios(leer("src/lib/vigilante/hechos.ts"));
    expect(hechos).not.toContain("inArray(pedidos.id, conCj)");
    expect(hechos).toContain(
      "EXISTS (SELECT 1 FROM ${itemsPedido} i JOIN ${productos} p",
    );
    expect(hechos).toContain(
      "NOT EXISTS (SELECT 1 FROM ${pedidosProveedor} pp",
    );
    expect(hechos.match(/ventaCjSinCompra\(ahoraMs\)/g)?.length).toBe(2);
    expect(leer("schema.sql")).toContain(
      "CREATE INDEX IF NOT EXISTS `idx_pedidos_estado_creado` ON `pedidos` (`estado`,`creado_en`);",
    );
  });
});
