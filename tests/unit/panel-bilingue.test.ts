import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REGLA DEL PROYECTO: el panel se ve en los dos idiomas, sin excepción.
 *
 * No es una cuestión de gusto. El panel lo abren bancos, aceleradoras e
 * inversionistas, y la mayoría solo lee inglés. Media pantalla en español
 * —sobre todo en los avisos, que salen justo cuando algo pasa— resta
 * credibilidad en el peor momento.
 *
 * Esta prueba caza el texto en español escrito a fuego dentro del código del
 * panel y de las acciones que le responden. Todo eso tiene que salir de
 * `messages/es.json` y `messages/en.json`.
 *
 * Los comentarios del código SÍ van en español: son para quien programa, no
 * se ven en pantalla.
 */

const RAIZ = join(import.meta.dirname, "..", "..", "src");

/** Dónde miramos: lo que se ve en el panel y lo que le responde. */
const CARPETAS = [
  join(RAIZ, "components", "panel"),
  join(RAIZ, "app", "[locale]", "panel"),
];

const ACCIONES = [
  join(RAIZ, "lib", "zelle", "acciones.ts"),
  join(RAIZ, "lib", "tiendas", "acciones.ts"),
  join(RAIZ, "lib", "productos", "acciones.ts"),
  join(RAIZ, "lib", "correo", "acciones.ts"),
  join(RAIZ, "lib", "pedidos", "acciones.ts"),
  join(RAIZ, "lib", "catalogo", "sincronizar.ts"),
  join(RAIZ, "lib", "catalogo", "traer-fotos.ts"),
];

function archivos(carpeta: string): string[] {
  try {
    return readdirSync(carpeta).flatMap((nombre) => {
      const ruta = join(carpeta, nombre);
      if (statSync(ruta).isDirectory()) return archivos(ruta);
      return /\.tsx?$/.test(nombre) ? [ruta] : [];
    });
  } catch {
    return [];
  }
}

/** Quita comentarios: ahí el español es correcto y esperado. */
function sinComentarios(codigo: string): string {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * Un texto se considera "de pantalla" si es una FRASE: varias palabras y, o
 * bien un acento del español, o bien un conector que solo aparece hablando.
 *
 * Se pide más de una palabra a propósito. Sin eso saltaba con nombres de
 * campo como `que:` —una palabra suelta del código, no algo que nadie lea— y
 * una prueba que grita por cosas que están bien se acaba ignorando.
 */
const SOSPECHOSO =
  /["'`][^"'`\n]*\s[^"'`\n]*(?:[áéíóúñÁÉÍÓÚÑ¿¡]|\s(?:el|la|los|las|para|con|una|todavía|tienes|sabe|encontramos)\s)[^"'`\n]*["'`]/g;

const PERMITIDO = [
  /import\s/,
  /from\s+["']/,
  /"use (client|server)"/,
  /require\(/,
  /className/,
  /@\/lib|@\/components|@\/i18n/,
];

describe("el panel habla los dos idiomas", () => {
  const rutas = [...CARPETAS.flatMap(archivos), ...ACCIONES];

  it("no queda texto en español escrito a fuego", () => {
    const sueltos: string[] = [];

    for (const ruta of rutas) {
      let codigo: string;
      try {
        codigo = sinComentarios(readFileSync(ruta, "utf8"));
      } catch {
        continue;
      }

      for (const linea of codigo.split("\n")) {
        if (PERMITIDO.some((p) => p.test(linea))) continue;
        const encontrados = linea.match(SOSPECHOSO);
        if (encontrados) {
          sueltos.push(`${ruta.slice(RAIZ.length + 1)} → ${encontrados[0]}`);
        }
      }
    }

    expect(
      sueltos,
      "esto se ve en pantalla y solo está en español: pásalo a messages/*.json",
    ).toEqual([]);
  });
});
