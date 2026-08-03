import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";

/**
 * El sitio es bilingue de nacimiento. Si alguien agrega un texto en espanol y
 * se le olvida el ingles, el publico de Estados Unidos ve la clave cruda en
 * pantalla. Esta prueba lo caza antes de publicar.
 */

type Objeto = Record<string, unknown>;

function aplanar(objeto: Objeto, prefijo = ""): string[] {
  return Object.entries(objeto).flatMap(([clave, valor]) => {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave;
    return valor !== null && typeof valor === "object"
      ? aplanar(valor as Objeto, ruta)
      : [ruta];
  });
}

describe("textos del sitio", () => {
  const clavesEs = aplanar(es as Objeto).sort();
  const clavesEn = aplanar(en as Objeto).sort();

  it("el espanol y el ingles tienen exactamente las mismas claves", () => {
    const faltanEnIngles = clavesEs.filter((c) => !clavesEn.includes(c));
    const faltanEnEspanol = clavesEn.filter((c) => !clavesEs.includes(c));

    expect(faltanEnIngles, "faltan traducciones al ingles").toEqual([]);
    expect(faltanEnEspanol, "faltan traducciones al espanol").toEqual([]);
  });

  it("ningun texto quedo vacio", () => {
    const vacios = [
      ...aplanarValores(es as Objeto),
      ...aplanarValores(en as Objeto),
    ].filter(([, valor]) => valor.trim() === "");

    expect(vacios.map(([clave]) => clave)).toEqual([]);
  });
});

function aplanarValores(objeto: Objeto, prefijo = ""): [string, string][] {
  return Object.entries(objeto).flatMap(
    ([clave, valor]): [string, string][] => {
      const ruta = prefijo ? `${prefijo}.${clave}` : clave;
      return valor !== null && typeof valor === "object"
        ? aplanarValores(valor as Objeto, ruta)
        : [[ruta, String(valor)]];
    },
  );
}
