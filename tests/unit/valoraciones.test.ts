import { describe, expect, it } from "vitest";

import {
  esPuntuacionValida,
  estrellasLlenas,
  limpiarComentario,
  resumirValoraciones,
} from "@/lib/valoraciones/reglas";

/**
 * LAS ESTRELLAS DE UN PRODUCTO.
 *
 * El promedio es lo que decide una compra. Uno mal calculado —o redondeado a
 * favor— es publicidad engañosa.
 */
describe("las estrellas de un producto", () => {
  it("sin valoraciones NO se inventa un cero", () => {
    /* «0 de 5 estrellas» se lee como un producto malísimo, cuando lo que pasa
       es que todavía nadie opinó — y eso hunde todo lo recién publicado. */
    expect(resumirValoraciones([])).toEqual({ promedio: null, cuantas: 0 });
  });

  it("el promedio sale con un decimal", () => {
    expect(resumirValoraciones([5, 4, 5])).toEqual({
      promedio: 4.7,
      cuantas: 3,
    });
  });

  it("NUNCA redondea hacia arriba a favor del producto", () => {
    /* 4,44 se enseña como 4,4. Convertirlo en 4,5 es inflar la nota. */
    expect(resumirValoraciones([5, 4, 4, 5, 4, 5, 4, 4, 5]).promedio).toBe(4.4);
  });

  it("descarta las puntuaciones imposibles", () => {
    /* Del navegador puede llegar cualquier cosa. Un 10 subiría el promedio de
       un producto por encima de lo que ninguna persona puso. */
    expect(resumirValoraciones([5, 10, 0, -3, 4]).cuantas).toBe(2);
    expect(esPuntuacionValida(0)).toBe(false);
    expect(esPuntuacionValida(6)).toBe(false);
    expect(esPuntuacionValida(3.5)).toBe(false);
    expect(esPuntuacionValida("4")).toBe(true);
  });

  it("las estrellas dibujadas van a la media más cercana", () => {
    expect(estrellasLlenas(4.3)).toBe(4.5);
    expect(estrellasLlenas(4.1)).toBe(4);
    expect(estrellasLlenas(null)).toBe(0);
  });

  it("el comentario se puede dejar vacío", () => {
    /* Mucha gente puntúa y no escribe. Obligarla a escribir hace que no
       puntúe, y una estrella sin texto vale igual. */
    expect(limpiarComentario("")).toBeNull();
    expect(limpiarComentario("   ")).toBeNull();
    expect(limpiarComentario("  Muy   bueno  ")).toBe("Muy bueno");
  });

  it("un comentario larguísimo se recorta, no revienta", () => {
    expect(limpiarComentario("a".repeat(5000))!.length).toBe(1000);
  });
});
