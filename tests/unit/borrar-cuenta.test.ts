import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  confirmoElBorrado,
  correoDeCuentaEliminada,
  esCuentaEliminada,
  ESTADOS_DE_PEDIDO_EN_CAMINO,
  puedeBorrarSuCuenta,
  type SituacionDeLaCuenta,
} from "@/lib/cuenta/borrar-puro";

/**
 * ══ BORRAR LA CUENTA (27 oct 2026) ══
 *
 * Google Play exige que la cuenta se pueda borrar desde la app y desde una
 * página web. Estas pruebas trancan las reglas y lo que no puede volver a
 * faltar: la página pública en inglés, el botón escondido en los tres puntos
 * y lo que se borra de verdad.
 */
const RAIZ = join(__dirname, "..", "..");
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), "utf8");

const cliente: SituacionDeLaCuenta = {
  rol: "cliente",
  tieneTienda: false,
  pedidosEnCamino: 0,
  paquetesEnBodega: 0,
};

describe("quién puede borrar su cuenta sola", () => {
  it("un comprador sin nada pendiente, sí", () => {
    expect(puedeBorrarSuCuenta(cliente)).toEqual({ ok: true });
  });

  it("el equipo y los comercios, no: se cierran con soporte", () => {
    for (const rol of ["vendedor", "validador", "soporte"]) {
      expect(puedeBorrarSuCuenta({ ...cliente, rol })).toEqual({
        ok: false,
        motivo: "equipo",
      });
    }
  });

  it("quien es dueño de una tienda, aunque diga «cliente», tampoco", () => {
    expect(puedeBorrarSuCuenta({ ...cliente, tieneTienda: true })).toEqual({
      ok: false,
      motivo: "tienda",
    });
  });

  it("con un pedido pagado en camino o paquetes en Miami, todavía no", () => {
    expect(puedeBorrarSuCuenta({ ...cliente, pedidosEnCamino: 1 })).toEqual({
      ok: false,
      motivo: "pedidos",
    });
    expect(puedeBorrarSuCuenta({ ...cliente, paquetesEnBodega: 2 })).toEqual({
      ok: false,
      motivo: "paquetes",
    });
  });

  it("un pedido SIN pagar no frena el borrado", () => {
    expect(ESTADOS_DE_PEDIDO_EN_CAMINO).not.toContain("pendiente_pago");
    expect(ESTADOS_DE_PEDIDO_EN_CAMINO).toEqual([
      "pagado",
      "preparando",
      "enviado",
    ]);
  });
});

describe("la palabra de confirmación", () => {
  it("vale BORRAR o DELETE, sin importar mayúsculas ni espacios", () => {
    expect(confirmoElBorrado("BORRAR")).toBe(true);
    expect(confirmoElBorrado("  delete ")).toBe(true);
    expect(confirmoElBorrado("Borrar")).toBe(true);
  });

  it("cualquier otra cosa no borra nada", () => {
    for (const x of ["", "BORRA", "sí", "DELETE ME", "borrar cuenta"]) {
      expect(confirmoElBorrado(x)).toBe(false);
    }
  });
});

describe("el correo que queda en la cuenta", () => {
  it("es único por usuario y no le llega a nadie (.invalid)", () => {
    const a = correoDeCuentaEliminada("u1");
    expect(a).not.toBe(correoDeCuentaEliminada("u2"));
    expect(a.endsWith(".invalid")).toBe(true);
    expect(esCuentaEliminada(a)).toBe(true);
    expect(esCuentaEliminada("persona@ejemplo.com")).toBe(false);
  });
});

describe("lo que se borra de verdad", () => {
  const borrar = leer("src/lib/cuenta/borrar.ts");

  it("todo va en UN lote: o se aplica entero o nada", () => {
    expect(borrar).toMatch(/db\.batch\(\[/);
  });

  it("se van la contraseña, las sesiones y las direcciones", () => {
    expect(borrar).toMatch(/\.delete\(session\)/);
    expect(borrar).toMatch(/\.delete\(account\)/);
    expect(borrar).toMatch(/\.delete\(direccionesDestino\)/);
    expect(borrar).toMatch(/\.delete\(verification\)/);
  });

  it("el nombre, el correo y el teléfono quedan vacíos", () => {
    expect(borrar).toMatch(/email: correoDeCuentaEliminada\(usuarioId\)/);
    expect(borrar).toMatch(/name: NOMBRE_DE_CUENTA_ELIMINADA/);
    expect(borrar).toMatch(/telefono: null/);
  });

  it("los pedidos NO se borran: la ley pide guardarlos cinco años", () => {
    expect(borrar).not.toMatch(/\.delete\(pedidos\)/);
    expect(borrar).not.toMatch(/\.delete\(facturas\)/);
  });
});

describe("dónde se borra", () => {
  it("la página pública existe y su dirección va en inglés", () => {
    expect(
      existsSync(
        join(RAIZ, "src/app/[locale]/(tienda)/(docs)/delete-account/page.tsx"),
      ),
    ).toBe(true);
  });

  it("en «Mi cuenta» el borrado vive dentro de los tres puntos, no a la vista", () => {
    const cuenta = leer("src/app/[locale]/(tienda)/cuenta/page.tsx");
    expect(cuenta).toMatch(/<MenuCuenta \/>/);
    expect(cuenta).not.toMatch(/borrarMiCuenta|<BorrarCuenta/);

    const menu = leer("src/components/cuenta/menu-cuenta.tsx");
    expect(menu).toMatch(/role="menu"/);
    expect(menu).toMatch(/href="\/delete-account"/);
  });

  it("el botón rojo no se enciende sin escribir la palabra", () => {
    const formulario = leer("src/components/cuenta/borrar-cuenta.tsx");
    expect(formulario).toMatch(/disabled=\{!lista \|\| enCurso\}/);
  });

  it("la privacidad y Docs llevan a la página", () => {
    expect(leer("src/contenido/paginas/privacidad.ts")).toMatch(
      /mercatren\.com\/delete-account/,
    );
    expect(leer("src/lib/docs/indice.ts")).toMatch(/"\/delete-account"/);
  });
});

describe("los textos, en los dos idiomas", () => {
  const motivos = [
    "equipo",
    "tienda",
    "pedidos",
    "paquetes",
    "sesion",
    "palabra",
    "fallo",
  ];

  for (const idioma of ["es", "en"]) {
    it(`${idioma}: hay un mensaje para cada motivo y el correo de aviso`, () => {
      const m = JSON.parse(leer(`messages/${idioma}.json`));
      for (const motivo of motivos) {
        expect(m.borrarCuenta.errores[motivo]).toBeTruthy();
      }
      expect(m.correos.cuentaEliminada.parrafos.length).toBeGreaterThan(0);
    });
  }
});
