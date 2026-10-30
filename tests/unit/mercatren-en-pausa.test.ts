import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  alcanza,
  diaUtc,
  UNIDADES_POR_DIA,
  unidadesGastadas,
} from "@/lib/ia/presupuesto";

/**
 * MERCATREN EN PAUSA Y EL GASTO DE GOOGLE (29 oct 2026).
 *
 * Richard vio en el banco un cobro de «Google Cloud» de $25 cada dos o tres
 * días desde el 3 de septiembre: el traductor del reloj, cada minuto, con el
 * modelo «pensando» por dentro y sin ningún tope. Ordenó apagarlo todo hasta
 * nuevo aviso. Estos candados cuidan tres cosas:
 *
 * 1. Con la pausa puesta, ninguna llamada a Google ni al asistente sale, y
 *    el reloj, la sincronización y el vigilante contestan sin trabajar.
 * 2. El modelo nunca vuelve a «pensar» a costa nuestra (`thinkingBudget: 0`).
 * 3. Aunque se quite la pausa, el traductor tiene un tope diario delante.
 */

const leer = (ruta: string) => readFileSync(ruta, "utf-8");

/** La posición de `aguja` en `texto`, exigiendo que exista. */
function donde(texto: string, aguja: string, ruta: string): number {
  const i = texto.indexOf(aguja);
  expect(i, `${ruta} no contiene «${aguja}»`).toBeGreaterThan(-1);
  return i;
}

describe("con la pausa puesta no sale nada hacia Google", () => {
  it("el traductor mira la pausa ANTES de cada llamada", () => {
    const ruta = "src/lib/traduccion/modelo.ts";
    const modelo = leer(ruta);
    const llamadas = modelo.split("generativelanguage.googleapis.com").length;
    const frenos = modelo.split(
      "if (IA_APAGADA) return { ok: false, motivo: MOTIVO_IA_APAGADA };",
    ).length;
    expect(llamadas - 1).toBe(2);
    expect(frenos - 1).toBe(2);
    /* Y el freno va antes de la primera llamada. */
    expect(donde(modelo, "IA_APAGADA)", ruta)).toBeLessThan(
      donde(modelo, "generativelanguage.googleapis.com", ruta),
    );
  });

  it("la búsqueda por foto, el índice visual y el asistente también", () => {
    for (const [ruta, freno, llamada] of [
      [
        "src/lib/busqueda-imagen/mirar.ts",
        "if (IA_APAGADA) return { ok: false, motivo: MOTIVO_IA_APAGADA };",
        "generativelanguage.googleapis.com",
      ],
      [
        "src/lib/busqueda-imagen/embeddings.ts",
        "if (IA_APAGADA) return { ok: false, motivo: MOTIVO_IA_APAGADA };",
        "generativelanguage.googleapis.com",
      ],
      [
        "src/lib/asistente/cliente.ts",
        "if (IA_APAGADA) return null;",
        "baseDelAgente(getCloudflareContext().env.AGENTE_URL)",
      ],
    ] as const) {
      const texto = leer(ruta);
      expect(donde(texto, freno, ruta)).toBeLessThan(
        donde(texto, llamada, ruta),
      );
    }
    /* El botón de la cámara tampoco se ofrece. */
    expect(leer("src/lib/busqueda-imagen/mirar.ts")).toMatch(
      /busquedaPorImagenDisponible\(\): boolean \{[\s\S]{0,200}if \(IA_APAGADA\) return false;/,
    );
  });

  it("el tope del día también se cierra con la pausa", () => {
    const gasto = leer("src/lib/ia/gasto.ts");
    expect(gasto).toContain("if (IA_APAGADA) return false;");
  });

  it("el reloj, la sincronización y el vigilante contestan sin trabajar", () => {
    for (const [ruta, trabajo] of [
      ["src/app/datos/reloj/route.ts", "reclamarTick(ahoraMs)"],
      ["src/app/datos/sincronizar/route.ts", "await getDbAsync()"],
      ["src/app/datos/vigilante/route.ts", "await correrVigilante("],
    ] as const) {
      const texto = leer(ruta);
      expect(
        donde(
          texto,
          "if (RELOJ_APAGADO) return Response.json({ ok: true, apagado: true });",
          ruta,
        ),
      ).toBeLessThan(donde(texto, trabajo, ruta));
    }
  });
});

describe("el modelo no «piensa» a costa nuestra", () => {
  it("cada llamada de texto lleva thinkingBudget: 0", () => {
    for (const ruta of [
      "src/lib/traduccion/modelo.ts",
      "src/lib/busqueda-imagen/mirar.ts",
    ]) {
      const texto = leer(ruta);
      const configuraciones = texto.split("generationConfig: {").length - 1;
      const sinPensar =
        texto.split("thinkingConfig: { thinkingBudget: 0 }").length - 1;
      expect(configuraciones, ruta).toBeGreaterThan(0);
      expect(sinPensar, ruta).toBe(configuraciones);
    }
  });
});

describe("el tope diario del traductor", () => {
  it("cuenta solo lo de hoy", () => {
    expect(unidadesGastadas("2026-10-29:40", "2026-10-29")).toBe(40);
    expect(unidadesGastadas("2026-10-28:149", "2026-10-29")).toBe(0);
    expect(unidadesGastadas(null, "2026-10-29")).toBe(0);
    expect(unidadesGastadas("basura", "2026-10-29")).toBe(0);
    expect(diaUtc(new Date("2026-10-29T23:59:00Z"))).toBe("2026-10-29");
  });

  it("frena al llegar al tope, y el tope es chico", () => {
    expect(alcanza(0, 1)).toBe(true);
    expect(alcanza(UNIDADES_POR_DIA - 1, 1)).toBe(true);
    expect(alcanza(UNIDADES_POR_DIA, 1)).toBe(false);
    expect(alcanza(UNIDADES_POR_DIA - 2, 5)).toBe(false);
    /* Subirlo es decisión de Richard: ~$0,0015 por unidad. */
    expect(UNIDADES_POR_DIA).toBeLessThanOrEqual(150);
  });

  it("el tope va DELANTE de la llamada y el gasto se anota DESPUÉS", () => {
    const ruta = "src/lib/traduccion/modelo.ts";
    const modelo = leer(ruta);
    const tope = donde(modelo, "puedeGastarIa(1)", ruta);
    const llamada = donde(modelo, "generativelanguage.googleapis.com", ruta);
    const anota = donde(modelo, "anotarGastoIa(1)", ruta);
    expect(tope).toBeLessThan(llamada);
    expect(anota).toBeGreaterThan(llamada);
  });

  it("las descripciones salen del reloj hasta que Richard diga", () => {
    const tick = leer("src/lib/reloj/tick.ts");
    expect(tick).toContain("DESCRIPCIONES_EN_EL_RELOJ && queda() > 9_000");
    expect(leer("src/lib/ia/presupuesto.ts")).toContain(
      "export const DESCRIPCIONES_EN_EL_RELOJ = false;",
    );
  });
});
