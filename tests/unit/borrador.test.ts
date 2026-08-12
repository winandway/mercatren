import { describe, expect, it } from "vitest";

import {
  borradorUtil,
  campoGuardable,
  escribirBorrador,
  leerBorrador,
  llaveDeBorrador,
  VIDA_BORRADOR_MS,
} from "@/lib/formularios/borrador";

/**
 * EL BORRADOR DE LOS FORMULARIOS.
 *
 * Lo que se prueba aquí no es un detalle de comodidad: un comercio pasó días
 * volviendo a escribir lo mismo porque cada fallo le vaciaba el formulario.
 *
 * Y hay una prueba que vale por todas las demás: **una contraseña nunca puede
 * acabar guardada en el disco**. Si esa se pone roja, no se ajusta la prueba —
 * se arregla el código.
 */

const AHORA = 1_760_000_000_000;

describe("qué se puede guardar y qué no", () => {
  it("guarda un campo de texto normal", () => {
    expect(campoGuardable({ nombre: "tituloEs", tipo: "text" })).toBe(true);
    expect(campoGuardable({ nombre: "descripcionEs", tipo: "textarea" })).toBe(
      true,
    );
  });

  it("NUNCA guarda una contraseña", () => {
    expect(campoGuardable({ nombre: "password", tipo: "password" })).toBe(
      false,
    );
    /* Aunque la casilla sea de texto: es lo que hace el ojito para verla. */
    expect(
      campoGuardable({
        nombre: "clave",
        tipo: "text",
        autoCompletado: "new-password",
      }),
    ).toBe(false);
    expect(
      campoGuardable({
        nombre: "clave",
        tipo: "text",
        autoCompletado: "current-password",
      }),
    ).toBe(false);
  });

  it("NUNCA guarda los datos de una tarjeta", () => {
    for (const auto of ["cc-number", "cc-exp", "cc-csc", "cc-name"]) {
      expect(
        campoGuardable({
          nombre: "tarjeta",
          tipo: "text",
          autoCompletado: auto,
        }),
      ).toBe(false);
    }
  });

  it("no guarda archivos: una foto llenaría el cupo del navegador", () => {
    expect(campoGuardable({ nombre: "fotos", tipo: "file" })).toBe(false);
  });

  it("no guarda los identificadores que pone el servidor", () => {
    /* Restituir uno viejo mandaría a guardar contra OTRO producto o la tienda
       de otro comercio. */
    expect(campoGuardable({ nombre: "id", tipo: "text" })).toBe(false);
    expect(campoGuardable({ nombre: "tiendaId", tipo: "text" })).toBe(false);
    expect(campoGuardable({ nombre: "productoId", tipo: "text" })).toBe(false);
    expect(campoGuardable({ nombre: "loQueSea", tipo: "hidden" })).toBe(false);
  });

  it("no guarda botones ni casillas sin nombre", () => {
    expect(campoGuardable({ nombre: "enviar", tipo: "submit" })).toBe(false);
    expect(campoGuardable({ nombre: "", tipo: "text" })).toBe(false);
  });
});

describe("cada formulario tiene su llave", () => {
  it("dos formularios distintos no comparten borrador", () => {
    expect(llaveDeBorrador("producto:abc")).not.toBe(
      llaveDeBorrador("producto:xyz"),
    );
  });

  it("el mismo formulario siempre da la misma llave", () => {
    expect(llaveDeBorrador("mi-tienda")).toBe(llaveDeBorrador("mi-tienda"));
  });
});

describe("cuándo se ofrece un borrador", () => {
  it("uno recién guardado con algo escrito, sí", () => {
    const b = { campos: { tituloEs: "Moto Bera" }, guardadoEn: AHORA };
    expect(borradorUtil(b, AHORA + 1000)).toBe(true);
  });

  it("uno vacío, no: es el formulario recién abierto", () => {
    expect(borradorUtil({ campos: {}, guardadoEn: AHORA }, AHORA)).toBe(false);
    expect(
      borradorUtil({ campos: { tituloEs: "   " }, guardadoEn: AHORA }, AHORA),
    ).toBe(false);
  });

  it("uno de hace más de un día, no", () => {
    const b = { campos: { tituloEs: "Moto" }, guardadoEn: AHORA };
    expect(borradorUtil(b, AHORA + VIDA_BORRADOR_MS - 1)).toBe(true);
    expect(borradorUtil(b, AHORA + VIDA_BORRADOR_MS + 1)).toBe(false);
  });

  it("no hay borrador, no", () => {
    expect(borradorUtil(null, AHORA)).toBe(false);
  });
});

describe("leer lo guardado", () => {
  it("va y vuelve igual", () => {
    const campos = { tituloEs: "Moto Bera BR200", precio: "1850.00" };
    const leido = leerBorrador(escribirBorrador(campos, AHORA));
    expect(leido).toEqual({ campos, guardadoEn: AHORA });
  });

  it("guarda el texto vacío tal cual", () => {
    /* Importa: quien BORRÓ un campo a propósito no puede encontrárselo lleno
       otra vez al volver. */
    const leido = leerBorrador(escribirBorrador({ sku: "" }, AHORA));
    expect(leido?.campos.sku).toBe("");
  });

  it("un borrador ilegible se trata como que no hay", () => {
    /* Jamás puede tumbar el formulario: la persona escribe como si nada. */
    expect(leerBorrador("{ esto no es json")).toBeNull();
    expect(leerBorrador("null")).toBeNull();
    expect(leerBorrador("[1,2,3]")).toBeNull();
    expect(leerBorrador(JSON.stringify({ campos: { a: "b" } }))).toBeNull();
    expect(leerBorrador(JSON.stringify({ guardadoEn: AHORA }))).toBeNull();
    expect(leerBorrador(null)).toBeNull();
  });

  it("descarta lo que no es texto y los identificadores", () => {
    const crudo = JSON.stringify({
      campos: { tituloEs: "Moto", precio: 1850, id: "prod-123" },
      guardadoEn: AHORA,
    });
    expect(leerBorrador(crudo)?.campos).toEqual({ tituloEs: "Moto" });
  });
});
