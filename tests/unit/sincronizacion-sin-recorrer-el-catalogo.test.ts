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
 *  - El barrido completo corre cada 15 minutos; con cambios del afinado o
 *    del stock barre solo esos ids.
 *  - El conteo de fotos por traer se recuerda media hora, y la lista de
 *    fotos por traer y las del traductor se calculan una vez por hora
 *    (`tomarDeCola`, el ayudante común).
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
    const porId = afinar.indexOf(".where(inArray(productos.id, turno))");
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
    expect(existencias).toContain(".where(inArray(productos.id, turno))");
  });
});

describe("las colas comunes: el revisor de fotos y el traductor", () => {
  it("usan tomarDeCola con tope y vigencia de una hora, y remiran por id", () => {
    const fotos = sinComentarios(leer("src/lib/catalogo/fotos-automaticas.ts"));
    expect(fotos).toContain("tomarDeCola({");
    expect(fotos).toContain("const COLA_FOTOS_TOPE = 2400;");
    expect(fotos).toContain("const COLA_FOTOS_VIGENCIA_MS = 60 * 60_000;");
    expect(fotos).toMatch(
      /inArray\(imagenesProducto\.id, turno\), pendienteDeTraer/,
    );
    const tanda = sinComentarios(leer("src/lib/traduccion/tanda.ts"));
    expect(tanda).toContain("tomarDeCola({");
    expect(tanda).toContain("const COLA_TOPE = 600;");
    expect(
      tanda.match(/\.where\(inArray\(productos\.id, turno\)\)/g)?.length,
    ).toBe(2);
  });

  it("el ayudante saca el turno de la lista ANTES de trabajar y respeta una lista vacía y fresca", () => {
    const cola = sinComentarios(leer("src/lib/reloj/cola-guardada.ts"));
    expect(
      cola.indexOf("await guardar(o.llave, { ...cola!, ids: resto });"),
    ).toBeLessThan(
      cola.indexOf("return { ids: turno, quedan: resto.length, recalculada };"),
    );
    expect(cola).toContain(
      "if (vaciaYFresca) return { ids: [], quedan: 0, recalculada: false };",
    );
  });
});

describe("el barrido y el conteo de fotos ya no van cada minuto", () => {
  it("el barrido corre con cambios del afinado o cada 15 minutos", () => {
    const tick = sinComentarios(leer("src/lib/reloj/tick.ts"));
    expect(tick).toContain("BARRIDO_CADA_MS = 15 * 60_000");
    expect(tick).toContain("haceMs > BARRIDO_CADA_MS");
    expect(tick).toContain(
      "await anotarMarca(LLAVE_ULTIMO_BARRIDO, arranque);",
    );
  });

  it("con cambios del afinado o del stock, el barrido va SOLO a esos ids", () => {
    const tick = sinComentarios(leer("src/lib/reloj/tick.ts"));
    expect(tick).toContain("barrerNoVerificados({ soloIds: idsTocados })");
    expect(tick).toContain("barrerNoVerificados({ soloIds: r.ids })");
    const verificados = sinComentarios(leer("src/lib/cj/verificados.ts"));
    expect(verificados.match(/\.\.\.soloEstos,/g)?.length).toBe(2);
    expect(verificados).toContain("[inArray(productos.id, opciones.soloIds!)]");
  });

  it("el conteo de fotos por traer se recuerda media hora", () => {
    const fotos = sinComentarios(leer("src/lib/catalogo/fotos-automaticas.ts"));
    expect(fotos).toContain('LLAVE_FOTOS_POR_TRAER = "fotos_por_traer_conteo"');
    expect(fotos).toContain("CONTEO_FOTOS_VIGENCIA_MS = 30 * 60_000");
  });
});
