import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  paisDelAltaPermitido,
  paisesParaElAlta,
} from "@/lib/cuenta/pais-del-alta";
import {
  decidirPais,
  destinoConElPaisDeLaCuenta,
  rutaParaSeguir,
} from "@/lib/mercado/elegir-pais";
import {
  dentroDeMercatren,
  enLaApp,
  paisesEnLaApp,
} from "@/lib/mercado/interruptores";
import { mercadoDeLaVisita } from "@/lib/mercado/mercados";

/**
 * UNA SOLA MERCATREN (5 nov 2026, Fase 1 en la web). El país es de la
 * persona: se elige al crear la cuenta (la misma pieza en la web y en la
 * app), va en la cuenta y la devuelve a su país al entrar. Cada país tiene su
 * interruptor, y NINGUNO se enciende sin el sí de Richard.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf-8");

describe("el interruptor de cada país", () => {
  it("hoy solo Estados Unidos está en la app; España vive dentro de mercatren.com", () => {
    expect(paisesEnLaApp()).toEqual(["US"]);
    expect(enLaApp("VE")).toBe(false);
    expect(enLaApp("ES")).toBe(false);
    expect(dentroDeMercatren("ES")).toBe(true);
    /* Venezuela, preparada y apagada: sigue en su dominio. */
    expect(dentroDeMercatren("VE")).toBe(false);
    expect(enLaApp(" us ")).toBe(true);
  });

  it("con el interruptor apagado, nada cambia para Venezuela", () => {
    expect(mercadoDeLaVisita("mercatren.com", "VE").codigo).toBe("US");
    expect(mercadoDeLaVisita("mercatren.com.ve", null).codigo).toBe("VE");
    expect(decidirPais("VE", "es", "mercatren.com").destino).toBe(
      "https://mercatren.com.ve/es",
    );
  });

  it("la app lee la misma lista", () => {
    expect(leer("src/lib/app-movil/datos.ts")).toContain(
      "PAISES_ENCENDIDOS: readonly string[] = paisesEnLaApp()",
    );
  });
});

describe("el país al crear la cuenta, en la web y en la app", () => {
  it("se ofrecen los encendidos y, siempre, el de la visita (primero)", () => {
    expect(paisesParaElAlta("US").map((m) => m.codigo)).toEqual(["US"]);
    expect(paisesParaElAlta("ES").map((m) => m.codigo)).toEqual(["ES", "US"]);
    expect(paisesParaElAlta("VE").map((m) => m.codigo)).toEqual(["VE", "US"]);
  });

  it("el servidor no abre cuentas en un país apagado", () => {
    expect(paisDelAltaPermitido("VE", "US")).toBe(false);
    expect(paisDelAltaPermitido("ES", "US")).toBe(false);
    expect(paisDelAltaPermitido("ES", "ES")).toBe(true);
    expect(paisDelAltaPermitido("US", "ES")).toBe(true);
    expect(paisDelAltaPermitido(undefined, "US")).toBe(true);
    expect(paisDelAltaPermitido(7, "US")).toBe(false);
    const ruta = leer("src/app/datos/auth/[...all]/route.ts");
    expect(ruta).toContain("paisDelAltaPermitido(");
    expect(ruta).toContain("mercadoDeLaPeticionHttp(request).codigo");
  });

  it("el formulario web manda el país a la cuenta", () => {
    const formulario = leer("src/components/cuenta/formulario-registro.tsx");
    expect(formulario).toContain("paisEntrega: pais,");
    expect(formulario).toContain('name="pais"');
    expect(leer("src/app/[locale]/(tienda)/registro/page.tsx")).toContain(
      "paisesParaElAlta(mercado.codigo)",
    );
  });
});

describe("el país va en la cuenta y la devuelve a su país", () => {
  it("al entrar, si la cuenta es de un país que vive aquí, se pasa por él", () => {
    expect(
      destinoConElPaisDeLaCuenta({
        paisCuenta: "ES",
        host: "mercatren.com",
        paisVisita: "US",
        idioma: "es",
        ruta: "/panel",
      }),
    ).toBe("/datos/pais?a=ES&idioma=es&luego=/panel");
    expect(
      destinoConElPaisDeLaCuenta({
        paisCuenta: "US",
        host: "mercatren.com",
        paisVisita: "ES",
        idioma: "en",
        ruta: "/cuenta",
      }),
    ).toBe("/datos/pais?a=US&idioma=en&luego=/cuenta");
  });

  it("no salta a otro dominio (la sesión es de este) ni cambia lo que ya está bien", () => {
    const base = {
      host: "mercatren.com",
      idioma: "es" as const,
      ruta: "/cuenta",
    };
    expect(
      destinoConElPaisDeLaCuenta({
        ...base,
        paisCuenta: "VE",
        paisVisita: "US",
      }),
    ).toBeNull();
    expect(
      destinoConElPaisDeLaCuenta({
        ...base,
        paisCuenta: "US",
        paisVisita: "US",
      }),
    ).toBeNull();
    expect(
      destinoConElPaisDeLaCuenta({
        ...base,
        paisCuenta: null,
        paisVisita: "US",
      }),
    ).toBeNull();
    expect(
      destinoConElPaisDeLaCuenta({
        ...base,
        host: "mercatren.cl",
        paisCuenta: "ES",
        paisVisita: "CL",
      }),
    ).toBeNull();
  });

  it("después de elegir el país solo se sigue a la cuenta o al panel", () => {
    expect(rutaParaSeguir("/cuenta")).toBe("/cuenta");
    expect(rutaParaSeguir("/panel")).toBe("/panel");
    expect(rutaParaSeguir("//otro-sitio.com")).toBe("");
    expect(rutaParaSeguir("/checkout")).toBe("");
    expect(decidirPais("ES", "es", "mercatren.com", "/cuenta").destino).toBe(
      "/es/cuenta",
    );
  });

  it("la bandera, con sesión, guarda el país en la cuenta; entrar lo usa", () => {
    const pais = leer("src/app/datos/pais/route.ts");
    expect(pais).toContain("await recordarEnLaCuenta(decision.mercado.codigo)");
    expect(pais).toContain(".set({ paisEntrega: codigo })");
    expect(leer("src/components/cuenta/formulario-entrar.tsx")).toContain(
      "destinoConElPaisDeLaCuenta({",
    );
  });
});
