import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * EL BUCLE INFINITO DE COLOMBIA (2 sep 2026): «712 de 0 recalculados» con
 * 624 pendientes que nunca bajaban. Ocho productos sin costo base ya tenían
 * fila de envío; el insert chocaba, el catch se lo tragaba, se contaban como
 * hechos y la base los devolvía otra vez de primero. Tres candados.
 */
describe("el recálculo de precios no se puede atascar", () => {
  const servidor = readFileSync("src/lib/destino/recalcular-us.ts", "utf-8");
  const pantalla = readFileSync(
    "src/components/panel/recalcular-precios.tsx",
    "utf-8",
  );

  it("la fila de envío se PISA (upsert), nunca se inserta a secas", () => {
    expect(servidor.match(/onConflictDoUpdate\(/g)?.length).toBe(2);
    expect(servidor).not.toMatch(/\.delete\(enviosProducto\)/);
  });

  it("marcar el estimado ya no se traga el fallo ni cuenta como hecho lo que no se marcó", () => {
    const marcar = servidor.slice(
      servidor.indexOf("async function marcarEstimado"),
    );
    expect(marcar).not.toContain("catch (fallo)");
    /* Y la llamada vive DENTRO del try del bucle. */
    const bucle = servidor.slice(
      servidor.indexOf("for (const p of pendientes"),
    );
    expect(bucle.indexOf("try {")).toBeLessThan(
      bucle.indexOf("await marcarEstimado("),
    );
  });

  it("los que no salen de la cola van al final, no de primeros", () => {
    expect(servidor).toMatch(
      /\.orderBy\(\s*sql`\$\{enviosProducto\.cotizadoEn\} is not null`/,
    );
  });

  it("la pantalla se detiene y lo dice si tres tandas seguidas no bajan lo pendiente", () => {
    expect(pantalla).toContain("sinAvance >= 3");
    expect(pantalla).toContain('t("noAvanza"');
    /* Y el total es lo hecho más lo que falta: nunca más «712 de 0». */
    expect(pantalla).toContain("Math.max(pendientes, hechas + faltan, 1)");
    const es = JSON.parse(readFileSync("messages/es.json", "utf-8"));
    const en = JSON.parse(readFileSync("messages/en.json", "utf-8"));
    expect(es.panel.preciosUs.noAvanza).toContain("{restantes}");
    expect(en.panel.preciosUs.noAvanza).toContain("{restantes}");
  });
});
