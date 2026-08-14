import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CORREO_CONTACTO, CORREO_EQUIPO } from "@/lib/correo/direcciones";

/**
 * EL CORREO DE CONTACTO NO SE ESCRIBE A MANO.
 *
 * ══ POR QUÉ EXISTE ESTA PRUEBA (12 ago 2026) ══
 *
 * El contacto público era `mercatren@windoce.com`, de cuando la tienda la
 * operaba Windoce. Ya no la opera, y esa dirección estaba escrita a mano en
 * diez sitios: términos, privacidad, devoluciones, entrega, ayuda, vender,
 * nosotros y hasta en el `llms.txt` que leen las IA.
 *
 * El resultado: al preguntarle a Google con qué empresa funciona Mercatren,
 * contestaba «Windoce, LLC». No se lo inventaba — leía la página, y la
 * dirección de contacto le decía eso. Lo notó el dueño buscándose a sí mismo.
 *
 * Cambiarlo fue tocar diez archivos. Con esta prueba, la próxima vez es una
 * línea: si alguien vuelve a escribir una dirección a mano, se pone roja antes
 * de que llegue al sitio.
 */

const RAIZ = join(import.meta.dirname, "..", "..", "src");
const DONDE_SE_DECLARAN = join(RAIZ, "lib", "correo", "direcciones.ts");

function archivosDeCodigo(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivosDeCodigo(ruta);
    return /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

describe("las direcciones de correo", () => {
  it("el contacto público es de la marca, no del estudio que programa", () => {
    /* Windoce, LLC desarrolla el sitio y así consta en el pie. Pero quien
       opera la tienda —y a quien le escribe un cliente— es Mercatren. */
    expect(CORREO_CONTACTO.endsWith("@mercatren.com")).toBe(true);
  });

  it("nadie la escribe a mano fuera de donde se declara", () => {
    const aMano = archivosDeCodigo(RAIZ)
      .filter((ruta) => ruta !== DONDE_SE_DECLARAN)
      .filter((ruta) => {
        const texto = readFileSync(ruta, "utf8")
          /* Los comentarios no salen a pantalla: pueden nombrarla. */
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");
        return texto.includes(CORREO_CONTACTO) || texto.includes(CORREO_EQUIPO);
      })
      .map((ruta) => ruta.slice(RAIZ.length + 1));

    expect(
      aMano,
      "estos archivos escriben el correo a mano: importa CORREO_CONTACTO de @/lib/correo/direcciones",
    ).toEqual([]);
  });

  it("el buzón del equipo y el público son distintos", () => {
    /* De los avisos internos depende que alguien mire la cola de retiros y
       que a un comercio le llegue su dinero: no se mezclan con el correo que
       manda cualquiera desde la web. */
    expect(CORREO_EQUIPO).not.toBe(CORREO_CONTACTO);
  });

  it("ninguna de las dos es de la sociedad anterior", () => {
    /* El 14 ago 2026 se movió también el buzón del equipo, que era el último
       `@windoce.com` que quedaba operando el sistema. No era el que confundía
       a Google —ese no sale en ninguna página— pero no hay razón para que una
       dirección de la sociedad anterior siga recibiendo los avisos de dinero
       de la nueva. Esta prueba impide que vuelva por descuido. */
    for (const correo of [CORREO_CONTACTO, CORREO_EQUIPO]) {
      expect(correo.endsWith("@mercatren.com")).toBe(true);
    }
  });
});
