import { describe, expect, it } from "vitest";

import {
  CONCEPTOS,
  expandir,
  formasDeNumero,
  tieneSinonimos,
} from "@/lib/catalogo/sinonimos";

/**
 * Lo que protege esta prueba es el motivo por el que existe el diccionario:
 * que alguien escriba en español y encuentre un catálogo escrito en inglés.
 * Si se pone roja, el catálogo de Estados Unidos vuelve a ser invisible para
 * quien no busca en inglés — que es toda la clientela para la que se hizo.
 */

describe("español → inglés (lo que desbloquea el catálogo de EE. UU.)", () => {
  it("«bicicleta» encuentra «bike»", () => {
    expect(expandir("bicicleta")).toContain("bike");
    expect(expandir("bicicleta")).toContain("bicycle");
  });

  it("«repuestos» encuentra «auto parts»", () => {
    const formas = expandir("repuestos");
    expect(formas).toContain("auto parts");
    expect(formas).toContain("auto part");
  });

  it("«herramientas» encuentra «tools»", () => {
    expect(expandir("herramientas")).toContain("tools");
  });

  it("«zapatos» encuentra «shoes»", () => {
    expect(expandir("zapatos")).toContain("shoes");
  });

  it("«linterna» encuentra «flashlight»", () => {
    expect(expandir("linterna")).toContain("flashlight");
  });

  it("y funciona al revés: quien busca en inglés encuentra el español", () => {
    expect(expandir("bike")).toContain("bicicleta");
    expect(expandir("tools")).toContain("herramientas");
  });
});

describe("cada país llama a las cosas de otra manera", () => {
  it("«caucho» (Venezuela) encuentra «llanta» y «tire»", () => {
    const formas = expandir("caucho");
    expect(formas).toContain("llanta");
    expect(formas).toContain("tire");
  });

  it("«refacciones» (México) encuentra «repuestos»", () => {
    expect(expandir("refacciones")).toContain("repuesto");
  });

  it("«ordenador» (España) encuentra «computadora» y «laptop»", () => {
    const formas = expandir("ordenador");
    expect(formas).toContain("computadora");
    expect(formas).toContain("laptop");
  });

  it("«corneta» (Venezuela) encuentra «bocina» y «speaker»", () => {
    const formas = expandir("corneta");
    expect(formas).toContain("bocina");
    expect(formas).toContain("speaker");
  });

  it("«franela» (Venezuela) encuentra «playera» y «t-shirt»", () => {
    const formas = expandir("franela");
    expect(formas).toContain("playera");
    expect(formas).toContain("t-shirt");
  });
});

describe("singular y plural", () => {
  it("del singular sale el plural", () => {
    expect(formasDeNumero("repuesto")).toContain("repuestos");
    expect(formasDeNumero("motor")).toContain("motores");
  });

  it("del plural sale el singular", () => {
    expect(formasDeNumero("repuestos")).toContain("repuesto");
    expect(formasDeNumero("motores")).toContain("motor");
  });

  it("los plurales que cambian la raíz también", () => {
    expect(formasDeNumero("lapices")).toContain("lapiz");
    expect(formasDeNumero("luz")).toContain("luces");
  });

  it("las palabras muy cortas se dejan quietas", () => {
    /* «pie» no es el singular de nada y «kit» tampoco necesita ayuda.
       Inventarles formas solo ensucia la consulta. */
    expect(formasDeNumero("pie")).toEqual(["pie"]);
    expect(formasDeNumero("kit")).toEqual(["kit"]);
  });
});

describe("los acentos no importan", () => {
  it("«batería» con acento encuentra lo mismo que sin acento", () => {
    expect(expandir("batería")).toContain("battery");
    expect(expandir("bateria")).toContain("battery");
  });

  it("«teléfono» encuentra «phone»", () => {
    expect(expandir("teléfono")).toContain("phone");
  });

  it("y las mayúsculas tampoco", () => {
    expect(expandir("BICICLETA")).toContain("bike");
  });
});

describe("los candados de la consulta", () => {
  it("lo que escribió la persona va siempre primero y nunca se pierde", () => {
    /* El tope de formas corta por el final. Si lo tecleado no fuera lo
       primero, una palabra de un grupo grande podría quedar fuera de su
       propia búsqueda. */
    for (const palabra of ["bicicleta", "repuestos", "carro", "celular"]) {
      expect(expandir(palabra)[0]).toBe(palabra);
    }
  });

  it("nunca devuelve más de 12 formas", () => {
    /* Ocho palabras por doce formas son 96 condiciones. Sin tope, este
       proyecto ya se topó una vez con «too many SQL variables». */
    for (const grupo of CONCEPTOS) {
      for (const palabra of grupo) {
        expect(expandir(palabra).length).toBeLessThanOrEqual(12);
      }
    }
  });

  it("nunca devuelve vacío, ni con basura", () => {
    /* Un vacío haría que `or()` diera `undefined` y que esa palabra dejara de
       filtrar: la búsqueda traería el catálogo entero. */
    expect(expandir("xyzqw")).not.toHaveLength(0);
    expect(expandir("   ")).toEqual([]);
  });

  it("una palabra desconocida se busca tal cual", () => {
    expect(expandir("shimano")).toContain("shimano");
    expect(tieneSinonimos("shimano")).toBe(false);
  });
});

describe("el diccionario está bien escrito", () => {
  it("ni una entrada lleva acentos ni mayúsculas", () => {
    /* El buscador normaliza antes de comparar: una entrada con acento no
       coincidiría nunca y el grupo entero quedaría muerto sin avisar. */
    for (const grupo of CONCEPTOS) {
      for (const palabra of grupo) {
        expect(palabra).toBe(palabra.toLowerCase());
        expect(palabra.normalize("NFD")).toBe(palabra);
      }
    }
  });

  it("ni una entrada está vacía", () => {
    for (const grupo of CONCEPTOS) {
      expect(grupo.length).toBeGreaterThan(1);
      for (const palabra of grupo) {
        expect(palabra.trim()).not.toBe("");
      }
    }
  });

  it("los grupos son equivalencias en las dos direcciones", () => {
    for (const grupo of CONCEPTOS) {
      const primera = grupo[0]!;
      for (const otra of grupo) {
        expect(expandir(otra)).toContain(primera.toLowerCase());
      }
    }
  });
});
