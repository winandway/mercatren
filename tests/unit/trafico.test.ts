import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { esRobot, rutaLimpia } from "@/lib/trafico/bots";

/**
 * EL TRÁFICO CUENTA PERSONAS, NO ROBOTS (30 ago 2026).
 *
 * Pedido del dueño: «no contabilice los robots, solo las visitas de las
 * personas». El patrón de Plausible/Umami: el pulso exige JavaScript (los
 * robots ni llegan) y el User-Agent se revisa de respaldo.
 */
describe("el filtro de robots", () => {
  it("LOS ROBOTS CONOCIDOS NO CUENTAN", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "facebookexternalhit/1.1",
      "WhatsApp/2.23.20",
      "curl/8.4.0",
      "python-requests/2.31",
      "Mozilla/5.0 HeadlessChrome/120",
      "GPTBot/1.0",
      "",
      null,
    ]) {
      expect(esRobot(ua), `debió filtrar: ${ua}`).toBe(true);
    }
  });

  it("las personas de verdad SÍ cuentan", () => {
    for (const ua of [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
    ]) {
      expect(esRobot(ua), `no debió filtrar: ${ua}`).toBe(false);
    }
  });

  it("la ruta se guarda sin query ni fragmento — ahí viajan datos ajenos", () => {
    expect(rutaLimpia("/es/catalogo?q=secreto#arriba")).toBe("/es/catalogo");
    expect(rutaLimpia("")).toBe("/");
  });
});

describe("los candados del pulso", () => {
  it("EL PANEL NO SE CUENTA y el visitante es un hash del día, sin cookies", () => {
    const fuente = readFileSync("src/app/datos/visita/route.ts", "utf-8");
    expect(fuente).toContain("/^\\/(es|en)\\/panel/");
    expect(fuente).toContain("hashDelDia");
    expect(fuente).toContain("cf-ipcountry");
    /* Medir jamás estorba: la ruta nunca responde error al visitante. */
    expect(fuente).toContain("return Response.json({ ok: true });");
  });

  it("el pulso vive en la tienda, y el tráfico queda cerrado con el disfraz", () => {
    const layout = readFileSync(
      "src/app/[locale]/(tienda)/layout.tsx",
      "utf-8",
    );
    expect(layout).toContain("PulsoDeVisita");
    const soloEquipo = readFileSync("src/lib/panel/solo-equipo.ts", "utf-8");
    expect(soloEquipo).toContain('"trafico"');
  });
});
