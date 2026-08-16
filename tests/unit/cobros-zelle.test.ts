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
