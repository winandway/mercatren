import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  esDeEstadosUnidos,
  nombreDePais,
  PAISES,
  puedeFirmarW8,
} from "@/lib/fiscal/paises";

/**
 * EL W-8BEN-E ES EL PAPEL QUE DECLARA **NO** SER ESTADOUNIDENSE.
 *
 * El campo del país era texto libre y el servidor solo comprobaba que no
 * estuviera vacío, así que se guardó uno que decía «COUNTRY OF INCORPORATION:
 * ESTADOS UNIDOS» — un documento que se contradice en su segunda línea.
 *
 * Y no fue por escribirlo a mano: el `maxLength` de dos letras lo saltó el
 * autocompletado del navegador, que además metió «ESTADOSUNIDOS» en el campo
 * del número fiscal.
 */
describe("Estados Unidos no puede firmar este formulario", () => {
  it("ni Estados Unidos ni el texto suelto", () => {
    expect(puedeFirmarW8("US")).toBe(false);
    expect(puedeFirmarW8("ESTADOS UNIDOS")).toBe(false);
    expect(puedeFirmarW8("ESTADOSUNIDOS")).toBe(false);
    expect(puedeFirmarW8("")).toBe(false);
    expect(puedeFirmarW8(null)).toBe(false);
  });

  it("NI SUS TERRITORIOS, que es lo que se escapa", () => {
    /* Quitar solo «Estados Unidos» deja pasar Puerto Rico — y una entidad de
       Puerto Rico es «U.S. person» para el IRS: le toca el W-9. Es el mismo
       error con otro nombre, y es el que nadie ve. */
    expect(puedeFirmarW8("PR")).toBe(false);
    expect(puedeFirmarW8("GU")).toBe(false);
    expect(puedeFirmarW8("VI")).toBe(false);
    expect(puedeFirmarW8("AS")).toBe(false);
    expect(puedeFirmarW8("MP")).toBe(false);
    expect(esDeEstadosUnidos("pr")).toBe(true);
  });

  it("y NINGUNO de ellos está en la lista que se dibuja", () => {
    /* Si estuvieran, el desplegable los ofrecería y el servidor los
       rechazaría: el comercio elegiría su país de una lista y no entendería
       por qué no le deja guardar. */
    const codigos = PAISES.map((p) => p.codigo);
    for (const c of ["US", "PR", "VI", "GU", "AS", "MP", "UM"]) {
      expect(codigos, `${c} no debería estar en la lista`).not.toContain(c);
    }
  });
});

describe("el resto del mundo sí firma", () => {
  it("los países donde de verdad hay comercios", () => {
    expect(puedeFirmarW8("VE")).toBe(true);
    expect(puedeFirmarW8("CO")).toBe(true);
    expect(puedeFirmarW8("CL")).toBe(true);
    expect(puedeFirmarW8("MX")).toBe(true);
    expect(puedeFirmarW8("ES")).toBe(true);
  });

  it("en minúsculas y con espacios, también", () => {
    /* Rechazar un dato bueno es el error más caro: el comercio ya vendió y no
       puede cobrar. */
    expect(puedeFirmarW8(" ve ")).toBe(true);
    expect(puedeFirmarW8("co")).toBe(true);
  });

  it("un código que no existe, no", () => {
    expect(puedeFirmarW8("XX")).toBe(false);
    expect(puedeFirmarW8("ZZ")).toBe(false);
  });

  it("la lista es grande de verdad y no tiene repetidos", () => {
    expect(PAISES.length).toBeGreaterThan(190);
    const codigos = PAISES.map((p) => p.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("el nombre sale para el documento", () => {
    expect(nombreDePais("VE")).toBe("Venezuela");
    expect(nombreDePais("US")).toBeNull();
  });
});

describe("EL CANDADO ESTÁ EN EL SERVIDOR, no solo en el desplegable", () => {
  const acciones = readFileSync("src/lib/fiscal/acciones.ts", "utf8");

  it("guardar comprueba el país", () => {
    /* Una lista en pantalla se salta abriendo la consola, y el navegador la
       rellena solo con lo que tenga guardado. */
    expect(
      acciones,
      "el formulario volvió a aceptar cualquier país: se puede guardar uno que diga Estados Unidos",
    ).toContain("puedeFirmarW8(valores.paisConstitucion)");
    expect(acciones).toContain("esDeEstadosUnidos(valores.paisConstitucion)");
  });

  it("y distingue los dos errores", () => {
    /* A una empresa de Estados Unidos no se le dice «país inválido»: se le
       dice que le toca el W-9. Rechazar sin explicar deja a alguien sin poder
       cobrar y sin saber qué hacer. */
    expect(acciones).toContain('"es-de-estados-unidos"');
    expect(acciones).toContain('"pais-invalido"');
  });

  it("el formulario dibuja una LISTA, no una casilla libre", () => {
    const ui = readFileSync(
      "src/components/panel/formulario-fiscal.tsx",
      "utf8",
    );
    expect(ui).toContain("PAISES.map");

    /* Que el país salga de un `<select>` y no de un `<input>`: con la casilla
       libre, el autocompletado del navegador metió «ESTADOS UNIDOS» donde
       cabían dos letras. Se mira el trozo alrededor del campo, no el archivo
       entero — hay otros `<input>` legítimos en el formulario. */
    const i = ui.indexOf('name="paisConstitucion"');
    expect(i, "desapareció el campo del país").toBeGreaterThan(0);
    const trozo = ui.slice(i - 200, i + 200);
    expect(trozo, "el país volvió a ser una casilla de texto libre").toContain(
      "<select",
    );
    expect(trozo).not.toContain("<input");
  });

  it("el número fiscal no lo rellena el navegador", () => {
    /* Metió «ESTADOSUNIDOS» ahí. En un formulario que se firma bajo pena de
       perjurio, un dato que puso el navegador y nadie miró es justo lo que no
       puede pasar. */
    const ui = readFileSync(
      "src/components/panel/formulario-fiscal.tsx",
      "utf8",
    );
    const trozo = ui.slice(
      ui.indexOf('nombre="identificacionFiscal"') - 400,
      ui.indexOf('nombre="identificacionFiscal"') + 400,
    );
    expect(trozo).toContain('autoComplete="off"');
  });
});
