import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * LA FICHA DE PRODUCTO SABE PARA QUÉ TIENDA ES Y DE QUÉ PAÍS (5 sep 2026).
 *
 * Un miembro del equipo llenó un producto entero para una tienda de Estados
 * Unidos, eligiendo entre CIUDADES DE VENEZUELA, y al guardar el servidor
 * contestó «no se sabe a qué tienda va este producto» — y React vació el
 * formulario. Tres fallos, tres candados.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf8");

describe("primero la tienda, después la ficha", () => {
  const nuevo = leer("src/app/[locale]/panel/productos/nuevo/page.tsx");
  const lista = leer("src/app/[locale]/panel/productos/page.tsx");

  it("sin tienda elegida NO se dibuja la ficha: se elige primero", () => {
    const sinTienda = nuevo.indexOf("if (!tiendaId) {");
    const ficha = nuevo.indexOf("<FormularioProducto");
    expect(sinTienda).toBeGreaterThan(-1);
    expect(ficha).toBeGreaterThan(sinTienda);
    expect(nuevo).toContain("<BuscadorDeComercio");
    /* Con su propio rótulo: el del buscador es el de la calculadora
       («¿Por qué comercio estás cuadrando?»), que aquí no dice nada. */
    expect(nuevo).toContain('titulo={t("paraQueComercio")}');
    /* Y la ficha dice para quién es. */
    expect(nuevo).toContain('t("paraTienda"');
    expect(nuevo).toContain("paisOrigen={tienda?.paisOrigen}");
  });

  it("el botón «Nuevo producto» de la lista arrastra el comercio que se mira", () => {
    expect(lista).not.toContain('href="/panel/productos/nuevo"');
    expect(lista).toContain(
      "/panel/productos/nuevo?comercio=${encodeURIComponent(filtros.comercio)}",
    );
    expect(lista.split("href={enlaceNuevo}").length - 1).toBe(2);
  });
});

describe("la ciudad de retiro es cosa de Venezuela", () => {
  const formulario = leer("src/components/panel/formulario-producto.tsx");
  const acciones = leer("src/lib/productos/acciones.ts");
  const consultas = leer("src/lib/productos/consultas.ts");
  const editar = leer("src/app/[locale]/panel/productos/[id]/page.tsx");

  it("el selector de ciudad solo se dibuja si la mercancía se retira (VE)", () => {
    expect(formulario).toContain('(paisOrigen ?? "VE") === "VE"');
    const compuerta = formulario.indexOf("{!seRetiraEnCiudad ? (");
    const selector = formulario.indexOf('name="ciudadDeposito"');
    expect(compuerta).toBeGreaterThan(-1);
    expect(selector).toBeGreaterThan(compuerta);
    /* Y a los demás se les dice que se despacha, no se les deja un hueco. */
    expect(formulario).toContain('t("seDespachaEn"');
  });

  it("el servidor tampoco crea depósitos fuera de Venezuela", () => {
    expect(acciones).toContain("paisOrigen: tiendas.paisOrigen");
    expect(acciones).toContain(
      "if (seRetiraEnCiudad && ciudadDeposito && zonaPorSlug(ciudadDeposito)) {",
    );
  });

  it("la ficha de edición recibe el país de la tienda", () => {
    expect(consultas).toContain("paisOrigen: tiendas.paisOrigen");
    expect(consultas).toContain("tienda: tienda ?? null,");
    expect(editar).toContain("paisOrigen={datos.tienda?.paisOrigen}");
  });

  it("los textos nuevos existen en los dos idiomas", () => {
    for (const idioma of ["es", "en"]) {
      const m = JSON.parse(leer(`messages/${idioma}.json`)) as {
        panel: { producto: Record<string, unknown> };
      };
      for (const clave of [
        "eligeTiendaPrimero",
        "paraQueComercio",
        "paraTienda",
        "seDespachaEn",
      ]) {
        expect(typeof m.panel.producto[clave], `${idioma}.${clave}`).toBe(
          "string",
        );
      }
      const paises = m.panel.producto.paises as Record<string, string>;
      expect(Object.keys(paises).sort()).toEqual(["CL", "CO", "US"]);
    }
  });
});
