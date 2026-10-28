import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { cobroPorEnlaceAdmite } from "@/lib/cobros/moneda";
import { simboloDeMoneda } from "@/lib/dinero";
import { aCentavos } from "@/lib/retiros/monto";
import { zelleAdmiteMoneda } from "@/lib/cobros/zelle";
import { monedaDeLaTienda } from "@/lib/mercado/moneda";
import { mercuryLaPuedeMandar } from "@/lib/retiros/a-mercury";
import {
  PAISES_BANCARIOS,
  paisAdmiteMoneda,
  paisesBancariosPara,
} from "@/lib/retiros/paises";

/**
 * EL SALDO Y EL RETIRO HABLAN LA MONEDA DE LA TIENDA (27 oct 2026).
 *
 * España es el primer país donde los comercios venden en una moneda que no
 * es el dólar. La billetera nació en USD para todos: cien euros vendidos se
 * veían como «$100.00», el retiro salía como si fueran dólares, y había
 * cuatro puertas por donde entraban dólares a una billetera en euros (Zelle,
 * los enlaces de cobro, el traspaso entre comercios y el carrito mezclado).
 *
 * Estos candados cuidan las dos mitades: que el saldo se lea en su moneda y
 * que ninguna puerta meta otra moneda en él.
 */

const leer = (ruta: string) => readFileSync(ruta, "utf-8");

describe("la moneda de una tienda sale de su país", () => {
  it("España vende en euros, Estados Unidos en dólares", () => {
    expect(monedaDeLaTienda("ES")).toBe("EUR");
    expect(monedaDeLaTienda("US")).toBe("USD");
    expect(monedaDeLaTienda("CL")).toBe("CLP");
    expect(monedaDeLaTienda("CO")).toBe("COP");
  });

  it("una tienda sin país, o de Venezuela, es en dólares", () => {
    expect(monedaDeLaTienda(null)).toBe("USD");
    expect(monedaDeLaTienda(undefined)).toBe("USD");
    expect(monedaDeLaTienda("VE")).toBe("USD");
    expect(monedaDeLaTienda(" es ")).toBe("EUR");
  });

  it("el saldo toma la moneda del país, no la guardada en la billetera", () => {
    const billetera = leer("src/lib/zelle/billetera.ts");
    expect(billetera).toContain("moneda: monedaDeLaTienda(tienda.mercado)");
    expect(billetera).not.toContain('moneda: billetera?.moneda ?? "USD"');
  });

  it("una tienda nueva abre su billetera en la moneda de su país", () => {
    expect(leer("src/lib/tiendas/acciones.ts")).toContain(
      "moneda: monedaDelMercado(mercado)",
    );
  });
});

describe("cada moneda se paga en los países donde es la del banco", () => {
  it("el dólar sale a cualquier país de la lista", () => {
    expect(paisesBancariosPara("USD")).toEqual(PAISES_BANCARIOS);
    expect(paisAdmiteMoneda("ES", "USD")).toBe(true);
    expect(paisAdmiteMoneda("MX", "USD")).toBe(true);
  });

  it("el euro solo a cuentas de países del euro", () => {
    expect(paisAdmiteMoneda("ES", "EUR")).toBe(true);
    expect(paisAdmiteMoneda("US", "EUR")).toBe(false);
    expect(paisAdmiteMoneda("RO", "EUR")).toBe(false);
    expect(paisAdmiteMoneda("MX", "eur")).toBe(false);
    expect(paisesBancariosPara("EUR").map((p) => p.codigo)).toEqual(["ES"]);
  });

  it("los pesos, solo a su país; una moneda desconocida, a ninguno", () => {
    expect(paisAdmiteMoneda("CL", "CLP")).toBe(true);
    expect(paisAdmiteMoneda("CO", "CLP")).toBe(false);
    expect(paisAdmiteMoneda("CO", "COP")).toBe(true);
    expect(paisesBancariosPara("JPY")).toEqual([]);
  });

  it("el servidor lo vuelve a comprobar, y guarda la moneda del retiro", () => {
    const acciones = leer("src/lib/retiros/acciones.ts");
    expect(acciones).toContain("paisAdmiteMoneda(d.pais");
    expect(acciones).toContain("moneda: posicion.moneda,");
    expect(acciones).toContain(
      "monedaDeLaTienda(destino.mercado) !== posicion.moneda",
    );
    /* El cierre por fuera también: antes escribía USD a mano. */
    expect(acciones).toContain('moneda: posicion?.moneda ?? "USD"');
  });

  it("el formulario solo ofrece los países de su moneda", () => {
    const formulario = leer("src/components/panel/retiros/pedir-retiro.tsx");
    expect(formulario).toContain("paisesBancariosPara(moneda)");
    expect(formulario).not.toContain("PAISES_BANCARIOS.map");
  });
});

