import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  conPresupuesto,
  escribe,
  Presupuesto,
  PresupuestoAgotado,
} from "@/lib/db/presupuesto";

/**
 * EL PRESUPUESTO DE LA BASE (5 nov 2026, regla «La nube no se come el
 * dinero»). Lo que no puede pasar sin que esto se ponga en rojo: que una
 * escritura no se cuente, que se pueda seguir escribiendo con el tope pasado,
 * que una lectura se frene, o que alguien abra la base sin pasar por aquí.
 */

type Meta = { rows_read: number; rows_written: number };

/** Una base de mentira: cada sentencia devuelve las filas que se le digan. */
function baseFalsa(meta: (sql: string) => Meta) {
  const mandadas: string[] = [];
  const sentencia = (sql: string) => ({
    sql,
    bind: (..._valores: unknown[]) => sentencia(sql),
    run: async () => {
      mandadas.push(sql);
      return { meta: meta(sql) };
    },
    all: async () => {
      mandadas.push(sql);
      return { results: [], meta: meta(sql) };
    },
  });
  const base = {
    prepare: (sql: string) => sentencia(sql),
    batch: async (sentencias: Array<{ sql: string }>) =>
      sentencias.map((s) => {
        mandadas.push(s.sql);
        return { meta: meta(s.sql) };
      }),
  };
  return { base, mandadas };
}

describe("qué escribe y qué no", () => {
  it("reconoce las escrituras", () => {
    expect(escribe("INSERT INTO productos VALUES (1)")).toBe(true);
    expect(escribe("  update tiendas set x = 1")).toBe(true);
    expect(escribe("DELETE FROM visitas")).toBe(true);
    expect(escribe("select * from productos")).toBe(false);
    expect(escribe("SELECT count(*) FROM pedidos")).toBe(false);
  });
});

describe("la base envuelta", () => {
  it("cuenta lo leído y lo escrito de cada sentencia y de cada grupo", async () => {
    const p = new Presupuesto(() => 0, 1000, 500);
    const { base } = baseFalsa((sql) =>
      escribe(sql)
        ? { rows_read: 1, rows_written: 3 }
        : { rows_read: 10, rows_written: 0 },
    );
    const db = conPresupuesto(base, p);
    await db.prepare("SELECT 1").bind().all();
    await db.prepare("INSERT INTO x VALUES (?)").bind(1).run();
    await db.batch([
      db.prepare("UPDATE x SET y = 1").bind(),
      db.prepare("SELECT 2").bind(),
    ]);
    expect(p.estado()).toEqual({
      leidasEstaHora: 22,
      escritasEstaHora: 6,
      agotado: false,
    });
  });

  it("al grupo le llegan las sentencias de verdad, no las envueltas", async () => {
    const p = new Presupuesto(() => 0, 1000, 500);
    const { base, mandadas } = baseFalsa(() => ({
      rows_read: 0,
      rows_written: 0,
    }));
    const db = conPresupuesto(base, p);
    await db.batch([db.prepare("SELECT 9")]);
    expect(mandadas).toEqual(["SELECT 9"]);
  });

  it("con el tope pasado FRENA las escrituras, pero deja leer", async () => {
    const p = new Presupuesto(() => 0, 10, 500);
    const { base, mandadas } = baseFalsa((sql) =>
      escribe(sql)
        ? { rows_read: 0, rows_written: 10 }
        : { rows_read: 1, rows_written: 0 },
    );
    const db = conPresupuesto(base, p);
    await db.prepare("INSERT INTO x VALUES (1)").run();
    await expect(
      db.prepare("INSERT INTO x VALUES (2)").run(),
    ).rejects.toBeInstanceOf(PresupuestoAgotado);
    await db.prepare("SELECT * FROM x").all();
    expect(mandadas).toEqual(["INSERT INTO x VALUES (1)", "SELECT * FROM x"]);
  });

  it("la hora siguiente vuelve a dejar escribir", async () => {
    let ahora = 0;
    const p = new Presupuesto(() => ahora, 10, 500);
    p.anotar({ rows_read: 0, rows_written: 10 });
    expect(p.puedeEscribir()).toBe(false);
    ahora = 60 * 60_000;
    expect(p.puedeEscribir()).toBe(true);
  });

  it("nadie abre la base sin pasar por el presupuesto", () => {
    const db = readFileSync("src/lib/db/index.ts", "utf-8");
    expect(db.match(/drizzle\(conPresupuesto\(env\.DB\)/g)).toHaveLength(2);
    expect(db).not.toMatch(/drizzle\(env\.DB/);
  });
});
