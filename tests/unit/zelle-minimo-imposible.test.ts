import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { decidirZelle, minimoAplicable } from "@/lib/cobros/zelle";

/**
 * ══ UN MÍNIMO POR ENCIMA DEL MÁXIMO APAGA ZELLE EN SILENCIO (22 sep 2026) ══
 *
 * A la una de la mañana, con un cobro real de $6.483,77 sin Zelle, Richard
 * subió el tope a $7.000 —bien— y de paso escribió 7000 en «Mínimo propio
 * (USD)», la casilla de al lado. El panel lo guardó sin decir nada y Zelle
 * siguió sin salir: con mínimo $7.000 y máximo $7.000 no pasa ningún monto.
 *
 * Sus palabras: «le he dado todo, le he dado las configuraciones, le he
 * guardado, luego actualizo el link y no sale».
 */
const FACTURA = 648_377; // $6.483,77
const SIETE_MIL = 700_000;

const BASE = {
  habilitada: true,
  receptorConfigurado: true,
  minimoGlobalCentavos: 20_000, // $200, la regla del catálogo
};

describe("el caso exacto de Richard", () => {
  it("con mínimo $7.000 y máximo $7.000, la factura de $6.483,77 SÍ pasa", () => {
    const d = decidirZelle(
      {
        ...BASE,
        minimoTiendaCentavos: SIETE_MIL,
        maximoGlobalCentavos: SIETE_MIL,
      },
      FACTURA,
    );
    expect(d.disponible).toBe(true);
  });

  it("y se dice que ese mínimo era imposible, no se calla", () => {
    const d = decidirZelle(
      {
        ...BASE,
        minimoTiendaCentavos: SIETE_MIL,
        maximoGlobalCentavos: SIETE_MIL,
      },
      FACTURA,
    );
    expect(d.minimoImposible).toBe(true);
    /* Y el mínimo que se aplica es el general, no el imposible. */
    expect(d.minimoCentavos).toBe(20_000);
  });
});

describe("qué sigue valiendo", () => {
  it("un mínimo normal sigue filtrando lo que no compensa", () => {
    const d = decidirZelle(
      {
        ...BASE,
        minimoTiendaCentavos: 50_000, // $500
        maximoGlobalCentavos: SIETE_MIL,
      },
      30_000, // $300
    );
    expect(d.disponible).toBe(false);
    expect(d.disponible === false && d.motivo).toBe("monto_bajo");
    expect(d.minimoImposible).toBeUndefined();
  });

  it("un monto por encima del máximo sigue sin Zelle", () => {
    const d = decidirZelle(
      { ...BASE, minimoTiendaCentavos: null, maximoGlobalCentavos: SIETE_MIL },
      800_000,
    );
    expect(d.disponible === false && d.motivo).toBe("monto_alto");
  });

  it("la tienda apagada sigue apagada, aunque el mínimo sea imposible", () => {
    const d = decidirZelle(
      {
        ...BASE,
        habilitada: false,
        minimoTiendaCentavos: SIETE_MIL,
        maximoGlobalCentavos: SIETE_MIL,
      },
      FACTURA,
    );
    expect(d.disponible === false && d.motivo).toBe("no_habilitada");
  });

  it("si el general TAMBIÉN se pasa del máximo, no queda mínimo", () => {
    const d = decidirZelle(
      {
        ...BASE,
        minimoGlobalCentavos: 900_000,
        minimoTiendaCentavos: SIETE_MIL,
        maximoGlobalCentavos: SIETE_MIL,
      },
      FACTURA,
    );
    expect(d.disponible).toBe(true);
    expect(d.minimoCentavos).toBe(0);
  });

  it("la cadena de respaldos del mínimo no cambió", () => {
    expect(
      minimoAplicable({
        minimoTiendaCentavos: 5_000,
        minimoGlobalCentavos: 20_000,
      }),
    ).toBe(5_000);
    expect(
      minimoAplicable({
        minimoTiendaCentavos: null,
        minimoGlobalCentavos: 20_000,
      }),
    ).toBe(20_000);
  });
});

/** Lo que de verdad lo previene: el panel no vuelve a guardarlo. */
describe("el panel no guarda un mínimo imposible", () => {
  const fuente = readFileSync("src/lib/cobros/zelle-admin.ts", "utf8");

  it("compara el mínimo contra el máximo vigente antes de escribir", () => {
    expect(fuente).toContain("minimoCentavos >= maximo");
    expect(fuente).toContain("zelleCobros.minimoSobreMaximo");
    /* Y se para ANTES del insert: guardar y avisar después no sirve. */
    const revisa = fuente.indexOf("minimoCentavos >= maximo");
    const escribe = fuente.indexOf(".insert(zelleCobrosTienda)");
    expect(revisa).toBeGreaterThan(-1);
    expect(revisa).toBeLessThan(escribe);
  });

  it("el aviso dice el máximo, para que se vea dónde iba el número", () => {
    const es = JSON.parse(readFileSync("messages/es.json", "utf8")) as Record<
      string,
      unknown
    >;
    const texto = JSON.stringify(es);
    expect(texto).toContain("minimoSobreMaximo");
    expect(texto).toContain("{maximo}");
  });
});
