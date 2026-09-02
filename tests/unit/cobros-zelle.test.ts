import { describe, expect, it } from "vitest";

import { decidirZelle, minimoAplicable } from "@/lib/cobros/zelle";
import { ZELLE_MINIMO_CENTAVOS } from "@/lib/dinero";

const BASE = {
  habilitada: true,
  minimoTiendaCentavos: null,
  minimoGlobalCentavos: null,
  receptorConfigurado: true,
};

describe("Zelle en los enlaces de cobro", () => {
  it("con todo configurado y monto suficiente, se ofrece", () => {
    const d = decidirZelle(BASE, ZELLE_MINIMO_CENTAVOS);
    expect(d.disponible).toBe(true);
  });

  it("sin ZELLE_CORREO_RECEPTOR no hay Zelle para nadie", () => {
    /* Nunca se inventa un correo receptor: sin la variable, la opción no
       existe, aunque el equipo la haya encendido para la tienda. */
    const d = decidirZelle({ ...BASE, receptorConfigurado: false }, 999_999);
    expect(d).toMatchObject({ disponible: false, motivo: "sin_receptor" });
  });

  it("sin el interruptor de la tienda, tampoco", () => {
    const d = decidirZelle({ ...BASE, habilitada: false }, 999_999);
    expect(d).toMatchObject({ disponible: false, motivo: "no_habilitada" });
  });

  it("por debajo del mínimo se niega y dice desde cuánto sí", () => {
    const d = decidirZelle({ ...BASE, minimoTiendaCentavos: 5_000 }, 4_999);
    expect(d).toMatchObject({
      disponible: false,
      motivo: "monto_bajo",
      minimoCentavos: 5_000,
    });
  });

  it("justo en el mínimo pasa: es un mínimo, no un tope", () => {
    const d = decidirZelle({ ...BASE, minimoTiendaCentavos: 5_000 }, 5_000);
    expect(d.disponible).toBe(true);
  });

  it("el mínimo de la tienda manda sobre el general", () => {
    expect(
      minimoAplicable({
        minimoTiendaCentavos: 1_000,
        minimoGlobalCentavos: 50_000,
      }),
    ).toBe(1_000);
  });

  it("sin mínimo de tienda, manda el general", () => {
    expect(
      minimoAplicable({
        minimoTiendaCentavos: null,
        minimoGlobalCentavos: 7_500,
      }),
    ).toBe(7_500);
  });

  it("sin ninguno configurado, manda la regla del catálogo", () => {
    /* Una sola regla de dinero en todo el sitio, no dos que se desincronizan:
       el respaldo final es el mismo mínimo de Zelle del checkout. */
    expect(
      minimoAplicable({
        minimoTiendaCentavos: null,
        minimoGlobalCentavos: null,
      }),
    ).toBe(ZELLE_MINIMO_CENTAVOS);
  });

  it("un mínimo de la tienda en CERO vale: es «sin mínimo», no «sin dato»", () => {
    /* Cero es una decisión (esta tienda cobra cualquier monto por Zelle);
       null es la ausencia de decisión. Confundirlos haría imposible quitarle
       el mínimo a una tienda. */
    expect(
      minimoAplicable({
        minimoTiendaCentavos: 0,
        minimoGlobalCentavos: 50_000,
      }),
    ).toBe(0);
  });

  it("un mínimo corrupto se ignora en vez de romper la decisión", () => {
    expect(
      minimoAplicable({
        minimoTiendaCentavos: Number.NaN,
        minimoGlobalCentavos: -5,
      }),
    ).toBe(ZELLE_MINIMO_CENTAVOS);
  });
});

