import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  UMBRALES,
  esFalloPasajero,
  evaluar,
  hayQueAvisar,
  minutosDesde,
  textoDelCorreo,
  type Hechos,
} from "@/lib/vigilante/reglas";

/**
 * EL VIGILANTE (2 sep 2026). Lo pidió el dueño con el recálculo de Colombia
 * pegado horas sin que nadie se enterara: «un vigilante que tenga el control
 * de todo, que tenga un reporte, que se le pueda preguntar, y que mande un
 * correo cuando pase algo».
 */
const AHORA = Date.parse("2026-09-02T20:00:00Z");
const min = (n: number) => AHORA - n * 60_000;

function todoBien(): Hechos {
  return {
    ahoraMs: AHORA,
    latidoSincronizarMs: min(5),
    proveedor: "ok",
    avisoStripe: "ok",
    importaciones: [],
    plazas: [
      {
        mercado: "US",
        publicados: 1000,
        enRevision: 50,
        porAfinar: 50,
        sinCostoBase: 0,
      },
    ],
    publicadosSinVerificar: 0,
    comprasConError: 0,
    comprasPorPagarViejas: 0,
    ventasSinCompra: 0,
    zellePendientesViejos: 0,
    retirosSinPagarViejos: 0,
    fuentesAtrasadas: [],
    sinTraducir: 3000,
  };
}

describe("qué es una alerta", () => {
  it("con todo en orden no alerta nada — ni por títulos sin traducir, que es trabajo normal", () => {
    expect(evaluar(todoBien())).toEqual([]);
  });

  it("EL RELOJ PARADO ES ROJO: sin él no corre nada de lo automático", () => {
    const a = evaluar({
      ...todoBien(),
      latidoSincronizarMs: min(UMBRALES.latidoDelRelojMin + 1),
    });
    expect(a.map((x) => x.clave)).toEqual(["reloj-parado"]);
    expect(a[0]!.nivel).toBe("rojo");
    /* Nunca latió: ámbar, puede ser un sitio recién publicado. */
    expect(
      evaluar({ ...todoBien(), latidoSincronizarMs: null })[0]!.nivel,
    ).toBe("ambar");
  });

  it("las llaves del dinero (CJ y el aviso de Stripe) son rojas", () => {
    const a = evaluar({
      ...todoBien(),
      proveedor: "sin_llave",
      avisoStripe: "falta",
    });
    expect(a.map((x) => `${x.clave}:${x.nivel}`)).toEqual([
      "proveedor:rojo",
      "aviso-stripe:rojo",
    ]);
  });

  it("una importación quieta más de una hora con tandas pendientes avisa; una terminando no", () => {
    const imp = {
      id: "i",
      mercado: "US",
      estado: "en_curso",
      agregados: 7200,
      tandasPendientes: 400,
      tandasConError: 0,
      ultimoError: null,
    };
    expect(
      evaluar({
        ...todoBien(),
        importaciones: [{ ...imp, actualizadoEnMs: min(90) }],
      }).map((x) => x.clave),
    ).toEqual(["importacion-quieta-US"]);
    expect(
      evaluar({
        ...todoBien(),
        importaciones: [{ ...imp, actualizadoEnMs: min(10) }],
      }),
    ).toEqual([]);
    expect(
      evaluar({
        ...todoBien(),
        importaciones: [
          { ...imp, actualizadoEnMs: min(90), tandasPendientes: 0 },
        ],
      }),
    ).toEqual([]);
    expect(
      evaluar({
        ...todoBien(),
        importaciones: [{ ...imp, actualizadoEnMs: min(1), tandasConError: 3 }],
      }).map((x) => x.clave),
    ).toEqual(["importacion-errores-US"]);
  });

  it("EL DINERO: compras con error, sin pagar y ventas sin pedido son rojas", () => {
    const a = evaluar({
      ...todoBien(),
      comprasConError: 1,
      comprasPorPagarViejas: 2,
      ventasSinCompra: 1,
    });
    expect(a.map((x) => x.nivel)).toEqual(["rojo", "rojo", "rojo"]);
    expect(a.map((x) => x.clave)).toEqual([
      "compras-con-error",
      "compras-por-pagar",
      "ventas-sin-compra",
    ]);
  });

  it("lo que espera a una persona (Zelle, retiros, catálogos, costo base) es ámbar", () => {
    const a = evaluar({
      ...todoBien(),
      zellePendientesViejos: 1,
      retirosSinPagarViejos: 1,
      fuentesAtrasadas: ["Ferremateriales"],
      plazas: [
        {
          mercado: "CO",
          publicados: 10,
          enRevision: 0,
          porAfinar: 0,
          sinCostoBase: 8,
        },
      ],
    });
    expect(a.every((x) => x.nivel === "ambar")).toBe(true);
    expect(a.map((x) => x.clave)).toEqual([
      "sin-costo-CO",
      "zelle-por-validar",
      "retiros-sin-pagar",
      "fuentes-atrasadas",
    ]);
    expect(a[0]!.titulo).toContain("Colombia");
  });
});

