import { describe, expect, it } from "vitest";

import { conceptoDelPago, MARCA_CONCEPTO } from "@/lib/pedidos/concepto";

/**
 * EL CONCEPTO DEL ZELLE.
 *
 * Es lo único que ata una transferencia suelta a una venta. Sin él, quien
 * valida ve un monto y el nombre de alguien que no compró, y tiene que
 * adivinar. El porqué largo está en el módulo.
 */

describe("qué se escribe en la nota de la transferencia", () => {
  it("lleva la marca delante del número", () => {
    /* En el extracto, «MT-000002» a secas no le dice nada al comprador y
       llama al banco a preguntar qué es — el primer paso de un contracargo. */
    expect(conceptoDelPago("MT-000002")).toBe("Mercatren MT-000002");
  });

  it("entra de sobra en la nota de cualquier banco", () => {
    /* Los bancos rondan los 140 caracteres y algunos se quedan mucho más
       abajo. Lo que se corta a la mitad no sirve para buscar nada. */
    expect(conceptoDelPago("MT-000002")!.length).toBeLessThanOrEqual(40);
  });

  it("no repite la marca si el número ya la trae", () => {
    expect(conceptoDelPago("Mercatren MT-000002")).toBe("Mercatren MT-000002");
    expect(conceptoDelPago("mercatren MT-7")).toBe("mercatren MT-7");
  });

  it("limpia los espacios de sobra", () => {
    /* Lo que se enseña es lo que la persona copia y pega en su banco. */
    expect(conceptoDelPago("  MT-000002  ")).toBe("Mercatren MT-000002");
    expect(conceptoDelPago("MT   000002")).toBe("Mercatren MT 000002");
  });

  it("SIN número no inventa un concepto", () => {
    /* Una pantalla con un concepto a medias es peor que una sin ninguno: el
       comprador lo copia igual y el pago queda sin identificar. */
    expect(conceptoDelPago("")).toBeNull();
    expect(conceptoDelPago("   ")).toBeNull();
    expect(conceptoDelPago(null)).toBeNull();
    expect(conceptoDelPago(undefined)).toBeNull();
  });

  it("la marca es la misma que ve en la tarjeta", () => {
    expect(MARCA_CONCEPTO).toBe("Mercatren");
  });
});
