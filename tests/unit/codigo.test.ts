import { describe, expect, it } from "vitest";

import { codigoVisible } from "@/lib/catalogo/codigo";

/**
 * EL CÓDIGO QUE VE EL COMPRADOR.
 *
 * Los del proveedor empiezan por sus siglas. Puestos en la ficha, cualquiera
 * los busca y llega al mismo producto en el catálogo del mayorista.
 */
describe("el código que se enseña en la ficha", () => {
  it("le quita las siglas del proveedor y le pone el nuestro", () => {
    expect(codigoVisible("CJCS2493466", "US")).toBe("MT-2493466");
    expect(codigoVisible("CJZX2689829", "US")).toBe("MT-2689829");
    expect(codigoVisible("CJNSSYWY01847", "US")).toBe("MT-01847");
  });

  it("los números se conservan enteros", () => {
    /* Son los que identifican el producto: con dos artículos casi iguales, el
       código es lo que permite decir «el tal» y que todos miren el mismo. */
    expect(codigoVisible("CJCS2493466", "US")).toContain("2493466");
  });

  it("el código de un comercio venezolano NO se toca", () => {
    /* Es suyo y lo usa en su propio sistema: cambiárselo le rompe la
       referencia con la que despacha. */
    expect(codigoVisible("PVC-3-4", "VE")).toBe("PVC-3-4");
    expect(codigoVisible("TEE-PVC-3", null)).toBe("TEE-PVC-3");
  });

  it("no se pone el prefijo dos veces", () => {
    expect(codigoVisible("MT-2493466", "US")).toBe("MT-2493466");
  });

  it("un código sin números se devuelve entero", () => {
    /* Recortarlo lo dejaría vacío. Mejor un código feo que ninguno. */
    expect(codigoVisible("SOLOLETRAS", "US")).toBe("SOLOLETRAS");
  });

  it("sin código no se inventa uno", () => {
    expect(codigoVisible(null, "US")).toBeNull();
    expect(codigoVisible("", "US")).toBeNull();
    expect(codigoVisible("   ", "US")).toBeNull();
  });
});

describe("las plazas nuevas también se disfrazan (28 ago 2026)", () => {
  it("EL CÓDIGO CHILENO LLEVA SU PAÍS: CJFU2936798 → MT-CL-2936798", () => {
    /* Lo encontró el dueño en mercatren.cl: la ficha chilena enseñaba el
       código de CJ crudo — el camino directo para saltarse la tienda. */
    expect(codigoVisible("CJFU2936798", "CL")).toBe("MT-CL-2936798");
    expect(codigoVisible("CJNS0533400", "CO")).toBe("MT-CO-0533400");
  });

  it("el de EE. UU. conserva su formato ya publicado, sin país", () => {
    expect(codigoVisible("CJCS2493466", "US")).toBe("MT-2493466");
  });

  it("el de un comercio venezolano sigue siendo SUYO, intacto", () => {
    expect(codigoVisible("TUBO-160-3MM", "VE")).toBe("TUBO-160-3MM");
  });
});
