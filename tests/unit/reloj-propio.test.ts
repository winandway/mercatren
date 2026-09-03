import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  TICK_MINIMO_MS,
  TICK_PRESUPUESTO_MS,
  VIGILANTE_CADA_MS,
} from "@/lib/reloj/constantes";

/**
 * EL RELOJ PROPIO DEL SITIO (3 sep 2026). El de GitHub corría cinco veces al
 * día; de él dependía todo lo automático. Ahora late la plataforma.
 */
const leer = (r: string) => readFileSync(r, "utf-8");

describe("el reloj propio", () => {
  it("está declarado en yadominios.json, cada minuto", () => {
    const cfg = JSON.parse(leer("yadominios.json")) as {
      triggers?: { crons?: string[] };
    };
    expect(cfg.triggers?.crons).toContain("* * * * *");
  });

  it("cada latido cabe en lo que Cloudflare deja correr tras la respuesta (30 s)", () => {
    expect(TICK_PRESUPUESTO_MS).toBeLessThanOrEqual(25_000);
    /* Y dos latidos no se pisan: el reclamo exige más tiempo entre ellos que
       lo que dura uno. */
    expect(TICK_MINIMO_MS).toBeGreaterThan(TICK_PRESUPUESTO_MS);
    expect(VIGILANTE_CADA_MS).toBe(20 * 60_000);
  });

  it("la puerta contesta primero y trabaja después, y no es pública", () => {
    const ruta = leer("src/app/datos/reloj/route.ts");
    expect(ruta).toContain('peticion.headers.get("x-yad-cron")');
    expect(ruta).toContain(
      "autorizadoPorLlave(peticion, env.SINCRONIZAR_LLAVE)",
    );
    expect(ruta).toContain("{ status: 404 }");
    expect(ruta).toContain("await reclamarTick(ahoraMs)");
    expect(ruta).toContain("ctx.waitUntil(trabajo)");
    /* El 202 sale después de reclamar y antes de que termine el trabajo. */
    expect(ruta.indexOf("ctx.waitUntil(trabajo)")).toBeLessThan(
      ruta.indexOf("status: 202"),
    );
  });

  it("el reclamo es un UPDATE condicionado sobre la marca del latido", () => {
    const tick = leer("src/lib/reloj/tick.ts");
    expect(tick).toContain(
      "cast(${configuracion.valor} as integer) < ${limite}",
    );
    expect(tick).toContain("LLAVE_LATIDO_SINCRONIZAR");
  });

  it("el latido hace lo importante por orden: vigilante, importación, afinado, barrido, stock, traducción", () => {
    const tick = leer("src/lib/reloj/tick.ts");
    const orden = [
      'correrVigilante("reloj")',
      "avanzarImportacionesEnCurso(",
      "afinarImportados({",
      "barrerNoVerificados()",
      "refrescarExistenciasCj(",
      "traducirDesdeElReloj({",
    ];
    let desde = 0;
    for (const paso of orden) {
      const i = tick.indexOf(paso, desde);
      expect(i, paso).toBeGreaterThan(-1);
      desde = i;
    }
  });

  it("el middleware reescribe /__scheduled a /datos/reloj ANTES del idioma (app/__scheduled sería privado y daría 404)", () => {
    const mw = leer("src/middleware.ts");
    expect(mw).toContain('pathname === "/__scheduled"');
    expect(mw).toContain('url.pathname = "/datos/reloj"');
    expect(mw.indexOf('pathname === "/__scheduled"')).toBeLessThan(
      mw.indexOf("quiereMarkdown(request)"),
    );
    /* Y no existe una carpeta app/__scheduled: Next no la serviría. */
    expect(existsSync("src/app/__scheduled")).toBe(false);
  });
});
