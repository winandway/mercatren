import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { politicaZelleDe, zelleHabilitadaPara } from "@/lib/cobros/zelle";

/**
 * ZELLE CERRADO POR DEFECTO (2 sep 2026).
 *
 * Decisión del dueño tras la captura falsa, el correo mal escrito y el pago
 * que «dura siete días en el aire»: solo tarjeta para todos, y Zelle se
 * enciende a mano, tienda por tienda, para una persona de confianza.
 */
describe("la política global", () => {
  it("sin llave, o con cualquier valor raro, es CERRADO", () => {
    expect(politicaZelleDe(null)).toBe("cerrado");
    expect(politicaZelleDe(undefined)).toBe("cerrado");
    expect(politicaZelleDe("")).toBe("cerrado");
    expect(politicaZelleDe("si")).toBe("cerrado");
  });
  it("solo «abierto» abre", () => {
    expect(politicaZelleDe("abierto")).toBe("abierto");
    expect(politicaZelleDe(" ABIERTO ")).toBe("abierto");
  });
});

describe("qué tienda tiene Zelle", () => {
  it("CERRADO: nadie, salvo la tienda encendida a mano", () => {
    expect(zelleHabilitadaPara("cerrado", null)).toBe(false);
    expect(zelleHabilitadaPara("cerrado", false)).toBe(false);
    expect(zelleHabilitadaPara("cerrado", true)).toBe(true);
  });
  it("ABIERTO: todas, salvo la apagada a mano (la regla del 22 ago)", () => {
    expect(zelleHabilitadaPara("abierto", null)).toBe(true);
    expect(zelleHabilitadaPara("abierto", true)).toBe(true);
    expect(zelleHabilitadaPara("abierto", false)).toBe(false);
  });
});

describe("los candados en el código", () => {
  it("el enlace de cobro, el checkout y el servidor obedecen la política", () => {
    expect(readFileSync("src/lib/cobros/consultas.ts", "utf-8")).toContain(
      "habilitada: zelleHabilitadaPara(",
    );
    expect(readFileSync("src/lib/envios/acciones.ts", "utf-8")).toContain(
      "zelleAbiertoParaTiendas(",
    );
    expect(
      readFileSync("src/components/carrito/formulario-checkout.tsx", "utf-8"),
    ).toContain('m !== "zelle" || envio.zelleAbierto');
    /* El del servidor es el que vale: la pantalla se salta con la consola. */
    expect(readFileSync("src/lib/pedidos/acciones.ts", "utf-8")).toContain(
      "if (!(await zelleAbiertoParaTiendas(tiendasDelPedido)))",
    );
  });
  it("el interruptor general lo mueve solo soporte de verdad", () => {
    const admin = readFileSync("src/lib/cobros/zelle-admin.ts", "utf-8");
    const bloque = admin.slice(
      admin.indexOf("export async function guardarPoliticaZelle"),
      admin.indexOf("export async function guardarZelleDeTienda"),
    );
    expect(bloque).toContain("esSoporteDeVerdad()");
  });
});

describe("cerrar el saldo pagado por fuera", () => {
  const fuente = readFileSync("src/lib/retiros/acciones.ts", "utf-8");
  const bloque = fuente.slice(
    fuente.indexOf("export async function cerrarSaldoPorFuera"),
  );
  it("solo soporte de verdad, y con referencia obligatoria", () => {
    expect(bloque).toContain("esSoporteDeVerdad()");
    expect(bloque).toContain("referencia.length < 3");
  });
  it("primero paga lo pedido, después registra lo que queda como «externo» — no borra nada", () => {
    const pagaPedidos = bloque.indexOf('eq(retiros.estado, "solicitado")');
    const registra = bloque.indexOf('forma: "externo"');
    expect(pagaPedidos).toBeGreaterThan(0);
    expect(registra).toBeGreaterThan(pagaPedidos);
    expect(bloque).not.toContain(".delete(");
  });
  it("«externo» es una forma válida y tiene su texto en los dos idiomas", () => {
    expect(readFileSync("src/lib/db/schema.ts", "utf-8")).toMatch(
      /FORMAS_RETIRO = \[[\s\S]*?"externo"[\s\S]*?\] as const/,
    );
    for (const idioma of ["es", "en"]) {
      const d = JSON.parse(readFileSync(`messages/${idioma}.json`, "utf-8"));
      expect(d.panel.retiros.formas.externo).toBeTruthy();
      expect(d.panel.comercios.cerrarSaldo.boton).toBeTruthy();
    }
  });
});
