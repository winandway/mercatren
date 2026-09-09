import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  agregarAPrioridad,
  leerLista,
  TOPE_PRIORIDAD,
} from "@/lib/cj/prioridad-pura";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ «PÓNGALOS A LA CABEZA DE LA FILA» Y «VARIADO, NO PURA ROPA» (9 sep 2026) ══
 *
 * Richard, con dos monitores de estudio que un cliente llevaba días
 * pidiendo, en una fila de 46.000: «póngalos a la cabeza». Y mirando lo que
 * salía cada día: «es pura ropa, no pasa otra cosa». Dos reglas de orden del
 * afinado, y una lista corta que una persona puede llenar desde la puerta.
 */
describe("la lista de prioridad", () => {
  it("agrega al final, sin repetir, y quien se repite vuelve al final", () => {
    expect(agregarAPrioridad([], "a")).toEqual(["a"]);
    expect(agregarAPrioridad(["a"], "b")).toEqual(["a", "b"]);
    expect(agregarAPrioridad(["a", "b"], "a")).toEqual(["b", "a"]);
    expect(agregarAPrioridad(["a"], "  ")).toEqual(["a"]);
  });

  it("tiene tope: es para «este y este», no para reordenar el catálogo", () => {
    const larga = Array.from({ length: TOPE_PRIORIDAD }, (_, i) => `p${i}`);
    const r = agregarAPrioridad(larga, "nuevo");
    expect(r).toHaveLength(TOPE_PRIORIDAD);
    expect(r[r.length - 1]).toBe("nuevo");
    expect(r).not.toContain("p0");
  });

  it("lee lo guardado y la basura vale como lista vacía", () => {
    expect(leerLista('["x","y"]')).toEqual(["x", "y"]);
    expect(leerLista("")).toEqual([]);
    expect(leerLista(null)).toEqual([]);
    expect(leerLista("{no es json")).toEqual([]);
    expect(leerLista('[1, "", "z"]')).toEqual(["z"]);
  });
});

describe("el orden del afinado", () => {
  const afinar = leer("src/lib/cj/afinar.ts");
  const orden = afinar.slice(
    afinar.indexOf(".orderBy("),
    afinar.indexOf(".limit(o.limite)"),
  );

  it("1.º lo que una persona pidió, 2.º lo nunca intentado, 3.º un poco de cada departamento", () => {
    const prioridad = orden.indexOf("inArray(productos.id, prioridad)");
    const nunca = orden.indexOf("cotizadoEn} is not null");
    const variado = orden.indexOf(
      "row_number() over (partition by ${productos.categoriaId}",
    );
    expect(prioridad).toBeGreaterThan(0);
    expect(nunca).toBeGreaterThan(prioridad);
    expect(variado).toBeGreaterThan(nunca);
  });

  it("ya no hay «la ropa primero»: nada de CJ sale sin afinar, así que no tenía sentido", () => {
    expect(orden).not.toContain("DEPARTAMENTO_CON_TALLAS");
  });

  it("lo pedido se lee antes de armar la cola y sale de la lista al afinarse", () => {
    expect(afinar).toContain("const prioridad = await leerPrioridad(db);");
    expect(afinar).toContain("await quitarDePrioridad(p.id, db)");
  });
});

describe("la puerta permite pedirlo y enseñar la foto", () => {
  it("«priorizar» con el enlace del producto", () => {
    const ruta = leer("src/app/datos/probar-compra/route.ts");
    expect(ruta).toContain('z.literal("priorizar")');
    expect(ruta).toContain('case "priorizar"');
    const nucleo = leer("src/lib/cj/probar-compra-nucleo.ts");
    expect(nucleo).toContain("export async function priorizarPorEnlace");
  });

  it("«mirar» trae la primera foto, para ver lo que aún no abre", () => {
    const nucleo = leer("src/lib/cj/probar-compra-nucleo.ts");
    expect(nucleo).toMatch(/imagen: sql</);
    expect(nucleo).toContain("'/media/' || ${imagenesProducto.clave}");
  });
});