describe("la API de Mercury solo manda dólares", () => {
  it("solo un retiro en USD puede salir por ahí", () => {
    expect(mercuryLaPuedeMandar("USD")).toBe(true);
    expect(mercuryLaPuedeMandar(" usd ")).toBe(true);
    expect(mercuryLaPuedeMandar(null)).toBe(true);
    expect(mercuryLaPuedeMandar("EUR")).toBe(false);
    expect(mercuryLaPuedeMandar("CLP")).toBe(false);
  });

  it("se pregunta ANTES de pedirle el pago al banco", () => {
    const envio = leer("src/lib/retiros/enviar-por-mercury.ts");
    const pregunta = envio.indexOf("mercuryLaPuedeMandar(retiro.moneda)");
    const pago = envio.indexOf("solicitarEnvio(");
    expect(pregunta).toBeGreaterThan(-1);
    expect(pago).toBeGreaterThan(pregunta);
  });

  it("la cola del equipo esconde el botón y dice que va a mano", () => {
    const pagina = leer("src/app/[locale]/panel/retiros/page.tsx");
    expect(pagina).toContain("mercuryLaPuedeMandar(r.moneda)");
    expect(pagina).toContain("retiroEnOtraMoneda");
    expect(pagina).toContain(
      "formatearPrecio(r.montoCentavos, idioma, r.moneda)",
    );
  });
});

describe("ninguna puerta mete otra moneda en la billetera", () => {
  it("Zelle es solo en dólares, aunque la tienda lo tenga encendido", () => {
    expect(zelleAdmiteMoneda("USD")).toBe(true);
    expect(zelleAdmiteMoneda("EUR")).toBe(false);
    expect(leer("src/lib/cobros/politica-zelle.ts")).toContain(
      "zelleAdmiteMoneda(monedaDeLaTienda(t.mercado))",
    );
  });

  it("los enlaces de cobro, solo en tiendas que venden en dólares", () => {
    expect(cobroPorEnlaceAdmite("USD")).toBe(true);
    expect(cobroPorEnlaceAdmite("EUR")).toBe(false);
    for (const ruta of [
      "src/lib/cobros/pedir.ts",
      "src/app/datos/socios/cobro/route.ts",
      "src/app/[locale]/panel/cobros/enlaces/page.tsx",
    ]) {
      expect(leer(ruta), ruta).toContain("cobroPorEnlaceAdmite(");
    }
  });

  it("un pedido no mezcla productos de monedas distintas", () => {
    const pedidos = leer("src/lib/pedidos/acciones.ts");
    expect(pedidos).toContain("encontrados.map((p) => p.moneda)");
    expect(pedidos).toContain('t("monedasMezcladas")');
  });

  it("el traspaso entre comercios solo ofrece los de la misma moneda", () => {
    expect(leer("src/lib/retiros/consultas.ts")).toContain(
      "monedaDeLaTienda(t.mercado) === moneda",
    );
  });
});

describe("las pantallas y los correos dicen la moneda real", () => {
  it("el total por pagar del equipo se separa por moneda", () => {
    const pagina = leer("src/app/[locale]/panel/billetera/page.tsx");
    expect(pagina).not.toContain("dinero(totalPorPagar)");
    expect(pagina).toContain(
      "formatearPrecio(f.saldoCentavos, idioma, f.moneda)",
    );
  });

  it("los correos de venta y de retiro ya no fijan el dólar", () => {
    const correos = leer("src/lib/correo/correos.ts");
    for (const fijo of [
      'formatearPrecio(venta.montoCentavos, idioma, "USD")',
      'formatearPrecio(retiro.montoCentavos, idioma, "USD")',
      'formatearPrecio(datos.montoCentavos, idioma, "USD")',
      'formatearPrecio(d.montoCentavos, "es", "USD")',
    ]) {
      expect(correos).not.toContain(fijo);
    }
  });

  it("el inicio del panel cuenta en la moneda de lo que cuenta", () => {
    const hoy = leer("src/lib/panel/hoy.ts");
    expect(hoy).toContain("posicion?.moneda ??");
    expect(hoy).not.toMatch(/moneda: "USD",\n\s*disponibleCentavos/);
  });
});

describe("la casilla del monto habla la moneda de la billetera", () => {
  it("el signo es el de la moneda, no un «$» pegado a mano", () => {
    expect(simboloDeMoneda("EUR", "es")).toBe("€");
    expect(simboloDeMoneda("USD", "en")).toBe("$");
    const formulario = leer("src/components/panel/retiros/pedir-retiro.tsx");
    expect(formulario).toContain("simboloDeMoneda(moneda, idioma)");
    expect(formulario).not.toMatch(/aria-hidden\s*>\s*\$\s*</);
  });

  it("el monto se lee con los decimales de su moneda", () => {
    expect(aCentavos("121.25")).toBe(12125);
    expect(aCentavos("121.25", 2)).toBe(12125);
    expect(aCentavos("5990", 0)).toBe(5990);
    expect(aCentavos("5990.5", 0)).toBeNull();
    const acciones = leer("src/lib/retiros/acciones.ts");
    expect(acciones).toContain(
      "aCentavos(d.monto, decimalesDe(posicion.moneda))",
    );
    /* Y el esquema no borra la coma ANTES de leer: en España es el decimal. */
    expect(acciones).not.toContain('v.replace(/[^0-9.]/g, "")');
  });
});
