import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  FLETE_MANUAL_MAX_CENTAVOS,
  fleteManualValido,
  TRANSPORTE_MANUAL,
} from "@/lib/cj/publicar-manual-puro";
import { esTransporteRegional } from "@/lib/cj/riesgo";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ PUBLICAR CON EL FLETE QUE PUSO UNA PERSONA (9 sep 2026) ══
 *
 * CJ cotizó en $0 el envío de los dos monitores de estudio que un cliente
 * esperaba. Sin flete real no se publican; con uno puesto por una persona,
 * sí, y queda escrito que lo puso una persona.
 */
describe("el flete manual", () => {
  it("va en centavos enteros, positivo y con tope", () => {
    expect(fleteManualValido(4_000)).toBe(true);
    expect(fleteManualValido(0)).toBe(false);
    expect(fleteManualValido(-1)).toBe(false);
    expect(fleteManualValido(40.5)).toBe(false);
    expect(fleteManualValido(FLETE_MANUAL_MAX_CENTAVOS + 1)).toBe(false);
    expect(fleteManualValido("40")).toBe(false);
  });

  it("el transporte manual NO cuenta como regional: el barrido no lo retira", () => {
    expect(esTransporteRegional(TRANSPORTE_MANUAL)).toBe(false);
  });

  it("publica como publica el afinado: tallas, precio de la plaza, envío cotizado", () => {
    const m = leer("src/lib/cj/publicar-manual.ts");
    expect(m).toContain(
      "precioPublicadoDe(plaza, p.costo, fleteCentavos, tasa)",
    );
    expect(m).toContain('origen: "cotizado"');
    expect(m).toContain("transporte: TRANSPORTE_MANUAL");
    expect(m).toContain("await guardarTallas(");
    expect(m).toContain('estado: "publicado"');
    /* Lo que una persona dejó en borrador no se toca. */
    expect(m).toContain('if (p.estado === "borrador")');
  });

  it("la puerta lo expone con el flete validado", () => {
    const ruta = leer("src/app/datos/probar-compra/route.ts");
    expect(ruta).toContain('z.literal("publicar")');
    expect(ruta).toContain(
      "fleteCentavos: z.number().int().min(1).max(50_000)",
    );
  });
});
