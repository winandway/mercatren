// @vitest-environment node
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { eq, sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { describe, expect, it } from "vitest";

import { columnaDeFuera } from "@/lib/db/columna-de-fuera";

/* TABLAS MÍNIMAS, Y NO EL ESQUEMA REAL, A PROPÓSITO. Importar
   `lib/db/schema` mete en la medición de cobertura un archivo de 4.000
   líneas que ninguna prueba recorre, y la hundía por debajo de su suelo.
   Para lo que se prueba aquí basta con la misma forma: dos tablas con su
   propia columna `id`, que es justo lo que provoca el fallo. */
const pedidos = sqliteTable("pedidos", {
  id: text("id").primaryKey(),
  numero: text("numero"),
  clienteId: text("cliente_id"),
});
const itemsPedido = sqliteTable("items_pedido", {
  id: text("id").primaryKey(),
  pedidoId: text("pedido_id"),
});
const tiendas = sqliteTable("tiendas", { id: text("id").primaryKey() });

/**
 * ══ LA SUBCONSULTA QUE SE COMPARABA CONSIGO MISMA (25 sep 2026) ══
 *
 * Sin uniones, Drizzle escribe `WHERE "pedido_id" = "id"`, y dentro de la
 * subconsulta SQLite toma `"id"` de la tabla de ADENTRO. Salía «0 artículos»
 * en «Mis pedidos», el tablero «Hoy» en cero, el saldo de los comercios en
 * cero, el total de cobros de un comercio inflado y la búsqueda por foto sin
 * imagen. Aquí se ejecuta el SQL de verdad contra SQLite.
 */
const db = drizzle(async () => ({ rows: [] }));

/** Una base en memoria con un pedido de DOS artículos. */
function base(): DatabaseSync {
  const b = new DatabaseSync(":memory:");
  b.exec(`
    CREATE TABLE pedidos (id TEXT PRIMARY KEY, numero TEXT, cliente_id TEXT);
    CREATE TABLE items_pedido (id TEXT PRIMARY KEY, pedido_id TEXT);
    INSERT INTO pedidos VALUES ('p1', 'MT-1', 'c1');
    INSERT INTO items_pedido VALUES ('i1', 'p1'), ('i2', 'p1');
  `);
  return b;
}

function cuantos(subconsulta: ReturnType<typeof sql<number>>): number {
  const q = db
    .select({ n: subconsulta })
    .from(pedidos)
    .where(eq(pedidos.clienteId, "c1"))
    .toSQL();
  const fila = base()
    .prepare(q.sql)
    .get(...(q.params as string[])) as Record<string, number>;
  return Number(Object.values(fila)[0]);
}

describe("una subconsulta en las columnas, sin uniones afuera", () => {
  it("EL FALLO: sin la pieza, un pedido de 2 artículos cuenta 0", () => {
    const n = cuantos(
      sql<number>`(SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id})`,
    );
    /* Se deja escrito para que se vea la trampa: si Drizzle cambiara y esto
       empezara a dar 2, la pieza seguiría sirviendo igual. */
    expect(n).toBe(0);
  });

  it("CON la pieza, cuenta los 2", () => {
    const n = cuantos(
      sql<number>`(SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${columnaDeFuera(pedidos.id)})`,
    );
    expect(n).toBe(2);
  });

  it("y escribe siempre la tabla delante, con uniones o sin ellas", () => {
    const sub = sql`(${columnaDeFuera(pedidos.id)})`;
    const sola = db.select({ x: sub }).from(pedidos).toSQL().sql;
    const unida = db
      .select({ x: sub })
      .from(pedidos)
      .leftJoin(tiendas, eq(tiendas.id, pedidos.clienteId))
      .toSQL().sql;
    expect(sola).toContain('"pedidos"."id"');
    expect(unida).toContain('"pedidos"."id"');
  });
});

/**
 * NADIE VUELVE A ESCRIBIR LA COLUMNA DE AFUERA SUELTA. Cualquier subconsulta
 * `(SELECT … WHERE ${x} = ${pedidos|tiendas|productos|pagos.…})` fuera de un
 * `EXISTS` tiene que pasar la de afuera por `columnaDeFuera`. Dentro de un
 * WHERE Drizzle sí pone la tabla, y por eso los EXISTS quedan fuera.
 */
describe("ninguna subconsulta de columna deja la de afuera suelta", () => {
  it("todo el código de src", () => {
    let crudo = "";
    try {
      crudo = execFileSync(
        "grep",
        [
          "-rnE",
          String.raw`\(SELECT[^\x60]*WHERE \$\{[a-zA-Z]+\.[a-zA-Z]+\} = \$\{(pedidos|tiendas|productos|pagos)\.`,
          "src",
        ],
        { encoding: "utf8" },
      );
    } catch {
      /* grep sale con 1 cuando no encuentra nada: eso es lo que se quiere. */
    }
    const salida = crudo
      .split("\n")
      .filter(Boolean)
      .filter((l) => !l.includes("EXISTS (SELECT"))
      .filter((l) => !l.startsWith("src/lib/db/columna-de-fuera.ts"));
    expect(salida).toEqual([]);
  });
});
