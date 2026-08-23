import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * LA DEMOSTRACIÓN DEL PANEL (`public/demo/panel-ventas.html`).
 *
 * Es un HTML estático con los datos dentro, así que ningún candado del
 * proyecto lo mira. Y sus clientes lo ven como «así se ve tu panel»: un dato
 * que contradiga una regla del sistema confunde justo a quien se le está
 * explicando. Dos veces pasó en un día —conceptos de ferretería en una tienda
 * de maletas, y ventas por Zelle de $39 cuando Zelle es desde $200—. Esta
 * prueba lee el archivo y se pone roja si vuelve a pasar.
 */
const html = readFileSync("public/demo/panel-ventas.html", "utf8");

/** Los productos del demo: clave → precio. */
function productos(): Record<string, number> {
  const P: Record<string, number> = {};
  for (const m of html.matchAll(/^\s+(\w+):\["[^"]+",([\d.]+)\],?$/gm)) {
    P[m[1]!] = Number.parseFloat(m[2]!);
  }
  return P;
}

/** Las ventas: [día, comprador, método, estado, renglones]. */
function ventas() {
  const P = productos();
  return [
    ...html.matchAll(/\[(\d+),"([^"]+)","(\w+)","\w+",(\[\[.*?\]\])\],/g),
  ].map((m) => {
    const renglones = JSON.parse(m[4]!) as [string, number][];
    const bruto = renglones.reduce(
      (s, [k, q]) => s + (P[k] ?? Number.NaN) * q,
      0,
    );
    return {
      comprador: m[2]!,
      metodo: m[3]!,
      bruto: Math.round(bruto * 100) / 100,
    };
  });
}

describe("la demostración del panel no contradice al sistema", () => {
  it("la lista de ventas se lee de verdad (no es una prueba vacía)", () => {
    const v = ventas();
    expect(v.length).toBeGreaterThanOrEqual(20);
    expect(v.some((x) => x.metodo === "zelle")).toBe(true);
    expect(v.every((x) => Number.isFinite(x.bruto))).toBe(true);
  });

  it("NINGUNA venta por Zelle baja de $200, que es la regla del sistema", () => {
    /* Lo encontró el dueño grabando el video por tercera vez. */
    const chicas = ventas().filter(
      (x) => x.metodo === "zelle" && x.bruto < 200,
    );
    expect(
      chicas,
      `ventas Zelle por debajo de $200: ${JSON.stringify(chicas)}`,
    ).toEqual([]);
  });

  it("y el propio demo lleva el guard, por si alguien toca la lista", () => {
    expect(html).toContain("const ZELLE_MINIMO = 200");
    expect(html).toMatch(
      /metodo==="zelle" && bruto < ZELLE_MINIMO\) \? "tarjeta"/,
    );
  });

  it("el mes vendido anda en el orden de los seis mil", () => {
    const total = ventas().reduce((s, x) => s + x.bruto, 0);
    expect(total).toBeGreaterThan(5500);
    expect(total).toBeLessThan(8000);
  });

  it("no arrastra ferretería ni la sociedad anterior ni vocabulario prohibido", () => {
    /* Los productos son de NUESTRAS tiendas de EE. UU.; los conceptos de los
       cobros salían de memoria de otro caso («10 sacos de cemento»). */
    for (const palabra of [
      /cemento/i,
      /ferreter/i,
      /llave de paso/i,
      /albañil/i,
      /windoce/i,
      /billetera/i,
      /\bsaldo\b/i,
      /fondos/i,
      /liquidar/i,
      /por cuenta de/i,
    ]) {
      expect(html, `aparece ${palabra}`).not.toMatch(palabra);
    }
  });

  it("no lo indexa Google: unas ventas de mentira no pueden salir como reales", () => {
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });

  it("la pestaña de Zelle dice desde cuánto, en los dos idiomas", () => {
    expect(html).toContain("disponibles desde $200");
    expect(html).toContain("available from $200");
  });
});
