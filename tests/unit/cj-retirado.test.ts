import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CJ_RETIRADO } from "@/lib/cj/retirado";
import { evaluar, type Hechos } from "@/lib/vigilante/reglas";

/**
 * CJ RETIRADO: NADA DE CORREOS POR UNA CONEXIÓN QUE YA NO EXISTE (8 nov 2026).
 *
 * Desde que CJ se borró (5 nov), el vigilante mandaba «La conexión con CJ no
 * responde (sin_llave)» cada vez que corría. Richard: «el sistema debería
 * saber que no estamos trabajando con esa empresa». Lo que no puede pasar sin
 * que esto se ponga en rojo:
 * - que el interruptor se apague sin querer;
 * - que el vigilante avise de CJ (conexión, puntos, importaciones) con CJ
 *   retirado, o que deje de avisar si algún día vuelve;
 * - que la sonda de salud llame a CJ, o que el vigilante actúe contra CJ.
 */
const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");
const AHORA = Date.parse("2026-11-08T20:00:00Z");

function hechos(proveedor: string): Hechos {
  return {
    ahoraMs: AHORA,
    fotos: {
      porTraer: 0,
      rotas: 0,
      sondaProbadas: 0,
      sondaFallidas: 0,
      sondaEjemplo: null,
      detalleRotas: [],
    },
    latidoSincronizarMs: AHORA - 5 * 60_000,
    proveedor,
    avisoStripe: "ok",
    importaciones: [
      {
        id: "imp-1",
        mercado: "US",
        estado: "en_curso",
        tandasPendientes: 10,
        tandasConError: 2,
        actualizadoEnMs: AHORA - 600 * 60_000,
        ultimoError: "CJ no contestó",
        agregados: 0,
      },
    ],
    plazas: [],
    publicadosSinVerificar: 0,
    comprasConError: 0,
    comprasPorPagarViejas: 0,
    ventasSinCompra: 0,
    zellePendientesViejos: 0,
    retirosSinPagarViejos: 0,
    fuentesAtrasadas: [],
    sinTraducir: 0,
  };
}

const deCj = (claves: string[]) =>
  claves.filter(
    (c) =>
      c === "proveedor" || c.startsWith("cj-") || c.startsWith("importacion-"),
  );

describe("CJ está retirado", () => {
  it("el interruptor está puesto", () => {
    expect(CJ_RETIRADO).toBe(true);
  });

  it("el vigilante no avisa nada de CJ", () => {
    const claves = evaluar(hechos("retirado")).map((a) => a.clave);
    expect(deCj(claves)).toEqual([]);
  });

  it("pero si CJ volviera, la alarma sigue funcionando", () => {
    const claves = evaluar(hechos("sin_llave")).map((a) => a.clave);
    expect(claves).toContain("proveedor");
    expect(claves.some((c) => c.startsWith("importacion-"))).toBe(true);
  });

  it("la sonda de salud no llama a CJ", () => {
    const s = leer("src/lib/salud/piezas.ts");
    const inicio = s.indexOf("export async function saludDelProveedor");
    const corte = s.indexOf('if (CJ_RETIRADO) return "retirado";', inicio);
    expect(corte).toBeGreaterThan(inicio);
    expect(corte).toBeLessThan(s.indexOf("cjConfigurado()", inicio));
  });

  it("el vigilante no actúa contra CJ, pero sí sigue con las fotos", () => {
    const s = leer("src/lib/vigilante/correr.ts");
    for (const accion of [
      "barrerNoVerificados()",
      "select({ id: importacionesCj.id })",
      "reintentarPagosPendientesDeCj(3)",
    ]) {
      const i = s.indexOf(accion, s.indexOf("async function actuar"));
      const guarda = s.lastIndexOf("if (!CJ_RETIRADO)", i);
      expect(guarda).toBeGreaterThan(-1);
      expect(s.slice(guarda, i)).not.toContain("/* 1b.");
    }
    expect(s).not.toContain("if (CJ_RETIRADO) return acciones;");
  });
});
