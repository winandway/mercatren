import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * SIN CONFIRMACIÓN DE STOCK NO SE COBRA (3 sep 2026). La MT-000013 se cobró
 * por una camiseta sin ninguna talla en el almacén de EE. UU. porque el
 * candado «dejaba pasar si CJ no contestaba» — y CJ no contestaba porque la
 * importación masiva le hablaba a la vez. Dos cobros a la misma clienta.
 */
describe("el candado de stock del checkout es cerrado", () => {
  it("si CJ no confirma (null), NO se cobra y se pide reintentar", () => {
    const fuente = readFileSync("src/lib/pedidos/acciones.ts", "utf-8");
    expect(fuente).toContain("if (enCj === null) {");
    expect(fuente).toContain('t("sinConfirmarStock"');
    /* La rama de «no hay» sigue igual. */
    expect(fuente).toContain("if (enCj === false) {");
    /* Y nadie vuelve a escribir el «se deja pasar». */
    expect(fuente).not.toMatch(/Si CJ no contesta se deja pasar/);
  });

  it("el texto existe en los dos idiomas y dice que NO se cobró", () => {
    const buscar = (ruta: string): string | null => {
      const d = JSON.parse(readFileSync(ruta, "utf-8"));
      const rec = (o: unknown): string | null => {
        if (!o || typeof o !== "object") return null;
        const r = o as Record<string, unknown>;
        if (typeof r.sinConfirmarStock === "string") return r.sinConfirmarStock;
        for (const v of Object.values(r)) {
          const x = rec(v);
          if (x) return x;
        }
        return null;
      };
      return rec(d);
    };
    expect(buscar("messages/es.json")).toContain("No se cobró");
    expect(buscar("messages/en.json")).toContain("Nothing was charged");
  });

  it("el refresco de stock mira primero lo publicado", () => {
    const ex = readFileSync("src/lib/cj/existencias.ts", "utf-8");
    expect(ex).toContain(
      "case when ${productos.estado} = 'publicado' then 0 else 1 end",
    );
  });
});
