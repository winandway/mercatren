import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * NADIE APRUEBA SUS PROPIOS COBROS.
 *
 * Un comercio no puede acreditarse a sí mismo un pago: sería cobrar en su
 * propia caja y darse el vuelto. La comprobación contra el banco la hace el
 * equipo de Mercatren, y eso es justo lo que le da valor a la verificación —
 * si el que cobra pudiera aprobarse, no verificaría nada.
 *
 * Esta prueba vigila las dos barreras, porque una sola no basta:
 *
 * 1. EN EL SERVIDOR. `aprobarPago` y `rechazarPago` exigen equipo interno.
 *    Es la que de verdad protege: alguien puede llamar a la acción sin pasar
 *    por la pantalla.
 * 2. EN LA PANTALLA. Los botones solo se dibujan para el equipo. Sin esto la
 *    barrera aguanta igual, pero al comercio se le enseña un botón que le va
 *    a fallar, y eso es maltratarlo.
 */

const RAIZ = join(import.meta.dirname, "..", "..", "src");

describe("quién puede aprobar un pago", () => {
  const acciones = readFileSync(
    join(RAIZ, "lib", "zelle", "acciones.ts"),
    "utf8",
  );

  it("aprobar y rechazar exigen ser del equipo de Mercatren", () => {
    for (const accion of ["aprobarPago", "rechazarPago"]) {
      const desde = acciones.indexOf(`export async function ${accion}`);
      expect(desde, `no existe ${accion}`).toBeGreaterThan(-1);

      // La comprobación va al principio, antes de tocar nada.
      const cabecera = acciones.slice(desde, desde + 400);
      expect(
        cabecera,
        `${accion} tiene que empezar exigiendo equipo interno`,
      ).toContain("exigirEquipoInterno");
    }
  });

  it("los botones solo se dibujan para el equipo", () => {
    const pagina = readFileSync(
      join(RAIZ, "app", "[locale]", "panel", "validacion", "page.tsx"),
      "utf8",
    );

    // Las acciones se montan detrás de la comprobación de rol.
    expect(pagina).toContain("esEquipoInterno");
    expect(pagina).toMatch(/interno\s*(\?|&&)/);
  });

  it("al comercio se le habla de lo suyo, no de una cola de trabajo", () => {
    const pagina = readFileSync(
      join(RAIZ, "app", "[locale]", "panel", "validacion", "page.tsx"),
      "utf8",
    );

    // Si el texto no cambia por rol, el comercio lee la pantalla del equipo y
    // cree que está dentro de la consola del administrador.
    expect(pagina).toContain("tituloComercio");
    expect(pagina).toContain("subtituloComercio");
  });
});
