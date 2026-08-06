import { describe, expect, it } from "vitest";

import { esquemaEntrega } from "@/lib/pedidos/esquemas";

/**
 * LOS DATOS DE QUIEN RETIRA, COMPROBADOS EN EL SERVIDOR.
 *
 * Este esquema es la barrera de verdad. El formulario ya filtra mientras se
 * escribe, pero eso es comodidad: cualquiera puede mandar la petición a mano
 * sin pasar por la pantalla.
 *
 * Lo que se protege es concreto: cuando llega la mercancía al depósito, alguien
 * tiene que llamar a quien la va a retirar. Si el teléfono guardado dice
 * "llámame por WhatsApp", no hay a quién llamar y el pedido se queda ahí.
 */

const BUENO = {
  nombre: "José Pérez",
  telefono: "+58 412-1234567",
  ciudad: "Valencia",
  pais: "",
  direccion: "",
  referencia: "",
  notas: "",
};

describe("los datos de quien retira el pedido", () => {
  it("acepta unos datos normales", () => {
    expect(esquemaEntrega.safeParse(BUENO).success).toBe(true);
  });

  it("RECHAZA un teléfono que no es un teléfono", () => {
    /* Antes esto pasaba: el esquema solo miraba que tuviera entre 7 y 30
       caracteres, y "llámame por WhatsApp" tiene 20. */
    const r = esquemaEntrega.safeParse({
      ...BUENO,
      telefono: "llámame por WhatsApp",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza un nombre con números", () => {
    expect(
      esquemaEntrega.safeParse({ ...BUENO, nombre: "Jose 123" }).success,
    ).toBe(false);
  });

  it("deja vacíos los campos que son opcionales", () => {
    /* `pais`, `direccion` y `referencia` son de cuando el sitio pedía dirección
       de entrega. Siguen opcionales para no romper los pedidos ya guardados. */
    const r = esquemaEntrega.safeParse({
      nombre: "Ana Ruiz",
      telefono: "3055550142",
      ciudad: "Caracas",
    });
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });

  it("acepta un teléfono de Estados Unidos y uno de Venezuela", () => {
    /* Los dos países de la operación. Una regla de un solo formato dejaría
       fuera a media clientela. */
    for (const telefono of ["+1 (305) 555-0142", "04121234567"]) {
      expect(
        esquemaEntrega.safeParse({ ...BUENO, telefono }).success,
        `rechazó ${telefono}`,
      ).toBe(true);
    }
  });

  it("limpia el dato antes de guardarlo", () => {
    const r = esquemaEntrega.safeParse({
      ...BUENO,
      nombre: "  José    Pérez  ",
    });
    expect(r.success && r.data.nombre).toBe("José Pérez");
  });

  it("no deja mandar un libro en las notas", () => {
    const r = esquemaEntrega.safeParse({ ...BUENO, notas: "x".repeat(5000) });
    expect(r.success).toBe(false);
  });
});
