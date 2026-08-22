import { describe, expect, it } from "vitest";

import { comoSePago } from "@/lib/cobros/como-se-pago";

/**
 * «ESTA FACTURA YA SE PAGÓ» TIENE QUE DECIR CÓMO.
 *
 * Lo pidió el dueño: quien vuelve a abrir el enlace —el cliente que no
 * recuerda, o el comercio que le hizo varios cobros al mismo— necesita ver de
 * un golpe que ese está cerrado, con su método y su fecha.
 */
describe("de qué manera se pagó", () => {
  it("un identificador de Stripe es tarjeta", () => {
    expect(comoSePago({ pagoId: "pi_3Ab...", tieneZelle: false })).toBe(
      "tarjeta",
    );
    expect(comoSePago({ pagoId: "ch_3Ab...", tieneZelle: false })).toBe(
      "tarjeta",
    );
  });

  it("una captura validada es Zelle, aunque quede un intento de tarjeta", () => {
    /* Pasa de verdad: la persona abre el pago con tarjeta, lo duda, y termina
       mandando el Zelle. El intento queda abierto y no significa nada. */
    expect(comoSePago({ pagoId: "pi_3Ab...", tieneZelle: true })).toBe("zelle");
  });

  it("sin nada que lo diga, NO se inventa", () => {
    /* Un cobro pagado del que no se sabe el método sigue estando pagado, y eso
       es lo que importa. Poner «tarjeta» porque es lo más común sería enseñar
       un dato que nadie comprobó, en una pantalla que mira alguien que está
       conciliando su banco. */
    expect(comoSePago({ pagoId: null, tieneZelle: false })).toBe("desconocido");
    expect(comoSePago({ pagoId: "", tieneZelle: false })).toBe("desconocido");
    expect(comoSePago({ pagoId: "algo-raro", tieneZelle: false })).toBe(
      "desconocido",
    );
  });

  it("se mira el PREFIJO, no «si hay pagoId es tarjeta»", () => {
    /* El día que entre otro procesador, esa suposición se rompe en silencio y
       el aviso empezaría a decir «tarjeta» de cobros que no lo son. */
    expect(comoSePago({ pagoId: "otro_proc_123", tieneZelle: false })).toBe(
      "desconocido",
    );
  });
});
