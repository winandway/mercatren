import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * ══ ASIGNAR UN HUÉRFANO A MANO (9 sep 2026) ══
 *
 * La acción vive detrás de `"use server"` y toca la base, así que aquí se
 * tranca la FORMA del código: los tres cerrojos que evitan que una caja
 * termine en el casillero de otro cliente.
 */
const accion = readFileSync("src/lib/casillero/bodega-acciones.ts", "utf8");

describe("asignar a mano solo mueve lo que sigue huérfano", () => {
  it("el UPDATE exige casillero_id IS NULL y mira cuántas filas tocó", () => {
    /* Dos personas mirando la misma cola no pueden mover el mismo paquete
       dos veces: la segunda se lo quitaría a un cliente que ya lo tenía. */
    const cuerpo = accion.slice(
      accion.indexOf("async function asignarHuerfano"),
    );
    expect(cuerpo).toMatch(/isNull\(paquetesCasillero\.casilleroId\)/);
    expect(cuerpo).toMatch(/\.returning\(\{ id: paquetesCasillero\.id \}\)/);
    expect(cuerpo).toMatch(/tocadas\.length === 0/);
    expect(cuerpo).toMatch(/error: "ya-asignado"/);
  });

  it("las dos entradas (por id y por código) pasan por el mismo cerrojo", () => {
    expect(accion).toMatch(
      /export async function asignarAMano[\s\S]*?return asignarHuerfano\(/,
    );
    expect(accion).toMatch(
      /export async function asignarPorCodigo[\s\S]*?return asignarHuerfano\(/,
    );
  });
});

describe("asignar por código", () => {
  const porCodigo = accion.slice(
    accion.indexOf("export async function asignarPorCodigo"),
    accion.indexOf("async function asignarHuerfano"),
  );

  it("exige sesión del equipo ANTES de leer nada", () => {
    expect(porCodigo.indexOf("esEquipoInterno()")).toBeLessThan(
      porCodigo.indexOf("formulario.get"),
    );
  });

  it("valida el dígito de control: un dedo que resbala no manda la caja a otro", () => {
    expect(porCodigo).toMatch(/codigoValido\(codigo\)/);
    expect(porCodigo).toMatch(/error: "codigo"/);
  });

  it("no asigna a un casillero que no existe ni a uno suspendido", () => {
    expect(porCodigo).toMatch(/error: "no-existe"/);
    expect(porCodigo).toMatch(/c\.estado === "suspendido"/);
    expect(porCodigo).toMatch(/error: "suspendido"/);
  });
});

describe("la pantalla", () => {
  it("la cola de huérfanos y los candidatos llevan el botón", () => {
    const cola = readFileSync("src/app/[locale]/panel/bodega/page.tsx", "utf8");
    const recepcion = readFileSync(
      "src/components/casillero/recepcion-bodega.tsx",
      "utf8",
    );
    expect(cola).toMatch(/<AsignarHuerfano paqueteId=\{p\.id\}/);
    expect(recepcion).toMatch(/codigoFijo=\{c\.codigo\}/);
  });
});