describe("cuándo se avisa por correo", () => {
  it("la primera vez siempre; después, rojo a las 6 h y ámbar al día", () => {
    expect(hayQueAvisar("rojo", null, AHORA)).toBe(true);
    expect(hayQueAvisar("rojo", min(5 * 60), AHORA)).toBe(false);
    expect(hayQueAvisar("rojo", min(6 * 60), AHORA)).toBe(true);
    expect(hayQueAvisar("ambar", min(23 * 60), AHORA)).toBe(false);
    expect(hayQueAvisar("ambar", min(24 * 60), AHORA)).toBe(true);
  });

  it("el correo dice cuántas rojas, cada alerta con su detalle y lo que ya hizo solo", () => {
    const { asunto, lineas } = textoDelCorreo(
      [{ clave: "x", nivel: "rojo", titulo: "T", detalle: "D" }],
      [
        { clave: "a", titulo: "Retirados", cantidad: 7200 },
        { clave: "b", titulo: "Nada", cantidad: 0 },
      ],
    );
    expect(asunto).toContain("1 alerta roja");
    expect(lineas[0]).toContain("T. D");
    expect(lineas.at(-1)).toContain("Retirados (7200)");
    expect(lineas.at(-1)).not.toContain("Nada");
  });

  it("los fallos pasajeros de CJ se reintentan; los de verdad no", () => {
    expect(
      esFalloPasajero("Too Many Requests, QPS limit is 1 time/1second"),
    ).toBe(true);
    expect(esFalloPasajero("no contestó: fetch failed")).toBe(true);
    expect(esFalloPasajero("APIkey is wrong, please check and try again")).toBe(
      false,
    );
    expect(esFalloPasajero(null)).toBe(false);
  });

  it("los minutos se cuentan desde un instante o no se cuentan", () => {
    expect(minutosDesde(min(7), AHORA)).toBe(7);
    expect(minutosDesde(null, AHORA)).toBeNull();
  });
});

describe("las piezas que no pueden faltar (leyendo el código)", () => {
  const leer = (r: string) => readFileSync(r, "utf-8");

  it("hay un flujo propio en GitHub que lo dispara y una puerta con la llave del reloj", () => {
    expect(existsSync(".github/workflows/vigilante.yml")).toBe(true);
    expect(leer(".github/workflows/vigilante.yml")).toContain(
      "/datos/vigilante",
    );
    const ruta = leer("src/app/datos/vigilante/route.ts");
    expect(ruta).toContain(
      "autorizadoPorLlave(peticion, env.SINCRONIZAR_LLAVE)",
    );
    expect(ruta).toContain('correrVigilante("reloj")');
  });

  it("el reloj deja su latido y el vigilante lo mira", () => {
    expect(leer("src/app/datos/sincronizar/route.ts")).toContain(
      "LLAVE_LATIDO_SINCRONIZAR",
    );
    expect(leer("src/lib/vigilante/hechos.ts")).toContain(
      "LLAVE_LATIDO_SINCRONIZAR",
    );
  });

  it("primero ACTÚA, después mide, después avisa — y no repite el correo", () => {
    const correr = leer("src/lib/vigilante/correr.ts");
    expect(correr.indexOf("await actuar()")).toBeLessThan(
      correr.indexOf("await recogerHechos()"),
    );
    expect(correr.indexOf("await recogerHechos()")).toBeLessThan(
      correr.indexOf("await avisar("),
    );
    expect(correr).toContain("hayQueAvisar(");
    expect(correr).toContain("barrerNoVerificados()");
  });

  it("la pantalla está en el menú del equipo y cerrada bajo el disfraz de «ver su panel»", () => {
    expect(leer("src/components/panel/menu-lateral.tsx")).toContain(
      'href: "/panel/vigilante"',
    );
    expect(leer("src/lib/panel/solo-equipo.ts")).toContain('"vigilante"');
    expect(leer("src/app/[locale]/panel/vigilante/page.tsx")).toContain(
      "esSoporteDeVerdad()",
    );
    expect(leer("src/lib/vigilante/acciones.ts")).toContain(
      "await esSoporteDeVerdad()",
    );
  });

  it("el canario cuenta el último latido del vigilante", () => {
    expect(leer("src/app/datos/salud/route.ts")).toContain(
      "resumenDelVigilante()",
    );
  });
});
