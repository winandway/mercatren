import { readFileSync } from "node:fs";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BanderaDelMercado } from "@/components/marca/bandera-pais";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * LA BANDERITA DEL PAÍS EN EL ENCABEZADO (28 ago 2026).
 *
 * Pedido del dueño: en mercatren.cl una banderita de Chile al lado del logo;
 * en mercatren.com.co la de Colombia. El principal va limpio — se marca la
 * excepción, no lo normal.
 */
describe("la bandera del mercado en el encabezado", () => {
  it("Chile y Colombia dibujan su bandera con el nombre del país", () => {
    for (const codigo of ["CL", "CO"]) {
      const mercado = mercadoPorCodigo(codigo);
      const { container, unmount } = render(
        <BanderaDelMercado mercado={mercado} />,
      );
      expect(container.querySelector("svg")).not.toBeNull();
      expect(container.textContent).toContain(mercado.nombre);
      unmount();
    }
  });

  it("EL .COM TAMBIÉN LLEVA LA SUYA (7 sep 2026)", () => {
    /**
     * Esta prueba exigía lo CONTRARIO: que el dominio principal no dibujara
     * bandera, porque «lo normal no se marca». Era cierto mientras
     * mercatren.com era la casa y los demás la excepción.
     *
     * Dejó de serlo el día que Venezuela se mudó a su propio dominio: el
     * .com pasó a ser el dominio de UN país más —Estados Unidos— al lado de
     * mercatren.cl, mercatren.com.co y mercatren.com.ve. Lo pidió Richard
     * mirando su propio encabezado: «vamos a poner la bandera de Estados
     * Unidos al lado del logo como está en todos los sitios».
     *
     * Y ahora hace falta de verdad: con cuatro plazas y gente que tenía su
     * cuenta en el .com, la bandera es la respuesta de un vistazo a «¿dónde
     * estoy parado?».
     */
    const { container } = render(
      <BanderaDelMercado mercado={mercadoPorCodigo("US")} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("Estados Unidos");
  });

  it("sin el nombre al lado cuando va dentro de un botón estrecho", () => {
    /* En el celular la bandera ES el botón de «Mercatren en el mundo»: con
       el nombre al lado no cabría el carrito. */
    const { container } = render(
      <BanderaDelMercado mercado={mercadoPorCodigo("VE")} soloBandera />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.textContent).not.toContain("Venezuela");
  });

  it("ES UN DIBUJO SVG, NUNCA UN EMOJI — el emoji no se dibuja en Windows", () => {
    const fuente = readFileSync(
      "src/components/marca/bandera-pais.tsx",
      "utf-8",
    );
    /* Los emojis de bandera son parejas de «regional indicators» U+1F1E6+. */
    expect(/[\u{1F1E6}-\u{1F1FF}]/u.test(fuente)).toBe(false);
  });

  it("el encabezado la lleva puesta junto al logo", () => {
    const fuente = readFileSync(
      "src/components/layout/encabezado.tsx",
      "utf-8",
    );
    expect(fuente).toContain("BanderaDelMercado");
  });
});
