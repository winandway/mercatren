import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  cuantoCobrarPara,
  loQueCuestaLaTarjeta,
  repartoDelCobro,
} from "@/lib/cobros/reparto";
import {
  COMISION_TARJETA_PB,
  PROCESADOR_FIJO_CENTAVOS,
  PROCESADOR_PORCENTAJE_PB,
} from "@/lib/dinero";

/**
 * EL REPARTO DE UN COBRO POR ENLACE (26 ago 2026).
 *
 * ══ LA FUGA QUE ESTAS PRUEBAS FIJAN ══
 *
 * Al acreditar un cobro se le descontaba al comercio SOLO el 3% de Mercatren,
 * sin mirar por dónde entró el dinero. Con tarjeta, el 2,9% + $0.30 de Stripe
 * salía del margen: en una factura de $7.475 el margen real era **$7,17 de
 * $224,25**, y por debajo de unos once dólares el cobro daba pérdida.
 */
describe("el reparto por método", () => {
  it("con TARJETA descuenta el procesador y el margen queda entero", () => {
    const r = repartoDelCobro(747_500, "tarjeta");
    const stripe =
      Math.round((747_500 * PROCESADOR_PORCENTAJE_PB) / 10_000) +
      PROCESADOR_FIJO_CENTAVOS;
    expect(r.procesador).toBe(stripe);
    expect(r.margen).toBe(Math.round((747_500 * COMISION_TARJETA_PB) / 10_000));
    /* Lo que le llega a Mercatren menos lo que acredita ES el margen: eso es
       exactamente lo que no se cumplía antes. */
    expect(r.pagaElCliente - r.procesador - r.recibeElComercio).toBe(r.margen);
  });

  it("por ZELLE y por TRANSFERENCIA no hay procesador: cero", () => {
    for (const metodo of ["zelle", "transferencia"] as const) {
      const r = repartoDelCobro(747_500, metodo);
      expect(r.procesador, metodo).toBe(0);
      expect(r.recibeElComercio, metodo).toBe(747_500 - r.margen);
    }
  });

  it("las tres partes SIEMPRE suman el monto: ni un centavo suelto", () => {
    for (const monto of [1_000, 12_345, 286_071, 747_500, 5_000_000]) {
      for (const metodo of ["tarjeta", "zelle", "transferencia"] as const) {
        const r = repartoDelCobro(monto, metodo);
        expect(
          r.procesador + r.margen + r.recibeElComercio,
          `${monto} por ${metodo}`,
        ).toBe(monto);
      }
    }
  });

  it("nunca se le acredita un negativo al comercio", () => {
    /* Con un cobro de un dólar el fijo de $0.30 se come casi todo. Un neto
       negativo escrito en una billetera es una deuda que nadie contrajo. */
    const r = repartoDelCobro(100, "tarjeta");
    expect(r.recibeElComercio).toBeGreaterThanOrEqual(0);
  });

  it("dice cuánto le cuesta al comercio aceptar tarjeta", () => {
    /* Es el número con el que se decide: en $7.475 son más de doscientos
       dólares; en $20, ochenta centavos. */
    expect(loQueCuestaLaTarjeta(747_500)).toBe(
      repartoDelCobro(747_500, "tarjeta").procesador,
    );
    expect(loQueCuestaLaTarjeta(747_500)).toBeGreaterThan(20_000);
  });
});

describe("cuánto cobrar para recibir X limpios", () => {
  it("con tarjeta hay que cobrar MÁS que sin ella", () => {
    const conTarjeta = cuantoCobrarPara(725_075, "tarjeta");
    const sinTarjeta = cuantoCobrarPara(725_075, "zelle");
    expect(conTarjeta).toBeGreaterThan(sinTarjeta);
    expect(sinTarjeta).toBe(747_500);
  });

  it("y el resultado de verdad deja ese neto o un pelo más", () => {
    for (const metodo of ["tarjeta", "zelle"] as const) {
      const cobrar = cuantoCobrarPara(725_075, metodo);
      expect(
        repartoDelCobro(cobrar, metodo).recibeElComercio,
        metodo,
      ).toBeGreaterThanOrEqual(725_075);
    }
  });
});

describe("el candado de la fuga", () => {
  it("acreditar un cobro NO puede volver a descontar solo el margen", () => {
    const fuente = readFileSync("src/lib/cobros/acciones.ts", "utf8");
    /* Las dos ramas —tarjeta y Zelle— pasan por el mismo reparto, para que el
       día que cambie el margen no haya dos sitios que actualizar. */
    expect(fuente.match(/repartoDelCobro\(/g)?.length).toBe(2);
    const sinComentarios = fuente
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(sinComentarios).not.toContain("calcularComisionCentavos");
  });
});

describe("qué métodos acepta un cobro", () => {
  it("sin filas guardadas se aceptan TODOS", async () => {
    const { aceptaMetodo, METODOS } = await import("@/lib/cobros/reparto");
    /* Es como se comportan los cobros creados antes de que esto existiera:
       nadie se queda sin poder cobrar por un cambio de esquema. */
    for (const m of METODOS) expect(aceptaMetodo([], m), m).toBe(true);
  });

  it("con una lista, solo los que están", async () => {
    const { aceptaMetodo } = await import("@/lib/cobros/reparto");
    expect(aceptaMetodo(["transferencia"], "transferencia")).toBe(true);
    expect(aceptaMetodo(["transferencia"], "tarjeta")).toBe(false);
    expect(aceptaMetodo(["transferencia", "zelle"], "zelle")).toBe(true);
  });

  it("el formulario no puede dejar una factura que nadie pueda pagar", async () => {
    const { metodosDesdeFormulario } = await import("@/lib/cobros/reparto");
    /* Nada marcado, o basura: lista vacía, que significa «todos». */
    expect(metodosDesdeFormulario([])).toEqual([]);
    expect(metodosDesdeFormulario(["inventado", ""])).toEqual([]);
    /* Y no se repiten. */
    expect(metodosDesdeFormulario(["zelle", "zelle", "tarjeta"])).toEqual([
      "zelle",
      "tarjeta",
    ]);
  });

  it("la página del cobro respeta la elección", () => {
    const pagina = readFileSync(
      "src/app/[locale]/cobro/[enlace]/page.tsx",
      "utf8",
    );
    expect(pagina).toContain("aceptaMetodo(metodosAceptados");
    expect(pagina).toContain("metodosDelCobro.cobroId");
  });
});
