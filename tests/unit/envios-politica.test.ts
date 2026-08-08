import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  MODOS_ENVIO,
  acotarPorcentaje,
  claveDeAviso,
  costoEnvioCentavos,
  despacha,
  entregasDisponibles,
  POLITICA_POR_DEFECTO,
  PORCENTAJE_MAXIMO_PB,
  porcentajeAPuntosBase,
  porcentajeVisible,
  type PoliticaEnvio,
} from "@/lib/envios/politica";

const con = (
  modo: PoliticaEnvio["modo"],
  porcentajePuntosBase = 0,
): PoliticaEnvio => ({ modo, porcentajePuntosBase });

/**
 * EL ENVÍO ES DINERO QUE PAGA EL COMPRADOR, así que estas pruebas son tercas.
 */
describe("cuánto cuesta el envío", () => {
  it("un 4% sobre $100 son $4", () => {
    expect(costoEnvioCentavos(con("porcentaje", 400), 10_000)).toBe(400);
  });

  it("redondea hacia arriba, nunca en contra del que asume el costo", () => {
    /* 4% de $1.23 son 4.92 centavos: se cobran 5, no 4. */
    expect(costoEnvioCentavos(con("porcentaje", 400), 123)).toBe(5);
  });

  it("quien no cobra por enviar, no cobra: cero", () => {
    expect(costoEnvioCentavos(con("incluido"), 200_000)).toBe(0);
    expect(costoEnvioCentavos(con("solo_retiro"), 200_000)).toBe(0);
    expect(costoEnvioCentavos(con("sin_definir"), 200_000)).toBe(0);
  });

  it("un porcentaje en cero no cobra aunque el modo diga porcentaje", () => {
    expect(costoEnvioCentavos(con("porcentaje", 0), 200_000)).toBe(0);
  });

  it("un subtotal de cero o negativo no inventa un cobro", () => {
    expect(costoEnvioCentavos(con("porcentaje", 400), 0)).toBe(0);
    expect(costoEnvioCentavos(con("porcentaje", 400), -5_000)).toBe(0);
  });

  it("devuelve centavos enteros, siempre", () => {
    for (const sub of [333, 1_007, 7_777, 99_999, 1_234_567]) {
      const costo = costoEnvioCentavos(con("porcentaje", 450), sub);
      expect(Number.isInteger(costo), `con ${sub} salió decimal`).toBe(true);
    }
  });

  it("nunca cobra más de la mitad del producto, pase lo que pase", () => {
    /* El tope existe porque un dedo de más convierte un 4% en un 40%. */
    const absurdo = costoEnvioCentavos(con("porcentaje", 999_999), 10_000);
    expect(absurdo).toBe(5_000);
  });
});

describe("el porcentaje que escribe el comercio", () => {
  it("se guarda en puntos base, como todas las comisiones", () => {
    expect(porcentajeAPuntosBase("4")).toBe(400);
    expect(porcentajeAPuntosBase("4.5")).toBe(450);
    expect(porcentajeAPuntosBase("12")).toBe(1_200);
  });

  it("acepta la coma, que es como se escribe aquí", () => {
    expect(porcentajeAPuntosBase("4,5")).toBe(450);
  });

  it("lo que no es un número se lee como cero, no revienta", () => {
    expect(porcentajeAPuntosBase("")).toBe(0);
    expect(porcentajeAPuntosBase("mucho")).toBe(0);
    expect(porcentajeAPuntosBase("-3")).toBe(0);
  });

  it("se acota al tope al guardarlo, no solo al cobrarlo", () => {
    expect(porcentajeAPuntosBase("400")).toBe(PORCENTAJE_MAXIMO_PB);
    expect(acotarPorcentaje(1_000_000)).toBe(PORCENTAJE_MAXIMO_PB);
  });

  it("y se muestra otra vez como lo escribió", () => {
    expect(porcentajeVisible(400)).toBe("4");
    expect(porcentajeVisible(450)).toBe("4.5");
    expect(porcentajeVisible(1_200)).toBe("12");
    expect(porcentajeVisible(0)).toBe("0");
  });

  it("ida y vuelta no cambia el número", () => {
    for (const texto of ["0", "1", "4", "4.5", "10", "25", "50"]) {
      expect(porcentajeVisible(porcentajeAPuntosBase(texto))).toBe(texto);
    }
  });
});

describe("qué puede elegir el comprador", () => {
  it("el retiro SIEMPRE está, aunque el comercio despache", () => {
    /* Quitarle esa opción sería cobrarle un flete que no pidió. */
    for (const modo of [
      "sin_definir",
      "solo_retiro",
      "porcentaje",
      "incluido",
    ] as const) {
      expect(entregasDisponibles(con(modo, 400))).toContain("retiro");
    }
  });

  it("el envío solo aparece si el comercio dijo que despacha", () => {
    expect(entregasDisponibles(con("porcentaje", 400))).toContain("envio");
    expect(entregasDisponibles(con("incluido"))).toContain("envio");
    expect(entregasDisponibles(con("solo_retiro"))).not.toContain("envio");
    expect(entregasDisponibles(con("sin_definir"))).not.toContain("envio");
  });
});

describe("«sin definir» NO es «no envía»", () => {
  it("son dos estados distintos y no se pueden confundir", () => {
    /* Si a un comercio que sí despacha le enseñáramos "solo retiro", le
       estaríamos mintiendo a su comprador. Por eso no hay un booleano. */
    expect(claveDeAviso(con("sin_definir"))).not.toBe(
      claveDeAviso(con("solo_retiro")),
    );
  });

  it("un comercio recién creado arranca sin definir", () => {
    expect(POLITICA_POR_DEFECTO.modo).toBe("sin_definir");
    expect(despacha(POLITICA_POR_DEFECTO)).toBe(false);
  });

  it("cada modo tiene su propio aviso", () => {
    const claves = (
      ["sin_definir", "solo_retiro", "porcentaje", "incluido"] as const
    ).map((m) => claveDeAviso(con(m)));
    expect(new Set(claves).size).toBe(4);
  });
});

describe("el esquema y la lógica no se pueden separar", () => {
  it("la lista de modos del esquema es la misma que la de aquí", () => {
    /* El esquema repite los modos en vez de importarlos, para no arrastrar la
       base al paquete del navegador. Eso está bien, pero deja dos listas que
       pueden separarse: si alguien agrega un modo aquí y no allá, la base
       rechaza el valor en producción y el comercio no puede guardar.

       Se lee el TEXTO del esquema, no se importa, por lo mismo de siempre:
       importarlo mete sus mil cuatrocientas líneas en la cobertura. */
    const esquema = readFileSync(
      join(import.meta.dirname, "..", "..", "src", "lib", "db", "schema.ts"),
      "utf8",
    );

    const bloque = esquema.slice(esquema.indexOf("const MODOS_ENVIO_DB"));
    const enElEsquema = (bloque.slice(0, 220).match(/"([a-z_]+)"/g) ?? []).map(
      (c) => c.replaceAll('"', ""),
    );

    expect(enElEsquema).toEqual([...MODOS_ENVIO]);
  });
});
