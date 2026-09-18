import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ══ LA SINCRONIZACIÓN NO RECORRE EL CATÁLOGO CADA MINUTO (emergencia de costo, 18 sep 2026) ══
 *
 * Medido desde la cuenta de YaDominios: el trabajo de fondo de CJ (contar
 * y ordenar la cola del afinado, elegir a quién le toca stock, el barrido
 * de no verificados y el conteo de fotos por traer) leía ~80 millones de
 * filas a la hora, porque cada latido del reloj (uno por minuto) rehacía
 * consultas que recorren el catálogo entero. Lo que hay ahora:
 *
 *  - El afinado y el stock calculan una LISTA de ids una vez cada tanda (o
 *    cada media hora) y cada latido toma los suyos y los mira por id.
 *  - El barrido corre cuando el afinado hizo algo, o cada 15 minutos.
 *  - El conteo de fotos por traer se recuerda media hora.
 *
 * Comprobada en rojo el 18 sep 2026 devolviendo el `.limit(o.limite)` a la
 * consulta cara del afinado.
 */

const leer = (r: string) => readFileSync(join(process.cwd(), r), "utf8");
const sinComentarios = (c: string) =>
  c.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("el afinado consume una lista guardada", () => {
  const afinar = sinComentarios(leer("src/lib/cj/afinar.ts"));

  it("la consulta cara trae una tanda, no el turno del latido", () => {
    expect(afinar).toContain(".limit(COLA_TANDA)");
    expect(afinar).not.toContain(".limit(o.limite)");
    expect(afinar).toContain("const COLA_TANDA = 300;");
    expect(afinar).toContain("const COLA_VIGENCIA_MS = 30 * 60_000;");
  });

  it("se guarda en configuracion y se rehace si cambian los países o la prioridad", () => {
    expect(afinar).toContain('LLAVE_COLA_AFINADO = "cj_cola_afinado"');
    expect(afinar).toContain(
      'if (c.paises.join(",") !== paises.join(",")) return null;',
    );
    expect(afinar).toContain(
      'if (c.prioridad.join(",") !== prioridad.join(",")) return null;',
    );
  });

  it("el turno se saca de la lista ANTES de trabajar y se vuelve a mirar por id", () => {
    const antes = afinar.indexOf("ids: cola.ids.slice(turno.length)");
    const porId = afinar.indexOf(
      "and(inArray(productos.id, turno), condicionDeCola(paises))",
    );
    const bucle = afinar.indexOf("for (const p of cola_) {");
    expect(antes).toBeGreaterThan(0);
    expect(porId).toBeGreaterThan(antes);
    expect(bucle).toBeGreaterThan(porId);
  });
});

describe("el stock consume una lista guardada", () => {
  const existencias = sinComentarios(leer("src/lib/cj/existencias.ts"));

  it("lista y conteo de casi listos se calculan juntos, una vez por tanda", () => {
    expect(existencias).toContain(".limit(COLA_STOCK_TANDA)");
    expect(existencias).toContain('LLAVE_COLA_STOCK = "cj_cola_stock"');
    expect(existencias).toContain("return (await colaDeStock()).casiListos;");
    expect(existencias).toMatch(/and\(\s*inArray\(productos\.id, turno\),/);
  });
});

describe("el barrido y el conteo de fotos ya no van cada minuto", () => {
  it("el barrido corre con cambios del afinado o cada 15 minutos", () => {
    const tick = sinComentarios(leer("src/lib/reloj/tick.ts"));
    expect(tick).toContain("BARRIDO_CADA_MS = 15 * 60_000");
    expect(tick).toContain(
      "(afinadoEsteLatido > 0 || haceMs > BARRIDO_CADA_MS)",
    );
    expect(tick).toContain(
      "await anotarMarca(LLAVE_ULTIMO_BARRIDO, arranque);",
    );
  });

  it("el conteo de fotos por traer se recuerda media hora", () => {
    const fotos = sinComentarios(leer("src/lib/catalogo/fotos-automaticas.ts"));
    expect(fotos).toContain('LLAVE_FOTOS_POR_TRAER = "fotos_por_traer_conteo"');
    expect(fotos).toContain("CONTEO_FOTOS_VIGENCIA_MS = 30 * 60_000");
  });
});
