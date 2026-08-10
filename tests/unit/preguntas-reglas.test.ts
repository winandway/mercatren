import { describe, expect, it } from "vitest";

import {
  MAXIMO_VISIBLES,
  paraMostrar,
  recortar,
  type Pregunta,
} from "@/lib/preguntas/reglas";

const pregunta = (p: Partial<Pregunta> = {}): Pregunta => ({
  id: "p1",
  preguntaEs: "¿Este cable sirve para 220?",
  preguntaEn: null,
  respuestaEs: "Sí, es THW calibre 12, apto para 220.",
  respuestaEn: null,
  autor: "comercio",
  orden: 0,
  estado: "publicada",
  ...p,
});

/**
 * LA REGLA QUE MÁS IMPORTA.
 *
 * Cuando el comprador pueda preguntar va a haber preguntas esperando
 * respuesta. Una ficha que enseña «¿esto sirve para 220?» sin nada debajo es
 * PEOR que no tener nada: le planta la duda al siguiente comprador y no se la
 * resuelve.
 */
describe("una pregunta sin respuesta no sale al público", () => {
  it("no se muestra si la respuesta está vacía", () => {
    expect(paraMostrar([pregunta({ respuestaEs: null })], "es")).toHaveLength(
      0,
    );
  });

  it("ni si la respuesta son solo espacios", () => {
    /* Un campo con espacios pasa cualquier comprobación de "hay algo" y en
       pantalla se ve exactamente igual que vacío. */
    expect(paraMostrar([pregunta({ respuestaEs: "   " })], "es")).toHaveLength(
      0,
    );
  });

  it("sí se muestra en cuanto hay respuesta", () => {
    expect(paraMostrar([pregunta()], "es")).toHaveLength(1);
  });
});

describe("las ocultas no salen, pero no se pierden", () => {
  it("una oculta no se muestra", () => {
    expect(paraMostrar([pregunta({ estado: "oculta" })], "es")).toHaveLength(0);
  });

  it("un estado desconocido tampoco se publica", () => {
    // Ante la duda no sale: publicar algo que nadie aprobó es peor.
    expect(paraMostrar([pregunta({ estado: "" })], "es")).toHaveLength(0);
    expect(paraMostrar([pregunta({ estado: "pendiente" })], "es")).toHaveLength(
      0,
    );
  });
});

describe("el idioma", () => {
  const conIngles = pregunta({
    preguntaEn: "Does this cable work with 220V?",
    respuestaEn: "Yes, it is THW 12 gauge, rated for 220V.",
  });

  it("en inglés sale el inglés", () => {
    const [v] = paraMostrar([conIngles], "en");
    expect(v!.pregunta).toContain("220V");
    expect(v!.respuesta).toContain("THW 12 gauge");
  });

  it("en español sale el español aunque exista el inglés", () => {
    const [v] = paraMostrar([conIngles], "es");
    expect(v!.pregunta).toContain("¿Este cable");
  });

  it("SIN traducción, en inglés sale el español", () => {
    /* Misma regla que en todo el catálogo: no se inventan traducciones, y leer
       la respuesta en el otro idioma es mejor que no leerla. */
    const [v] = paraMostrar([pregunta()], "en");
    expect(v!.pregunta).toContain("¿Este cable");
    expect(v!.respuesta).toContain("THW calibre 12");
  });

  it("una traducción vacía cuenta como que no hay", () => {
    const [v] = paraMostrar(
      [pregunta({ preguntaEn: "   ", respuestaEn: "" })],
      "en",
    );
    expect(v!.pregunta).toContain("¿Este cable");
    expect(v!.respuesta).toContain("THW calibre 12");
  });
});

describe("el orden", () => {
  it("manda el número de orden del comercio", () => {
    const v = paraMostrar(
      [
        pregunta({ id: "c", orden: 2, preguntaEs: "tercera" }),
        pregunta({ id: "a", orden: 0, preguntaEs: "primera" }),
        pregunta({ id: "b", orden: 1, preguntaEs: "segunda" }),
      ],
      "es",
    );
    expect(v.map((x) => x.pregunta)).toEqual(["primera", "segunda", "tercera"]);
  });

  it("a igual orden, el resultado es SIEMPRE el mismo", () => {
    /* Sin desempate, dos preguntas con el mismo orden se pueden intercambiar
       entre una carga y otra y la ficha "baila" sin motivo. */
    const lista = [
      pregunta({ id: "zz", orden: 0, preguntaEs: "zeta" }),
      pregunta({ id: "aa", orden: 0, preguntaEs: "alfa" }),
    ];
    const unaVez = paraMostrar(lista, "es").map((x) => x.pregunta);
    const otraVez = paraMostrar([...lista].reverse(), "es").map(
      (x) => x.pregunta,
    );
    expect(unaVez).toEqual(otraVez);
  });

  it("no altera la lista que le pasan", () => {
    // Ordenar en el sitio le cambiaría el orden a quien la use después.
    const lista = [pregunta({ id: "b", orden: 1 }), pregunta({ id: "a" })];
    const antes = lista.map((p) => p.id);
    paraMostrar(lista, "es");
    expect(lista.map((p) => p.id)).toEqual(antes);
  });
});

describe("cuántas caben en la ficha", () => {
  it("se recorta al máximo", () => {
    const muchas = Array.from({ length: 20 }, (_, i) =>
      pregunta({ id: `p${i}`, orden: i }),
    );
    expect(recortar(paraMostrar(muchas, "es"))).toHaveLength(MAXIMO_VISIBLES);
  });

  it("con pocas no se inventa nada", () => {
    expect(recortar(paraMostrar([pregunta()], "es"))).toHaveLength(1);
  });

  it("se recortan las ÚLTIMAS, no las primeras", () => {
    // El comercio pone arriba lo que más le preguntan; eso no se puede perder.
    const muchas = Array.from({ length: 12 }, (_, i) =>
      pregunta({ id: `p${i}`, orden: i, preguntaEs: `n${i}` }),
    );
    const v = recortar(paraMostrar(muchas, "es"));
    expect(v[0]!.pregunta).toBe("n0");
    expect(v.at(-1)!.pregunta).toBe(`n${MAXIMO_VISIBLES - 1}`);
  });
});

describe("quién respondió", () => {
  it("se distingue al comercio de un comprador", () => {
    expect(paraMostrar([pregunta()], "es")[0]!.delComercio).toBe(true);
    expect(
      paraMostrar([pregunta({ autor: "comprador" })], "es")[0]!.delComercio,
    ).toBe(false);
  });
});