describe("SIN FILA, ZELLE ESTÁ DISPONIBLE: el equipo lo APAGA (21 ago 2026)", () => {
  /**
   * Antes era al revés —sin fila no había Zelle— y en la práctica eso
   * significó que **ningún comercio lo tenía**: un cobro de $620 salía solo
   * con tarjeta, y Zelle es la forma de pago de esta clientela.
   *
   * Lo que filtra lo que no compensa es el MÍNIMO, no el interruptor: por
   * debajo de él, validar la captura cuesta más de lo que deja el margen.
   */
  it("la consulta trata «sin fila» según la POLÍTICA GLOBAL (cambio del 2 sep 2026)", async () => {
    /* El 21 ago «sin fila» era disponible. El 2 sep el dueño cerró Zelle por
       defecto — solo tarjeta — y ahora lo decide la política: con «abierto»
       sigue valiendo la regla del 21 ago; con «cerrado» (el defecto) solo la
       tienda encendida a mano. La regla vive en zelleHabilitadaPara. */
    const { readFileSync } = await import("node:fs");
    const fuente = readFileSync("src/lib/cobros/consultas.ts", "utf8");
    expect(fuente).toContain("habilitada: zelleHabilitadaPara(");
    const { zelleHabilitadaPara } = await import("@/lib/cobros/zelle");
    expect(zelleHabilitadaPara("abierto", null)).toBe(true);
    expect(zelleHabilitadaPara("cerrado", null)).toBe(false);
  });

  it("y el interruptor sigue sirviendo para QUITÁRSELO a uno concreto", () => {
    /* Se conserva a propósito: si un comercio da problemas con las capturas,
       se le apaga sin tocar a los demás. */
    const d = decidirZelle({ ...BASE, habilitada: false }, 999_999);
    expect(d).toMatchObject({ disponible: false, motivo: "no_habilitada" });
  });

  it("el mínimo manda: $199.99 no, $200 sí", () => {
    /* Es el número que el dueño fijó de viva voz: «si pasa de doscientos
       dólares, Zelle debe ir en el link; si no pasa, se restringe». */
    expect(decidirZelle({ ...BASE }, 19_999)).toMatchObject({
      disponible: false,
      motivo: "monto_bajo",
    });
    expect(decidirZelle({ ...BASE }, 20_000)).toMatchObject({
      disponible: true,
    });
  });
});

/**
 * EL TOPE DE ZELLE (27 ago 2026).
 *
 * Un cobro de $2.774,04 se ofreció por Zelle y quien pagaba solo pudo mandar
 * $500: su banco se lo cortó en la pantalla del envío. Ofrecerlo por encima del
 * tope manda a alguien a una pantalla donde no puede terminar.
 */
describe("el tope de Zelle", () => {
  const base = {
    habilitada: true,
    minimoTiendaCentavos: null,
    minimoGlobalCentavos: null,
    receptorConfigurado: true,
  };

  it("EL CASO REAL: $2.774,04 no se ofrece por Zelle", () => {
    const d = decidirZelle({ ...base, maximoGlobalCentavos: null }, 277_404);
    expect(d.disponible).toBe(false);
    if (d.disponible) return;
    expect(d.motivo).toBe("monto_alto");
    expect(d.maximoCentavos).toBe(100_000);
  });

  it("justo en el tope SÍ se ofrece", () => {
    /* $1.000,00 exactos es lo que el banco deja: cortarlo un centavo antes
       sería quitarle a alguien un pago que sí puede hacer. */
    expect(
      decidirZelle({ ...base, maximoGlobalCentavos: null }, 100_000).disponible,
    ).toBe(true);
  });

  it("un centavo por encima ya no", () => {
    const d = decidirZelle({ ...base, maximoGlobalCentavos: null }, 100_001);
    expect(d.disponible).toBe(false);
    if (!d.disponible) expect(d.motivo).toBe("monto_alto");
  });

  it("EL TOPE ES EDITABLE desde el panel, sin tocar código", () => {
    /* El límite del banco es dinámico y sube con el historial: dentro de unos
       meses esto va a estorbar más que ayudar. */
    const d = decidirZelle({ ...base, maximoGlobalCentavos: 500_000 }, 277_404);
    expect(d.disponible).toBe(true);
    expect(d.maximoCentavos).toBe(500_000);
  });

  it("UN TOPE EN CERO NO APAGA ZELLE PARA TODO EL MUNDO", () => {
    /* Sería el fallo más caro de esta pieza: Zelle es la forma de pago de esta
       clientela y se quedaría apagada sin que ninguna pantalla dijera por qué. */
    for (const malo of [0, -1, Number.NaN]) {
      const d = decidirZelle({ ...base, maximoGlobalCentavos: malo }, 50_000);
      expect(d.disponible).toBe(true);
      expect(d.maximoCentavos).toBe(100_000);
    }
  });

  it("el mínimo manda antes que el tope", () => {
    /* Los otros motivos se arreglan de este lado; «monto_alto» solo se
       arregla cobrando por otra vía, así que va de último. */
    const d = decidirZelle(
      { ...base, minimoGlobalCentavos: 20_000, maximoGlobalCentavos: 10_000 },
      5_000,
    );
    expect(d.disponible).toBe(false);
    if (!d.disponible) expect(d.motivo).toBe("monto_bajo");
  });
});
