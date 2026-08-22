import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { aCentavos } from "@/lib/retiros/monto";

/**
 * PEDIR UN COBRO DESDE EL PANEL, Y REENVIARLO A UN TERCERO.
 *
 * Hasta el 21 de agosto de 2026 el cobro por enlace existía **solo por API**,
 * así que solo lo tenía el único comercio que la integró. Los demás abrían la
 * pantalla, la veían vacía para siempre, y no había un botón para crear nada.
 */
describe("EL MONTO NO PUEDE PERDER EL PUNTO DECIMAL", () => {
  /**
   * Este es el fallo que casi se publica, y no lo atrapó ningún tipo: el campo
   * se había puesto como `tipo="soloNumeros"`, que **filtra el punto**. Quien
   * escribía 45.90 guardaba 4590 → **$4,590.00 cobrados por una factura de
   * cuarenta y cinco dólares**. Lo destapó llenar el formulario en pantalla.
   */
  it("45.90 son 4590 centavos, no 459000", () => {
    expect(aCentavos("45.90")).toBe(4590);
  });

  it("un entero sin punto sigue funcionando", () => {
    expect(aCentavos("100")).toBe(10_000);
  });

  it("la casilla del monto acepta decimales", () => {
    const ui = readFileSync("src/components/panel/pedir-cobro.tsx", "utf8");
    const monto = ui.slice(
      ui.indexOf('name="monto"') - 400,
      ui.indexOf('name="monto"') + 300,
    );

    expect(
      monto,
      "el monto volvió a un campo que filtra el punto: 45.90 se cobraría como 4590",
    ).toContain('inputMode="decimal"');
    expect(monto).not.toContain('tipo="soloNumeros"');
  });
});

describe("el enlace tiene que poder reenviarse", () => {
  it("la consulta trae el enlace, no solo la referencia", () => {
    /* Sin esto, el comercio veía su cobro en pantalla y **no tenía nada que
       copiar**: para mandárselo a alguien había que sacarlo de la base. */
    const consultas = readFileSync("src/lib/cobros/consultas.ts", "utf8");
    const lista = consultas.slice(
      consultas.indexOf("export async function listarEnlacesDeCobro"),
    );
    expect(lista).toContain("enlace: cobrosSolicitados.enlace");
  });

  it("reenviar NO genera un enlace nuevo", () => {
    /* La referencia y el enlace se conservan a propósito: en el extracto del
       banco tiene que seguir apareciendo el mismo número. Anular y recrear
       obligaría a cambiar la referencia, que es lo que ensucia la
       conciliación. */
    const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    const reenviar = pedir.slice(
      pedir.indexOf("export async function reenviarCobro"),
    );
    expect(reenviar).not.toContain("generarEnlace()");
    expect(reenviar).toContain("cobro.enlace");
  });

  it("uno pagado no se reenvía", () => {
    /* Mandarle a alguien el enlace de algo ya pagado es invitarlo a pagarlo
       dos veces. */
    const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    const reenviar = pedir.slice(
      pedir.indexOf("export async function reenviarCobro"),
    );
    expect(reenviar).toContain('estado === "pagado"');
    expect(reenviar).toContain('estado === "cancelado"');
  });

  it("el alcance va DENTRO de la búsqueda del cobro", () => {
    /* Si fuera después, alguien podría reenviar el enlace de un cobro de otro
       comercio escribiendo su id a mano. */
    const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    const reenviar = pedir.slice(
      pedir.indexOf("export async function reenviarCobro"),
    );
    const donde = reenviar.indexOf(".where(");
    const limite = reenviar.indexOf(".limit(1)");
    expect(reenviar.slice(donde, limite)).toContain("alcance.tiendaId");
  });
});

describe("el equipo no adivina de qué comercio es el cobro", () => {
  it("si no lo dice, no se crea", () => {
    /* Un cobro creado para el comercio equivocado le acredita el dinero a
       otro. Un comercio no elige: solo puede ser el suyo. */
    const pedir = readFileSync("src/lib/cobros/pedir.ts", "utf8");
    expect(pedir).toContain("Elige de qué comercio es este cobro");
  });
});
