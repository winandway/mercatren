import { describe, expect, it } from "vitest";

import { aCentavos } from "@/lib/cj/lista";
import { precioPublicadoUs } from "@/lib/destino/precio-us";

/**
 * EL PRECIO QUE LLEGA DE CJ.
 *
 * ══ EL FALLO QUE ESTO IMPIDE QUE VUELVA ══
 *
 * La pantalla del catálogo de EE. UU. salía **vacía para cualquier búsqueda**.
 * La causa: un producto de CJ con variantes —tallas, colores— manda el precio
 * como rango, `"12.50 -- 15.30"`. `Number()` de eso da NaN, el NaN se
 * convertía en cero, y el cero hacía que el producto se descartara por «sin
 * precio».
 *
 * Tres búsquedas seguidas sin un solo resultado y ni una pista de por qué.
 *
 * ══ Y SE PRUEBA LA FUNCIÓN DE VERDAD, NO UNA COPIA ══
 *
 * La primera versión de esta prueba traía su propia copia de `aCentavos`,
 * porque el archivo donde vivía es `server-only` y no se puede importar desde
 * una prueba. Una copia siempre pasa en verde: mide lo que la prueba escribió,
 * no lo que corre en producción. Por eso la función se mudó a `cj/lista.ts`,
 * que no toca ni la llave ni la red.
 */

describe("el precio que manda CJ", () => {
  it("un número normal se pasa a centavos", () => {
    expect(aCentavos(12.5)).toBe(1250);
    expect(aCentavos("12.50")).toBe(1250);
  });

  it("UN RANGO se resuelve al más barato, no a cero", () => {
    /* Este es el fallo que dejaba la pantalla vacía. */
    expect(aCentavos("12.50 -- 15.30")).toBe(1250);
    expect(aCentavos("12.50-15.30")).toBe(1250);
    expect(aCentavos("$12.50 – $15.30")).toBe(1250);
  });

  it("no pierde el centavo por la coma flotante", () => {
    /* `45.90 * 100` da 4589.999999999999 sin el `toPrecision`, y ese centavo
       aparece después en una factura que no cuadra. */
    expect(aCentavos(45.9)).toBe(4590);
    expect(aCentavos("45.90 -- 60.00")).toBe(4590);
  });

  it("lo que de verdad no trae precio sí da cero", () => {
    expect(aCentavos("")).toBe(0);
    expect(aCentavos(undefined)).toBe(0);
    expect(aCentavos("sin precio")).toBe(0);
    expect(aCentavos(0)).toBe(0);
    expect(aCentavos(-5)).toBe(0);
  });

  it("y un rango llega hasta el precio publicado sin romperse", () => {
    expect(precioPublicadoUs(aCentavos("25.00 -- 40.00"), 0)).toBeGreaterThan(
      2500,
    );
  });
});
