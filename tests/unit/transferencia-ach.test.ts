import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { decidirTransferencia } from "@/lib/cobros/transferencia";

/**
 * PAGAR UN COBRO POR TRANSFERENCIA ACH DIRECTA (26 ago 2026).
 *
 * Lo pidió el dueño por una razón de dinero: una factura de siete mil dólares
 * con tarjeta deja más de $200 en comisiones del procesador; por ACH a la
 * cuenta de Mercatren LLC, cero.
 */
const COMPLETOS = {
  beneficiario: "Mercatren LLC",
  banco: "Mercury",
  cuenta: "000000000",
  rutaAch: "000000000",
};

describe("cuándo se ofrece la transferencia", () => {
  it("con los cuatro datos y el monto suficiente, sí", () => {
    const r = decidirTransferencia(COMPLETOS, 747_500, 20_000);
    expect(r.disponible).toBe(true);
    if (r.disponible) expect(r.datos.rutaAch).toBe("000000000");
  });

  it("le faltan datos: NO se ofrece, ni siquiera a medias", () => {
    /* Enseñar una cuenta sin su número de ruta —o al revés— es mandar a
       alguien al banco con media instrucción: ese dinero se va a otra parte o
       se queda sin salir. */
    for (const falta of [
      "beneficiario",
      "banco",
      "cuenta",
      "rutaAch",
    ] as const) {
      const parciales = { ...COMPLETOS, [falta]: "" };
      const r = decidirTransferencia(parciales, 747_500, 20_000);
      expect(r.disponible, `sin ${falta}`).toBe(false);
      if (!r.disponible) expect(r.motivo).toBe("sin_datos");
    }
    expect(decidirTransferencia({}, 747_500, 20_000).disponible).toBe(false);
  });

  it("por debajo del mínimo tampoco: validar a mano cuesta lo mismo por $20 que por $7.000", () => {
    const r = decidirTransferencia(COMPLETOS, 5_000, 20_000);
    expect(r.disponible).toBe(false);
    if (!r.disponible) expect(r.motivo).toBe("monto_bajo");
  });

  it("los espacios sueltos no cuentan como dato", () => {
    const r = decidirTransferencia(
      { ...COMPLETOS, cuenta: "   " },
      747_500,
      20_000,
    );
    expect(r.disponible).toBe(false);
  });
});

describe("los candados del método", () => {
  it("NUNCA hay un número de cuenta escrito en el código", () => {
    /* El repositorio es público: una cuenta junto a su ruta ACH es lo que
       hace falta para intentar un cobro no autorizado. */
    const fuentes = [
      "src/lib/cobros/transferencia.ts",
      "src/components/cobro/pagar-con-transferencia.tsx",
      "src/components/cobro/metodos-de-cobro.tsx",
    ];
    for (const ruta of fuentes) {
      const fuente = readFileSync(ruta, "utf8");
      /* Nueve dígitos seguidos es un número de ruta ACH. */
      expect(fuente.match(/\b\d{9,}\b/g), ruta).toBeNull();
    }
  });

  it("se lee la ruta de ACH, jamás la de wire", () => {
    const pagina = readFileSync(
      "src/app/[locale]/cobro/[enlace]/page.tsx",
      "utf8",
    );
    /* Chase da un número de ruta para ACH y otro distinto para wire; con el
       de wire, la transferencia rebota.

       ══ EL CANDADO CAMBIÓ DE FORMA EL 27 AGO 2026 ══

       Antes decía «esta página no puede nombrar PAGO_RUTA_WIRE», y valía
       mientras la página solo ofrecía ACH. Al agregar el cable dejó de valer:
       la página **tiene** que leer las dos, cada una en su sitio. Aflojarlo a
       secas habría dejado la trampa sin vigilancia, así que ahora se comprueba
       lo que de verdad importa — que **la llamada de ACH lleve la ruta de ACH
       y la del cable la de wire**, y ninguna la de la otra. */
    const bloqueAch = pagina.slice(
      pagina.indexOf("decidirTransferencia("),
      pagina.indexOf("decidirWire("),
    );
    expect(bloqueAch).toContain("PAGO_RUTA_ACH");
    expect(bloqueAch).not.toContain("PAGO_RUTA_WIRE");

    const bloqueWire = pagina.slice(pagina.indexOf("decidirWire("));
    expect(bloqueWire).toContain("PAGO_RUTA_WIRE");
    expect(bloqueWire).not.toContain("rutaAch");
  });

  it("va a la MISMA cola de validación que Zelle: no se duplica nada", () => {
    const componente = readFileSync(
      "src/components/cobro/pagar-con-transferencia.tsx",
      "utf8",
    );
    expect(componente).toContain("subirComprobanteDeCobro");
  });

  it("y el número de conciliación es obligatorio en la pantalla", () => {
    const componente = readFileSync(
      "src/components/cobro/pagar-con-transferencia.tsx",
      "utf8",
    );
    /* Sin él no se sabe qué factura se está pagando. */
    expect(componente).toContain("achPaso3");
    expect(componente).toContain("{concepto}");
  });
});
