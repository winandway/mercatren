import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * NINGÚN FALLO PUEDE BORRARLE EL TRABAJO A UN COMERCIO.
 *
 * EL DÍA QUE ESTO SE ESCRIBIÓ (6 ago 2026)
 *
 * MEGAYES —un distribuidor de repuestos de moto en Venezuela— pasó una tarde
 * entera intentando cargar sus productos. Escribía el nombre, la descripción,
 * el precio, elegía las fotos, le daba a guardar… y la pantalla se caía con el
 * error en blanco de Next: "This page couldn't load". **Y todo lo que llevaba
 * escrito desaparecía.** Lo intentó varias veces. Nos enteramos por WhatsApp.
 *
 * La causa: `obtenerAlcance()` corta con una excepción cuando la cuenta no
 * tiene comercio asignado. Esa excepción subía hasta React, React desmontaba el
 * formulario para pintar la pantalla de error, y con el formulario se iba el
 * trabajo.
 *
 * Aquí se vigilan las dos reglas que lo impiden. Son estructurales a propósito:
 * valen para el código que se escriba mañana, no solo para el de hoy.
 */

const RAIZ = join(import.meta.dirname, "..", "..");

function archivos(carpeta: string, acumulado: string[] = []): string[] {
  for (const entrada of readdirSync(carpeta)) {
    const ruta = join(carpeta, entrada);
    if (statSync(ruta).isDirectory()) archivos(ruta, acumulado);
    else if (/\.(ts|tsx)$/.test(entrada)) acumulado.push(ruta);
  }
  return acumulado;
}

describe("nada le revienta la pantalla a un comercio", () => {
  it("el sitio y el panel tienen su pantalla de error", () => {
    /* Sin un `error.tsx`, CUALQUIER fallo del servidor le llega al cliente
       como la pantalla en blanco de Next: en inglés, sin explicar nada y sin
       decirle qué hacer. Eso es lo que vio MEGAYES toda una tarde. */
    for (const ruta of [
      join(RAIZ, "src/app/[locale]/error.tsx"),
      join(RAIZ, "src/app/[locale]/panel/error.tsx"),
    ]) {
      expect(() => readFileSync(ruta, "utf8"), `falta ${ruta}`).not.toThrow();
    }
  });

  it("ninguna acción de servidor llama a obtenerAlcance() a pelo", () => {
    /**
     * En una acción (`"use server"`), una excepción no es un error controlado:
     * se lleva por delante el formulario del que salió, con todo lo que la
     * persona llevara escrito.
     *
     * Por eso `obtenerAlcance()` va SIEMPRE dentro de un `try`, devolviendo un
     * mensaje que se pueda enseñar. En las consultas de página no hace falta:
     * ahí el `error.tsx` ya recoge el golpe.
     */
    const sueltas: string[] = [];

    for (const ruta of archivos(join(RAIZ, "src/lib"))) {
      const codigo = readFileSync(ruta, "utf8");
      if (!codigo.includes('"use server"')) continue;
      if (!codigo.includes("obtenerAlcance()")) continue;

      /* Se acepta cualquiera de las dos formas de recogerlo: el `try` de
         siempre, o `.catch(() => null)` en la misma línea, que es más corto
         cuando lo único que hace falta es devolver un mensaje. */
      const lineas = codigo.split("\n");
      lineas.forEach((linea, i) => {
        if (!linea.includes("await obtenerAlcance()")) return;
        if (linea.includes(".catch(")) return;

        const antes = lineas.slice(Math.max(0, i - 4), i).join("\n");
        if (!antes.includes("try {")) {
          sueltas.push(`${ruta.slice(RAIZ.length + 1)}:${i + 1}`);
        }
      });
    }

    expect(
      sueltas,
      "Estas llamadas revientan el formulario del cliente si la cuenta no\n" +
        "tiene comercio asignado. Envuélvelas en try y devuelve un mensaje.",
    ).toEqual([]);
  });

  it("el formulario de producto no deja escapar una excepción", () => {
    /* Es el formulario donde más trabajo se pierde: nombre, descripción en dos
       idiomas, precio, existencias y las fotos elegidas. */
    const codigo = readFileSync(
      join(RAIZ, "src/components/panel/formulario-producto.tsx"),
      "utf8",
    );

    expect(
      codigo.includes("try {"),
      "guardarProducto se llama sin try: una excepción borraría el formulario",
    ).toBe(true);
  });
});
