import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { firmar } from "@/lib/cobros/firma";

/**
 * EL AVISO AL SISTEMA DEL COMERCIO CUANDO ENTRA UN PAGO (24 ago 2026).
 *
 * Se lo prometimos al comercio piloto: su sistema hace la factura y quiere
 * enterarse solo cuando el cliente paga, sin estar preguntando cada minuto.
 */
describe("la firma", () => {
  it("es HMAC-SHA256 en hexadecimal, y cambia si cambia una coma del cuerpo", async () => {
    const a = await firmar('{"referencia":"F-1"}', "whsec_abc");
    const b = await firmar('{"referencia":"F-2"}', "whsec_abc");
    const c = await firmar('{"referencia":"F-1"}', "whsec_otro");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
    /* Con otro secreto, otra firma: es lo que impide que cualquiera que
       adivine la dirección del comercio le diga que le pagaron. */
    expect(a).not.toBe(c);
  });

  it("la misma entrada da siempre la misma firma (el otro lado la puede comprobar)", async () => {
    expect(await firmar("hola", "s")).toBe(await firmar("hola", "s"));
  });
});

describe("cómo se manda", () => {
  const fuente = readFileSync("src/lib/cobros/aviso-al-comercio.ts", "utf8");

  it("va firmado, con tiempo máximo, y anota SIEMPRE el resultado", () => {
    expect(fuente).toContain("x-mercatren-firma");
    expect(fuente).toContain("AbortSignal.timeout");
    /* Un aviso que falla en silencio es peor que no tenerlo: el comercio cree
       que su sistema está al día. */
    expect(fuente).toContain("ultimoError");
    expect(fuente).toContain("ultimoIntentoEn");
  });

  it("sin dirección configurada no hace nada, y eso NO es un error", () => {
    expect(fuente).toContain(
      "if (!destino || !destino.activo || !destino.url) return;",
    );
  });

  it("nunca puede tumbar la acreditación: va al final y en su propio try", () => {
    const tarjeta = readFileSync("src/lib/cobros/acciones.ts", "utf8");
    const zelle = readFileSync("src/lib/zelle/acciones.ts", "utf8");
    for (const [nombre, codigo] of [
      ["tarjeta", tarjeta],
      ["zelle", zelle],
    ] as const) {
      const i = codigo.indexOf("avisarAlComercio");
      expect(i, `falta el aviso en ${nombre}`).toBeGreaterThan(0);
      /* El `try` que lo envuelve está justo antes. */
      expect(codigo.slice(Math.max(0, i - 400), i)).toContain("try {");
    }
  });

  it("y el secreto no viaja al navegador", () => {
    const pagina = readFileSync(
      "src/app/[locale]/panel/mi-tienda/page.tsx",
      "utf8",
    );
    /* Se lee si HAY secreto, nunca cuál es. */
    expect(pagina).toContain("tieneSecreto");
    expect(pagina).not.toContain("secreto: webhooksTienda.secreto");
  });
});
