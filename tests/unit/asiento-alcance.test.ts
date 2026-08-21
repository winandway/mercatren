import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * EL ASIENTO CONTABLE ES DE MERCATREN LLC, NO DE UN COMERCIO.
 *
 * Trae el ingreso BRUTO de todos los comercios juntos, el costo de la
 * mercancía y lo que se llevó el procesador. O sea: las ventas de la
 * competencia y el margen de la casa, en un solo archivo.
 *
 * La ruta `/datos/exportar` solo exige `tienePermisoDePanel()`, y ese permiso
 * lo tiene el rol `vendedor`. Sin una guardia propia dentro de la consulta,
 * cualquier comercio se lo lleva escribiendo `?que=asiento` en la barra de
 * direcciones — sin tocar nada, sin abrir la consola.
 *
 * Estas dos pruebas miran el archivo porque es lo único que atrapa a quien
 * desenchufa la guardia: la consulta puede seguir perfecta mientras alguien
 * le quita el `esEquipoInterno` de arriba.
 */
describe("EL ASIENTO CONTABLE NO SE LO PUEDE LLEVAR UN COMERCIO", () => {
  const fuente = readFileSync("src/lib/exportar/consultas.ts", "utf8");
  const asiento = fuente.slice(
    fuente.indexOf("export async function tablaDelAsientoMensual"),
  );

  it("la consulta exige equipo interno", () => {
    expect(
      asiento.slice(0, 900),
      "el asiento dejó de comprobar quién lo pide: un vendedor puede descargar la contabilidad entera",
    ).toContain("esEquipoInterno");
  });

  it("y lo comprueba ANTES de tocar la base", () => {
    /* Comprobarlo después sería consultar el dinero de todos para luego
       decidir si se enseña. La guardia va primero. */
    expect(asiento.indexOf("esEquipoInterno")).toBeLessThan(
      asiento.indexOf("getDb()"),
    );
  });
});
