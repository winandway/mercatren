import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { formularioDeEdicion } from "@/lib/app-movil/editar-producto";
import {
  faltaEnSeguridad,
  hayAlgoDeSeguridad,
  pideSeguridadUe,
  seguridadDelFormulario,
} from "@/lib/productos/seguridad";

/**
 * QUIÉN FABRICA EL PRODUCTO, PARA VENDER EN ESPAÑA (5 nov 2026; Reglamento UE
 * 2023/988, art. 19). Lo que no puede pasar sin que esto se ponga en rojo:
 * - que se publique en España un producto sin fabricante ni forma de
 *   escribirle;
 * - que se le pida a una tienda de otro país;
 * - que editar el precio desde la app borre lo guardado del fabricante (y el
 *   producto se rechace al guardar);
 * - que la ficha no lo enseñe, en la web o en la app;
 * - que mirar una ficha de otro país lea la base por esto.
 */
const RAIZ = join(import.meta.dirname, "..", "..");
const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");

const BIEN = {
  fabricanteNombre: "Casa Luz",
  fabricanteDireccion: "Calle de ejemplo 1, 28001 Madrid",
  fabricanteCorreo: "contacto@ejemplo.com",
  responsableUe: "",
  advertenciasEs: "",
  advertenciasEn: "",
};

describe("lo que hace falta para publicar en España", () => {
  it("solo a las tiendas de España", () => {
    expect(pideSeguridadUe("ES")).toBe(true);
    expect(pideSeguridadUe(" es ")).toBe(true);
    expect(pideSeguridadUe("US")).toBe(false);
    expect(pideSeguridadUe("VE")).toBe(false);
    expect(pideSeguridadUe(null)).toBe(false);
  });

  it("quién fabrica, su dirección y un correo válido", () => {
    expect(faltaEnSeguridad(BIEN)).toBeNull();
    expect(faltaEnSeguridad({ ...BIEN, fabricanteNombre: " " })).toBe(
      "seguridadFabricante",
    );
    expect(faltaEnSeguridad({ ...BIEN, fabricanteDireccion: "x" })).toBe(
      "seguridadDireccion",
    );
    expect(faltaEnSeguridad({ ...BIEN, fabricanteCorreo: "sin-arroba" })).toBe(
      "seguridadCorreo",
    );
  });

  it("lee el formulario recortado, con tope, y sabe si está vacío", () => {
    const d = seguridadDelFormulario({
      fabricanteNombre: "  Casa Luz ",
      advertenciasEs: "x".repeat(5000),
    });
    expect(d.fabricanteNombre).toBe("Casa Luz");
    expect(d.advertenciasEs).toHaveLength(2000);
    expect(hayAlgoDeSeguridad(seguridadDelFormulario({}))).toBe(false);
  });

  it("guardarProducto lo exige al publicar en España y lo guarda", () => {
    const accion = leer("src/lib/productos/acciones.ts");
    expect(accion).toContain("pideSeguridadUe(vitrina?.mercado)");
    expect(accion).toContain('if (seguridad && d.estado === "publicado") {');
    expect(accion).toContain(".insert(seguridadProducto)");
  });
});

describe("la app no borra lo guardado al editar", () => {
  it("manda lo guardado del fabricante, y encima lo que cambió la app", () => {
    const f = formularioDeEdicion(
      "p1",
      {
        sku: null,
        categoriaId: null,
        marca: null,
        unidad: null,
        precioAntesCentavos: null,
        moneda: "EUR",
        destacado: false,
        estado: "publicado",
        zonaDeposito: null,
        seguridad: {
          fabricanteNombre: "Casa Luz",
          fabricanteDireccion: "Calle de ejemplo 1",
          fabricanteCorreo: "contacto@ejemplo.com",
          responsableUe: null,
        },
      },
      { precio: "20.00", fabricanteCorreo: "nuevo@ejemplo.com" },
    );
    expect(f.fabricanteNombre).toBe("Casa Luz");
    expect(f.fabricanteDireccion).toBe("Calle de ejemplo 1");
    expect(f.fabricanteCorreo).toBe("nuevo@ejemplo.com");
    expect(f.responsableUe).toBeUndefined();
    expect(f.precio).toBe("20.00");
  });

  it("al crear desde la app, los campos del fabricante pasan al servidor", () => {
    expect(leer("src/app/datos/app/mi/productos/route.ts")).toContain(
      "...CAMPOS_SEGURIDAD,",
    );
  });
});

describe("se ve en la ficha, en la web y en la app", () => {
  it("la ficha web y la de la app lo enseñan", () => {
    expect(
      leer("src/app/[locale]/(tienda)/producto/[slug]/page.tsx"),
    ).toContain('t("seguridadTitulo")');
    expect(leer("src/app/datos/app/v1/producto/[slug]/route.ts")).toContain(
      "seguridadDelProducto(",
    );
    expect(leer("app-movil/src/app/producto/[slug].tsx")).toContain(
      "f.seguridad.fabricante",
    );
  });

  it("los formularios del panel y de la app lo piden", () => {
    expect(leer("src/components/panel/formulario-producto.tsx")).toContain(
      'nombre="fabricanteNombre"',
    );
    expect(leer("app-movil/src/components/formulario-producto.tsx")).toContain(
      "camposDeSeguridad(seg)",
    );
  });

  it("fuera de España, mirar una ficha no lee la base por esto", () => {
    const c = leer("src/lib/productos/seguridad-consultas.ts");
    expect(
      c.indexOf("if (!pideSeguridadUe(mercado)) return null;"),
    ).toBeLessThan(c.indexOf("getDb()"));
  });
});
