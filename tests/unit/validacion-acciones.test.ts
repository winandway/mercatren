import { describe, expect, it } from "vitest";

import {
  idDeRegistro,
  montoEnDolares,
  motivoEscrito,
  numeroDePedido,
  revisar,
} from "@/lib/validacion/acciones";

/**
 * LAS REGLAS CON LAS QUE SE VALIDA LO QUE ENTRA A UNA ACCIÓN DE SERVIDOR.
 *
 * Aquí lo importante es doble: que no pase lo que no debe, y —tanto o más—
 * **que sí pase lo que la gente escribe de verdad**. Rechazar un dato bueno es
 * el error más caro: el comercio ya vendió y no puede cobrar.
 */

describe("identificadores", () => {
  it("acepta los que genera el sistema y los del histórico", () => {
    for (const id of [
      "puGzb9BHie3VHux_rLFw6",
      "tienda-bley-ferreteria",
      "cierre-bley-2026-08-10",
      "dep-tienda-bley-ferreteria-el-vigia-deposito-centro",
    ]) {
      expect(revisar(idDeRegistro, id).ok).toBe(true);
    }
  });

  it("rechaza lo que no es un identificador", () => {
    /* Un identificador se compara, nunca se interpreta: aceptar comillas o
       barras es abrirle la puerta a quien las quiera meter en una consulta. */
    for (const malo of ["", "  ", "a b", "a'b", "a/b", "a;b", "<script>"]) {
      expect(revisar(idDeRegistro, malo).ok).toBe(false);
    }
  });

  it("rechaza uno absurdamente largo", () => {
    expect(revisar(idDeRegistro, "a".repeat(65)).ok).toBe(false);
  });

  it("rechaza lo que ni siquiera es texto", () => {
    for (const malo of [null, undefined, 42, {}, []]) {
      expect(revisar(idDeRegistro, malo).ok).toBe(false);
    }
  });
});

describe("número de pedido", () => {
  it("acepta el que se ve en pantalla", () => {
    expect(revisar(numeroDePedido, "MT-000002").ok).toBe(true);
    expect(revisar(numeroDePedido, "mt-7").ok).toBe(true);
    expect(revisar(numeroDePedido, "  MT-000002 ").ok).toBe(true);
  });

  it("rechaza cualquier otra cosa de la dirección del navegador", () => {
    for (const malo of ["000002", "MT-", "XX-000002", "MT-abc", "MT-1;drop"]) {
      expect(revisar(numeroDePedido, malo).ok).toBe(false);
    }
  });
});

describe("motivo de un rechazo", () => {
  it("exige una explicación de verdad", () => {
    /* Este texto se lo lleva el comprador en un correo: «no» no le explica
       nada ni le dice qué corregir. */
    expect(revisar(motivoEscrito, "no").ok).toBe(false);
    expect(revisar(motivoEscrito, "   ").ok).toBe(false);
    expect(
      revisar(motivoEscrito, "El monto no coincide con el del pedido.").ok,
    ).toBe(true);
  });

  it("no admite un libro", () => {
    expect(revisar(motivoEscrito, "x".repeat(501)).ok).toBe(false);
  });

  it("devuelve el motivo ya recortado", () => {
    const r = revisar(motivoEscrito, "  La referencia está repetida.  ");
    expect(r.ok && r.datos).toBe("La referencia está repetida.");
  });
});

describe("montos escritos por una persona", () => {
  it("acepta punto Y coma, que las dos se escriben de verdad", () => {
    /* Según el teclado y el país. Rechazar un monto bien escrito es de los
       errores más caros. */
    for (const bueno of ["100", "100.50", "100,50", "0.99", "1234567"]) {
      expect(revisar(montoEnDolares, bueno).ok).toBe(true);
    }
  });

  it("rechaza lo que no es un monto", () => {
    for (const malo of ["", "abc", "-10", "10.505", "1e5", "$100", "10.5.5"]) {
      expect(revisar(montoEnDolares, malo).ok).toBe(false);
    }
  });
});

describe("cómo se reporta", () => {
  it("devuelve UNA clave de aviso, no la lista entera", () => {
    /* Enseñar cinco errores a la vez hace que no se lea ninguno. */
    const r = revisar(idDeRegistro, "a b");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(typeof r.aviso).toBe("string");
  });

  it("el aviso es una clave de traducción, no una frase", () => {
    /* El panel se ve en dos idiomas y el esquema no sabe en cuál está
       mirando quien lo usa. */
    const r = revisar(idDeRegistro, "");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.aviso).not.toContain(" ");
  });
});
