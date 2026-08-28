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

  it("EL MERCADO PRINCIPAL NO DIBUJA NADA — lo normal no se marca", () => {
    const { container } = render(
      <BanderaDelMercado mercado={mercadoPorCodigo("US")} />,
    );
    expect(container.innerHTML).toBe("");
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
