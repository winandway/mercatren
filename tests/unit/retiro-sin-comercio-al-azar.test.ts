import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";

/**
 * EL EQUIPO NO REGISTRA UN RETIRO A NOMBRE DE UN COMERCIO AL AZAR (27 oct 2026).
 *
 * Sin `?comercio=`, la página de retiros pedía la posición de «nadie» y
 * `tiendaAConsultar` devolvía la primera billetera de la base. Arriba salía
 * «$327,535.61» de Ferremateriales Bley sin su nombre, y el botón «Registrar
 * un retiro del comercio» llevaba su id escondido. Un nombre mal escrito en la
 * dirección, o un id que no existe, caían en lo mismo.
 *
 * La billetera ya se había arreglado el día del «$0.00 · MEGAYES»; estas
 * pruebas cierran la raíz para todas las pantallas a la vez.
 */

const leer = (ruta: string) => readFileSync(ruta, "utf-8");

/** El cuerpo de `tiendaAConsultar`, y nada más del archivo. */
function cuerpoDeTiendaAConsultar(): string {
  const fuente = leer("src/lib/zelle/billetera.ts");
  const inicio = fuente.indexOf("async function tiendaAConsultar(");
  const fin = fuente.indexOf("export type PosicionBilletera");
  expect(inicio).toBeGreaterThan(-1);
  expect(fin).toBeGreaterThan(inicio);
  return fuente.slice(inicio, fin);
}

describe("quién elige el comercio", () => {
  it("el equipo sin comercio recibe null, no la primera billetera", () => {
    const cuerpo = cuerpoDeTiendaAConsultar();
    expect(cuerpo).toContain("if (!comercio) return null;");
    expect(cuerpo).not.toContain(".from(billeteras)");
  });

  it("un comercio que no existe tampoco cae en otro", () => {
    expect(cuerpoDeTiendaAConsultar()).toContain("return fila?.id ?? null;");
  });
});

describe("la página de retiros, vista por el equipo", () => {
  const pagina = leer("src/app/[locale]/panel/retiros/page.tsx");

  it("sin comercio elegido dice dónde elegirlo, en vez del botón", () => {
    expect(pagina).toContain(") : interno ? (");
    expect(pagina).toContain('t.rich("eligeElComercioPrimero"');
    expect(pagina).toContain('href="/panel/billetera"');
    expect(pagina).toContain('href="/panel/tiendas"');
  });

  it("con comercio elegido dice de quién es el dinero", () => {
    expect(pagina).toContain('t.rich("comercioElegido"');
    expect(pagina).toContain("nombre: posicion.nombreTienda");
  });

  it("el botón de registrar un retiro solo se dibuja con posición", () => {
    const desdePosicion = pagina.indexOf("{posicion ? (");
    const formulario = pagina.indexOf("<PedirRetiro");
    const sinComercio = pagina.indexOf(") : interno ? (");
    expect(desdePosicion).toBeGreaterThan(-1);
    expect(formulario).toBeGreaterThan(desdePosicion);
    expect(sinComercio).toBeGreaterThan(formulario);
  });
});

describe("de la billetera de un comercio a sus retiros", () => {
  const billetera = leer("src/app/[locale]/panel/billetera/page.tsx");

  it("el equipo llega con el comercio en la dirección", () => {
    expect(billetera).toContain(
      "`/panel/retiros?comercio=${posicion.tiendaId}`",
    );
    expect(billetera).toContain('tr(interno ? "pedirPorElComercio" : "pedir")');
  });

  it("la vista de todos no depende de la posición de nadie", () => {
    expect(billetera).toContain("if (!posicion && !vistaDeTodos)");
    expect(billetera).toContain("{vistaDeTodos || !posicion ? null : (");
  });
});

describe("los textos, en los dos idiomas", () => {
  it("retiros explica dónde elegir el comercio", () => {
    for (const idioma of [es, en]) {
      expect(idioma.panel.retiros.eligeElComercioPrimero).toMatch(
        /<billetera>.+<\/billetera>.*<comercios>.+<\/comercios>/,
      );
      expect(idioma.panel.retiros.comercioElegido).toContain("{nombre}");
    }
  });

  it("la billetera dice cuando el comercio no existe", () => {
    for (const idioma of [es, en]) {
      expect(idioma.panel.billetera.comercioNoEncontrado).toBeTruthy();
      expect(idioma.panel.billetera.verTodos).toBeTruthy();
    }
  });
});
