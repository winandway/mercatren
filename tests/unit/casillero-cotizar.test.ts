import { describe, expect, it } from "vitest";

import { cotizarEnvio, type TarifaPais } from "@/lib/casillero/cotizar";

/**
 * ══ LA CALCULADORA DE ENVÍO (9 sep 2026) ══
 *
 * La estructura sale de cómo cobra de verdad la industria, medida ese día
 * en cuatro casilleros de Miami a Venezuela: peso facturable, tarifa por
 * libra, mínimo, cargo fijo de despacho, seguro sobre el valor declarado y
 * almacenaje. **Los números los pone Richard en el panel**, porque una
 * tarifa cambia con el combustible y con la aduana.
 */
const VENEZUELA: TarifaPais = {
  pais: "VE",
  tarifaLibraCentavos: 650, // $6.50 la libra
  minimoLb: 5,
  minimoCobroCentavos: 3_000, // $30 mínimo por envío
  despachoCentavos: 500, // $5 de papeleo y guía
  seguroPuntosBase: 300, // 3 %
  seguroDesdeCentavos: 50_000, // solo desde $500 declarados
  divisorVolumetrico: 166,
  diasAlmacenajeGratis: 30,
  almacenajeDiaCentavos: 100,
  impuestoIncluido: true,
  activa: true,
};

describe("sin tarifa cargada NO se cotiza", () => {
  it("no inventa un precio: dice que falta la tarifa", () => {
    /* Es la regla que evita el fallo que ya costó una venta a pérdida en
       CJ: un número inventado es una promesa que después no se cumple. */
    const paquete = {
      pesoRealLb: 10,
      medidas: null,
      valorDeclaradoCentavos: null,
    };
    expect(cotizarEnvio(paquete, null)).toEqual({
      ok: false,
      motivo: "sin-tarifa",
    });
    expect(cotizarEnvio(paquete, { ...VENEZUELA, activa: false }).ok).toBe(
      false,
    );
    expect(
      cotizarEnvio(paquete, { ...VENEZUELA, tarifaLibraCentavos: 0 }).ok,
    ).toBe(false);
  });

  it("sin peso ni medidas tampoco cotiza", () => {
    const r = cotizarEnvio(
      { pesoRealLb: 0, medidas: null, valorDeclaradoCentavos: null },
      VENEZUELA,
    );
    expect(r).toEqual({ ok: false, motivo: "sin-peso" });
  });
});

describe("una caja normal", () => {
  it("EL CASO DE LA CAJA DE 24×18×12: manda lo que ocupa, no lo que pesa", () => {
    /* Pesa 3 libras y ocupa 31,3. Es el caso del que se discute con el
       cliente, y por eso el desglose enseña los dos pesos. */
    const r = cotizarEnvio(
      {
        pesoRealLb: 3,
        medidas: { largoIn: 24, anchoIn: 18, altoIn: 12 },
        valorDeclaradoCentavos: 8_000,
      },
      VENEZUELA,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.pesoFacturableLb).toBe(31.3);
    expect(r.pesoVolumetricoLb).toBe(31.23);
    /* 31,3 lb × $6,50 = $203,45 · más $5 de despacho = $208,45 */
    expect(r.renglones).toEqual([
      { concepto: "flete", centavos: 20_345 },
      { concepto: "despacho", centavos: 500 },
    ]);
    expect(r.totalCentavos).toBe(20_845);
  });

  it("un paquete chico paga el mínimo, y se VE por qué", () => {
    /* Media libra: el mínimo de 5 lb lo sube a $32,50 + $5 = $37,50, que
       ya pasa el mínimo de $30. Un paquete aún más barato llevaría su
       renglón de ajuste, visible y no escondido en el flete. */
    const r = cotizarEnvio(
      { pesoRealLb: 0.5, medidas: null, valorDeclaradoCentavos: 2_000 },
      VENEZUELA,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.pesoFacturableLb).toBe(5);
    expect(r.totalCentavos).toBe(3_750);
  });

  it("el ajuste al mínimo va como RENGLÓN, no subiendo el flete a escondidas", () => {
    const barata: TarifaPais = {
      ...VENEZUELA,
      tarifaLibraCentavos: 100,
      minimoLb: 1,
      despachoCentavos: 0,
      minimoCobroCentavos: 3_000,
    };
    const r = cotizarEnvio(
      { pesoRealLb: 2, medidas: null, valorDeclaradoCentavos: null },
      barata,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.renglones).toEqual([
      { concepto: "flete", centavos: 200 },
      { concepto: "ajuste-minimo", centavos: 2_800 },
    ]);
    expect(r.totalCentavos).toBe(3_000);
  });
});

describe("el seguro", () => {
  it("solo desde el monto que diga la tarifa", () => {
    /* Cobrarle un porcentaje a una caja de veinte dólares es un renglón
       que molesta más de lo que recauda. */
    const barato = cotizarEnvio(
      { pesoRealLb: 10, medidas: null, valorDeclaradoCentavos: 20_000 },
      VENEZUELA,
    );
    expect(
      barato.ok && barato.renglones.some((r) => r.concepto === "seguro"),
    ).toBe(false);

    const caro = cotizarEnvio(
      { pesoRealLb: 10, medidas: null, valorDeclaradoCentavos: 120_000 },
      VENEZUELA,
    );
    expect(caro.ok).toBe(true);
    if (!caro.ok) return;
    /* 3 % de $1.200 = $36 */
    expect(caro.renglones.find((r) => r.concepto === "seguro")?.centavos).toBe(
      3_600,
    );
  });

  it("sin valor declarado no hay seguro que calcular", () => {
    const r = cotizarEnvio(
      { pesoRealLb: 10, medidas: null, valorDeclaradoCentavos: null },
      VENEZUELA,
    );
    expect(r.ok && r.renglones.some((x) => x.concepto === "seguro")).toBe(
      false,
    );
  });
});

describe("el almacenaje", () => {
  it("los días gratis son gratis, y después se cobran los de más", () => {
    const dentro = cotizarEnvio(
      {
        pesoRealLb: 10,
        medidas: null,
        valorDeclaradoCentavos: null,
        diasEnBodega: 30,
      },
      VENEZUELA,
    );
    expect(
      dentro.ok && dentro.renglones.some((r) => r.concepto === "almacenaje"),
    ).toBe(false);

    const fuera = cotizarEnvio(
      {
        pesoRealLb: 10,
        medidas: null,
        valorDeclaradoCentavos: null,
        diasEnBodega: 35,
      },
      VENEZUELA,
    );
    expect(fuera.ok).toBe(true);
    if (!fuera.ok) return;
    /* Cinco días de más, a $1 el día. */
    expect(
      fuera.renglones.find((r) => r.concepto === "almacenaje")?.centavos,
    ).toBe(500);
  });
});

describe("el impuesto del destino", () => {
  it("la cotización dice SIEMPRE si va incluido o no", () => {
    /* Es la pregunta que más reclamos genera: si va aparte, el cliente
       paga al recibir, y eso hay que decírselo antes de que compre. */
    const con = cotizarEnvio(
      { pesoRealLb: 10, medidas: null, valorDeclaradoCentavos: null },
      VENEZUELA,
    );
    expect(con.ok && con.impuestoIncluido).toBe(true);
    const sin = cotizarEnvio(
      { pesoRealLb: 10, medidas: null, valorDeclaradoCentavos: null },
      { ...VENEZUELA, impuestoIncluido: false },
    );
    expect(sin.ok && sin.impuestoIncluido).toBe(false);
  });
});
