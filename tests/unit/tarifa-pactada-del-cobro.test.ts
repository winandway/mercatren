import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { COMISION_ZELLE_PB } from "@/lib/dinero";
import { cuantoCobrarPara, repartoDelCobro } from "@/lib/cobros/reparto";
import { revisarCorreccion } from "@/lib/zelle/reglas-correccion";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ ZELLE AL 6 % SIN TOCAR LO YA PROMETIDO (8 sep 2026) ══
 *
 * Richard subió el margen de Zelle del 3 % al 6 %. En los cobros por enlace
 * el reparto se calcula AL ACREDITAR: sin esto, los 13 cobros abiertos ese
 * día ($29.129, casi todos de MAXIUM) habrían pagado el doble de lo pactado.
 * La tarifa vigente se guarda con cada cobro al crearlo; los viejos, sin
 * fila, valen la de antes.
 */
describe("la tarifa pactada viaja con el cobro", () => {
  it("la vigente es 6 %, y el reparto por defecto la usa", () => {
    expect(COMISION_ZELLE_PB).toBe(600);
    expect(repartoDelCobro(10_000, "zelle").margen).toBe(600);
  });

  it("un cobro pactado al 3 % se reparte al 3 % aunque la vigente sea 6 %", () => {
    const r = repartoDelCobro(747_500, "zelle", 300);
    expect(r.margen).toBe(22_425);
    expect(r.recibeElComercio).toBe(747_500 - 22_425);
    expect(cuantoCobrarPara(725_075, "zelle", 300)).toBe(
      Math.ceil((725_075 * 10_000) / 9_700),
    );
  });

  it("corregir un monto respeta la tarifa del cobro, no la vigente", () => {
    const c = revisarCorreccion(
      {
        montoDeclaradoCentavos: 277_404,
        montoRealCentavos: 50_000,
        motivo: "el banco cortó el envío en $500",
      },
      "zelle",
      300,
    );
    expect(c.ok).toBe(true);
    if (c.ok) expect(c.datos.comisionCentavos).toBe(1_500); // 3 % de $500
  });

  it("sin fila, un cobro vale la tarifa de ANTES (300), nunca la nueva", () => {
    const consultas = leer("src/lib/cobros/consultas.ts");
    expect(consultas).toContain("TARIFA_ANTERIOR_PB = 300");
    expect(consultas).toContain(
      "return Number.isFinite(pb) && pb > 0 ? pb : TARIFA_ANTERIOR_PB",
    );
  });

  it("LOS DOS SITIOS QUE CREAN COBROS GUARDAN LA TARIFA, y el que acredita la lee", () => {
    for (const f of [
      "src/lib/cobros/pedir.ts",
      "src/app/datos/socios/cobro/route.ts",
    ]) {
      expect(leer(f), f).toContain("insert(tarifasDelCobro)");
    }
    const acreditar = leer("src/lib/cobros/acciones.ts");
    expect(acreditar).toContain("await tarifaDelCobro(cobro.id)");
    const corregir = leer("src/lib/zelle/corregir.ts");
    expect(corregir).toContain("tarifaDelCobro(puente.cobroId)");
  });

  it("la tabla llega sola a producción por schema.sql", () => {
    expect(leer("schema.sql")).toContain("tarifas_del_cobro");
  });
});
