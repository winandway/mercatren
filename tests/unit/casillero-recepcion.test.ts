import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ RECIBIR UNA CAJA NUNCA SE BLOQUEA (9 sep 2026) ══
 *
 * Rechazar un paquete que ya está en la puerta cuesta devolución, reclamo
 * y una reseña de una estrella. Se recibe, y después se averigua de quién
 * es. Estas pruebas fijan las decisiones que hacen que eso sea seguro.
 */
describe("la recepción en bodega", () => {
  const r = leer("src/lib/casillero/recepcion.ts");

  it("un paquete sin dueño se RECIBE, y queda huérfano de verdad", () => {
    /* Huérfano es un estado, no un hueco: la cola de excepciones se lee
       filtrando por él, y `casillero_id` nulo es lo que la define. */
    expect(r).toContain('estado: asignar ? "asignado" : "huerfano"');
    expect(r).toContain("casilleroId: asignar?.casilleroId ?? null");
    expect(r).toContain("isNull(paquetesCasillero.casilleroId)");
    /* Y no hay ninguna salida temprana que impida guardar. */
    const cuerpo = r.slice(r.indexOf("export async function recibirPaquete"));
    expect(cuerpo).not.toMatch(/return\s*\{[^}]*error/);
    expect(cuerpo).not.toContain("throw new Error");
  });

  it("el número de recepción sale de un contador atómico, no de MAX()+1", () => {
    /* Con dos operarios escaneando a la vez, MAX()+1 da el mismo número a
       los dos paquetes. */
    expect(r).toContain("UPDATE contadores_casillero SET valor = valor + 1");
    expect(r).toContain("RETURNING valor");
    expect(r).not.toContain("max(");
  });

  it("solo se asigna solo cuando el matching lo autoriza", () => {
    /* La decisión vive en `matching.ts`, con sus reglas y sus pruebas: aquí
       se obedece, no se vuelve a decidir. */
    expect(r).toContain("const asignar = match.automatico && match.mejor");
    expect(r).not.toMatch(/score\s*>=\s*\d/);
  });

  it("cada recepción y cada asignación dejan su rastro", () => {
    /* Es la defensa ante un reclamo por un paquete perdido. */
    expect(r).toContain("insert(eventosPaquete)");
    expect(r).toContain("insert(asignacionesPaquete)");
    expect(r).toContain('tipo: "recibido"');
  });

  it("la prealerta se cierra al cumplirse, para que no cruce dos veces", () => {
    expect(r).toContain('.set({ estado: "cumplida" })');
  });

  it("NO se trae el catálogo entero de casilleros en cada escaneo", () => {
    /* Con diez mil casilleros eso es medio segundo por caja y una bodega
       parada. Se acota. */
    const ctx = r.slice(
      r.indexOf("async function contextoPara"),
      r.indexOf("export type DatosRecepcion"),
    );
    expect(ctx).toMatch(/\.limit\(\d+\)/);
    expect(ctx).toContain('eq(prealertas.estado, "abierta")');
  });

  it("el peso facturable se calcula con la pieza probada, no a mano", () => {
    expect(r).toContain("pesoFacturableLb(datos.pesoLb ?? 0, medidas");
    expect(r).not.toContain("/ 166");
  });
});
