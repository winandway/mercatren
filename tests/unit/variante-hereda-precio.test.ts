import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { combinacionRepetida, precioDeVariante } from "@/lib/productos/heredar";

/**
 * EL ROUTER A $0.00 (31 ago 2026 — urgente, con un cliente esperando).
 *
 * Un comercio cargó su router en $50, agregó la variante «Negro» para el
 * stock y dejó el precio de la fila en 0. La ficha publicó $0.00 y
 * `crearPedido` lo habría cobrado así: mercancía regalada.
 */
describe("la variante sin precio hereda el del producto", () => {
  it("cero = vale lo del producto, NO vale cero", () => {
    expect(precioDeVariante(0, 5346)).toBe(5346);
    expect(precioDeVariante(null, 5346)).toBe(5346);
    expect(precioDeVariante(undefined, 5346)).toBe(5346);
  });

  it("un precio propio manda sobre el del producto", () => {
    expect(precioDeVariante(6000, 5346)).toBe(6000);
  });

  it("un negativo colado no se convierte en precio", () => {
    expect(precioDeVariante(-100, 5346)).toBe(5346);
  });

  it("LA FICHA Y EL PEDIDO usan la herencia — los dos", () => {
    /* Con uno solo, la ficha diría $53.46 y el cobro saldría en $0.00 (o al
       revés): la contradicción de dinero que no puede volver. */
    expect(readFileSync("src/lib/productos/variantes.ts", "utf-8")).toContain(
      "precioDeVariante(",
    );
    expect(readFileSync("src/lib/pedidos/acciones.ts", "utf-8")).toContain(
      "precioDeVariante(variante.precioCentavos",
    );
  });
});

describe("«Negro» y «NEGRO» son la misma variante", () => {
  it("la repetida se detecta ignorando mayúsculas y se nombra", () => {
    expect(
      combinacionRepetida([
        { talla: null, color: "Negro" },
        { talla: null, color: "NEGRO" },
      ]),
    ).toBe("NEGRO");
  });

  it("combinaciones de verdad distintas pasan", () => {
    expect(
      combinacionRepetida([
        { talla: "M", color: "Negro" },
        { talla: "L", color: "Negro" },
        { talla: null, color: "Rojo" },
      ]),
    ).toBeNull();
  });

  it("las filas vacías no cuentan como repetidas entre sí", () => {
    expect(
      combinacionRepetida([
        { talla: null, color: null },
        { talla: null, color: null },
      ]),
    ).toBeNull();
  });

  it("el guardado del panel la rechaza CON nombre", () => {
    const fuente = readFileSync("src/lib/productos/acciones.ts", "utf-8");
    expect(fuente).toContain("combinacionRepetida(");
    expect(fuente).toContain('t("varianteRepetida"');
  });
});

describe("el botón de guardar no se queda girando", () => {
  it("los dos guardados llevan try/finally con mensaje honesto", () => {
    /* Sin el finally, un corte de red dejaba el spinner PARA SIEMPRE y sin
       mensaje — un comercio con un cliente delante estuvo así una tarde. */
    const fuente = readFileSync(
      "src/components/panel/variantes-producto.tsx",
      "utf-8",
    );
    expect(fuente.match(/finally \{\s*setGuardando\(false\);/g)?.length).toBe(
      2,
    );
    expect(fuente.match(/t\("noSePudoGuardar"\)/g)?.length).toBe(2);
  });
});
