import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  BASE_ID,
  consultaDeConsumo,
  CUBO,
  medidaDe,
  medirConsumo,
} from "@/lib/consumo/medir";
import { debeAvisar, REPETIR_AVISO_MS } from "@/lib/consumo/umbrales";

/**
 * LA ALARMA DE CONSUMO DENTRO DEL SERVIDOR (5 nov 2026). Lo que no puede
 * pasar sin que esto se ponga en rojo: medir la base o el cubo equivocados,
 * dar por buena una respuesta vacía, mandar un correo cada hora o no mandarlo
 * cuando el consumo empeora.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf-8");

const respuesta = {
  data: {
    viewer: {
      accounts: [
        {
          d1AnalyticsAdaptiveGroups: [
            { sum: { rowsRead: 100_000, rowsWritten: 50 } },
            { sum: { rowsRead: 134_199, rowsWritten: 134 } },
          ],
          d1StorageAdaptiveGroups: [{ max: { databaseSizeBytes: 41_762_816 } }],
          r2StorageAdaptiveGroups: [
            { max: { payloadSize: 427_000_000, metadataSize: 200_000 } },
          ],
        },
      ],
    },
  },
};

describe("la consulta a Cloudflare", () => {
  it("pide la base y el cubo de Mercatren, de las últimas 24 horas", () => {
    const ahora = new Date("2026-11-05T16:00:00.000Z");
    const { variables } = consultaDeConsumo(ahora);
    expect(variables.base).toBe(BASE_ID);
    expect(variables.cubo).toBe(CUBO);
    expect(variables.desde).toBe("2026-11-04T16:00:00Z");
    expect(variables.hasta).toBe("2026-11-05T16:00:00Z");
  });

  it("suma todas las horas y toma el último tamaño", () => {
    expect(medidaDe(respuesta)).toEqual({
      filasLeidas24h: 234_199,
      filasEscritas24h: 184,
      baseBytes: 41_762_816,
      cuboBytes: 427_200_000,
    });
  });

  it("una respuesta sin la cuenta no es una medida, y un tamaño que falta es NaN", () => {
    expect(medidaDe({ data: null })).toBeNull();
    const sinTamanos = medidaDe({
      data: { viewer: { accounts: [{ d1AnalyticsAdaptiveGroups: [] }] } },
    });
    expect(sinTamanos?.baseBytes).toBeNaN();
    expect(sinTamanos?.cuboBytes).toBeNaN();
  });

  it("sin llave no pregunta, y un error de Cloudflare se dice", async () => {
    let llamadas = 0;
    const pedir = (async () => {
      llamadas++;
      return new Response(JSON.stringify({ errors: [{ message: "límite" }] }));
    }) as typeof fetch;
    expect(await medirConsumo(undefined, new Date(), pedir)).toEqual({
      ok: false,
      motivo: "sin_llave",
    });
    expect(llamadas).toBe(0);
    expect(await medirConsumo("llave", new Date(), pedir)).toMatchObject({
      ok: false,
      motivo: "error",
      detalle: "límite",
    });
  });

  it("con respuesta buena, devuelve la medida", async () => {
    const pedir = (async () =>
      new Response(JSON.stringify(respuesta))) as typeof fetch;
    const r = await medirConsumo("llave", new Date(), pedir);
    expect(r).toMatchObject({ ok: true });
  });
});

describe("cuándo sale el correo", () => {
  const ahora = 1_800_000_000_000;

  it("en verde nunca", () => {
    expect(debeAvisar(null, "verde", ahora)).toBe(false);
    expect(debeAvisar({ nivel: "emergencia" }, "verde", ahora)).toBe(false);
  });

  it("cuando empeora, siempre", () => {
    expect(debeAvisar(null, "aviso", ahora)).toBe(true);
    expect(debeAvisar({ nivel: "verde" }, "aviso", ahora)).toBe(true);
    expect(
      debeAvisar({ nivel: "aviso", avisadoEn: ahora }, "emergencia", ahora),
    ).toBe(true);
  });

  it("igual que antes: solo cada 6 horas", () => {
    expect(
      debeAvisar({ nivel: "aviso", avisadoEn: ahora - 1000 }, "aviso", ahora),
    ).toBe(false);
    expect(
      debeAvisar(
        { nivel: "aviso", avisadoEn: ahora - REPETIR_AVISO_MS },
        "aviso",
        ahora,
      ),
    ).toBe(true);
  });
});

describe("dónde vive la alarma", () => {
  it("el canario enseña la última medida", () => {
    const salud = leer("src/app/datos/salud/route.ts");
    expect(salud).toContain("ultimaMedida()");
    expect(salud).toMatch(/\n\s+consumo,\n/);
  });

  it("el correo va a soporte@windoce.com", () => {
    const vigilar = leer("src/lib/consumo/vigilar.ts");
    expect(vigilar).toContain('export const AVISAR_A = "soporte@windoce.com";');
    expect(vigilar).toContain("debeAvisar(anterior, nivel, ahora)");
  });
});
