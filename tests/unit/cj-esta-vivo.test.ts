import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { cjSigueVivoTrasElFallo, leerUltimaLlamada } from "@/lib/cj/puntos";

/**
 * EL CANDADO DE «CJ NO RESPONDE» CUANDO CJ SÍ RESPONDIÓ (21 sep 2026).
 *
 * Lo que se vio en producción, con CJ perfectamente vivo:
 *   `/datos/salud` → `proveedor: "error"`, y el vigilante levantando una
 *   alerta ROJA con correo a soporte. El fallo de verdad, en el mismo
 *   renglón del reloj: «variantes: Product has been removed from shelves,
 *   pid:1985602065137795073» — un producto descontinuado.
 *
 * Una alarma roja que salta sin avería enseña a ignorar las alarmas rojas.
 * Si alguien vuelve a leer «le fue mal a la última llamada» como «CJ está
 * caído», estas pruebas se ponen en rojo.
 */

/** El mensaje exacto que CJ devolvió el 21 sep 2026. */
const DESCONTINUADO = "Product has been removed from shelves";

describe("un «no» del producto no es CJ caído", () => {
  it("el mensaje real de producción deja a CJ vivo", () => {
    expect(cjSigueVivoTrasElFallo(200, DESCONTINUADO)).toBe(true);
  });

  it("da igual cómo venga escrito el mensaje", () => {
    expect(
      cjSigueVivoTrasElFallo(200, "PRODUCT HAS BEEN REMOVED FROM SHELVES"),
    ).toBe(true);
    expect(
      cjSigueVivoTrasElFallo(200, "The product does not exist, pid:123"),
    ).toBe(true);
    expect(cjSigueVivoTrasElFallo(200, "No variant found for this pid")).toBe(
      true,
    );
  });
});

describe("lo que SÍ es CJ caído", () => {
  it("sin respuesta ninguna", () => {
    expect(cjSigueVivoTrasElFallo(0, null)).toBe(false);
  });

  it("un error del servidor de CJ", () => {
    expect(cjSigueVivoTrasElFallo(502, "Bad gateway")).toBe(false);
    expect(cjSigueVivoTrasElFallo(500, DESCONTINUADO)).toBe(false);
  });

  it("la llave rechazada: el circuito de dinero queda muerto", () => {
    expect(cjSigueVivoTrasElFallo(200, "Invalid access token")).toBe(false);
    expect(cjSigueVivoTrasElFallo(401, "Unauthorized")).toBe(false);
  });

  it("un mensaje que no se entiende se trata como avería, no se esconde", () => {
    expect(cjSigueVivoTrasElFallo(200, "Something went wrong")).toBe(false);
    expect(cjSigueVivoTrasElFallo(200, "")).toBe(false);
  });

  it("quedarse sin puntos tiene su propio estado, no es «vivo»", () => {
    expect(
      cjSigueVivoTrasElFallo(
        200,
        "Insufficient API points. Used today: 61520, Remaining: 0, Required: 50.",
      ),
    ).toBe(false);
  });
});

describe("el apunte de la última llamada", () => {
  const AHORA = Date.parse("2026-09-21T20:00:00Z");

  it("guarda si CJ estaba contestando, aparte de si le fue bien", () => {
    const guardado = JSON.stringify({
      ok: false,
      vivo: true,
      enMs: AHORA - 1000,
    });
    expect(leerUltimaLlamada(guardado, AHORA)).toEqual({
      ok: false,
      vivo: true,
      enMs: AHORA - 1000,
    });
  });

  it("un apunte de antes del 21 sep (sin «vivo») se lee como se leía", () => {
    const viejo = JSON.stringify({ ok: false, enMs: AHORA - 1000 });
    expect(leerUltimaLlamada(viejo, AHORA)?.vivo).toBe(false);
    const viejoBueno = JSON.stringify({ ok: true, enMs: AHORA - 1000 });
    expect(leerUltimaLlamada(viejoBueno, AHORA)?.vivo).toBe(true);
  });
});

/**
 * EL CANDADO DONDE SE PUEDE DESHACER SIN QUE NADA FALLE.
 *
 * La sonda decide en una línea. Cambiarla de `ultima.vivo` a `ultima.ok`
 * compila, pasa todas las pruebas de lógica y devuelve la alarma falsa. Y el
 * apunte del cliente: si la caída de red vuelve a salir sin anotarse, la
 * sonda tarda media hora en enterarse de un CJ de verdad caído.
 */
describe("los dos sitios donde esto se deshace solo", () => {
  it("la sonda lee si CJ contesta, no si le fue bien a la llamada", () => {
    const sonda = readFileSync("src/lib/salud/piezas.ts", "utf8");
    expect(sonda).toContain("ultima.vivo");
    expect(sonda).not.toContain("ultima.ok ?");
  });

  it("las tres salidas sin respuesta de CJ anotan que no contesta", () => {
    const cliente = readFileSync("src/lib/cj/cliente.ts", "utf8");
    /* Los tres `return` que salen sin que CJ haya contestado: la red caída
       al pedir el token, la llave rechazada, y la red caída en la llamada.
       Cualquiera de los tres sin apunte deja la sonda diciendo «ok» durante
       media hora con CJ caído. */
    const salidas = [
      "no se pudo hablar con CJ",
      "const token = cuerpo.data?.accessToken;",
      "no se pudo llamar a CJ",
    ];
    for (const marca of salidas) {
      const desde = cliente.indexOf(marca);
      expect(desde, marca).toBeGreaterThan(-1);
      /* El apunte tiene que estar antes del `return` de esa rama. */
      const trozo = cliente.slice(desde, desde + 700);
      const hastaElReturn = trozo.slice(0, trozo.indexOf("return"));
      expect(hastaElReturn, marca).toContain("anotarComoFue(false, false)");
    }
  });

  it("el «no» del producto se clasifica antes de anotarlo", () => {
    const cliente = readFileSync("src/lib/cj/cliente.ts", "utf8");
    expect(cliente).toContain("cjSigueVivoTrasElFallo(respuesta.status");
  });
});
