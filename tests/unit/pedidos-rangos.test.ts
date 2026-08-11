import { describe, expect, it } from "vitest";

import {
  dentroDelRango,
  desdeCuando,
  esRango,
  RANGO_POR_DEFECTO,
} from "@/lib/pedidos/rangos";

/** Un martes cualquiera a media tarde. */
const AHORA = new Date(2026, 7, 11, 15, 30, 0);

describe("desde cuándo cuenta cada rango", () => {
  it("«hoy» arranca en la medianoche, no hace 24 horas", () => {
    /* Quien pregunta por lo de hoy quiere el día natural. Con una ventana
       móvil, a las 3 de la tarde le saldrían ventas de ayer. */
    const d = desdeCuando("hoy", AHORA)!;
    expect(d.getDate()).toBe(11);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("«este mes» arranca el día 1, no hace 30 días", () => {
    const d = desdeCuando("mes", AHORA)!;
    expect(d.getDate()).toBe(1);
    expect(d.getMonth()).toBe(7);
    expect(d.getHours()).toBe(0);
  });

  it("7 y 30 días son ventanas móviles", () => {
    const siete = desdeCuando("7d", AHORA)!;
    expect(Math.round((AHORA.getTime() - siete.getTime()) / 86_400_000)).toBe(
      7,
    );
  });

  it("«todo» no pone límite", () => {
    expect(desdeCuando("todo", AHORA)).toBeNull();
  });

  it("el primero de mes, «hoy» y «este mes» empiezan igual", () => {
    // Un borde que se rompe solo si alguien calcula el mes restando días.
    const primero = new Date(2026, 8, 1, 9, 0, 0);
    expect(desdeCuando("hoy", primero)!.getTime()).toBe(
      desdeCuando("mes", primero)!.getTime(),
    );
  });

  it("en enero, «este mes» no se va al año anterior", () => {
    const enero = new Date(2027, 0, 5, 12, 0, 0);
    const d = desdeCuando("mes", enero)!;
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(0);
  });
});

describe("qué entra en el rango", () => {
  it("lo de hoy entra en «hoy»", () => {
    expect(dentroDelRango(new Date(2026, 7, 11, 9, 0), "hoy", AHORA)).toBe(
      true,
    );
  });

  it("lo de ayer no entra en «hoy»", () => {
    expect(dentroDelRango(new Date(2026, 7, 10, 23, 59), "hoy", AHORA)).toBe(
      false,
    );
  });

  it("lo viejo entra en «todo»", () => {
    expect(dentroDelRango(new Date(2023, 0, 1), "todo", AHORA)).toBe(true);
  });

  it("lo que no tiene fecha NO se esconde", () => {
    /* El histórico importado tiene huecos. Esconder un registro por no saber
       cuándo fue es peor que enseñarlo de más: el dinero existió igual. */
    expect(dentroDelRango(null, "hoy", AHORA)).toBe(true);
  });

  it("acepta también una marca de tiempo en número", () => {
    expect(
      dentroDelRango(new Date(2026, 7, 11, 10, 0).getTime(), "hoy", AHORA),
    ).toBe(true);
  });
});

describe("el rango que llega por la dirección", () => {
  it("reconoce los válidos", () => {
    for (const r of ["hoy", "7d", "30d", "mes", "todo"]) {
      expect(esRango(r)).toBe(true);
    }
  });

  it("rechaza cualquier otra cosa", () => {
    expect(esRango("ayer")).toBe(false);
    expect(esRango(undefined)).toBe(false);
    expect(esRango("")).toBe(false);
  });

  it("por defecto se enseña lo reciente, no todo", () => {
    // Abrir la pantalla y que salgan 700 registros de hace meses no ayuda.
    expect(RANGO_POR_DEFECTO).toBe("30d");
  });
});
