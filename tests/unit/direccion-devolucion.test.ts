import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * LA DIRECCIÓN DE DEVOLUCIÓN NO SE ESCRIBE EN EL CÓDIGO. NUNCA.
 *
 * ══ POR QUÉ ESTE CANDADO (18 ago 2026) ══
 *
 * La dirección **va a cambiar** —lo dijo el dueño: dentro de un año o antes— y
 * por eso vive en una variable de entorno y solo se le enseña a quien ya abrió
 * su trámite de devolución. Publicada, se copia, se reenvía y se queda
 * circulando; el día que cambie seguirán llegando cajas a un sitio donde ya no
 * hay nadie que las reciba.
 *
 * Nada de eso sirve si mañana alguien la escribe a mano en un componente «para
 * tenerla a mano», o lee la variable desde una página pública. Desde fuera se
 * ve igual y el fallo no hace ruido.
 *
 * Es el mismo candado que ya protege el nombre de la sociedad
 * (`sociedad.test.ts`), las casillas de contraseña (`campo-clave.test.ts`) y el
 * correo de contacto (`correo-contacto.test.ts`): lo que tiene que salir de un
 * solo sitio, se comprueba leyendo el código.
 */

const RAIZ = join(process.cwd(), "src");

/**
 * Los ÚNICOS archivos que pueden tocar la variable.
 *
 * `acciones.ts` la lee para entregársela a quien abrió su trámite, `env.ts` y
 * `types/env.d.ts` la declaran. Cualquier otro archivo que la nombre está
 * sacándola de su único camino controlado.
 */
const PERMITIDOS = ["lib/devoluciones/acciones.ts", "env.ts", "types/env.d.ts"];

function archivosDeCodigo(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivosDeCodigo(ruta);
    return /\.(ts|tsx)$/.test(nombre) ? [ruta] : [];
  });
}

const ARCHIVOS = archivosDeCodigo(RAIZ);

describe("la dirección de devolución sale de UN solo sitio", () => {
  it("nadie más lee `DEVOLUCION_DIRECCION`", () => {
    const intrusos = ARCHIVOS.filter((ruta) => {
      const relativa = ruta.slice(RAIZ.length + 1);
      if (PERMITIDOS.includes(relativa)) return false;
      return readFileSync(ruta, "utf8").includes("DEVOLUCION_DIRECCION");
    }).map((r) => r.slice(RAIZ.length + 1));

    expect(
      intrusos,
      `Estos archivos leen la dirección de devolución por su cuenta: ${intrusos.join(", ")}. ` +
        "Solo puede leerla `lib/devoluciones/acciones.ts`, que la entrega a quien ya abrió su trámite.",
    ).toEqual([]);
  });

  it("no hay ninguna dirección postal de EE. UU. escrita a mano", () => {
    /**
     * Busca el patrón de una dirección estadounidense — número, calle, estado
     * de dos letras y código postal — en cualquier archivo del producto.
     *
     * No es una comprobación perfecta y no pretende serlo: atrapa el caso real,
     * que es alguien pegando la dirección tal cual la recibió por chat.
     */
    const PATRON =
      /\b\d{3,6}\s+[A-Z][a-zA-Z]+(\s+[A-Z][a-zA-Z]+)*\s*,?\s*(Dr|Drive|St|Street|Ave|Avenue|Rd|Road|Blvd|Ln|Lane|Way|Ct|Court)\b/;

    const conDireccion = ARCHIVOS.filter((ruta) =>
      PATRON.test(readFileSync(ruta, "utf8")),
    ).map((r) => r.slice(RAIZ.length + 1));

    expect(
      conDireccion,
      `Estos archivos parecen tener una dirección postal escrita a mano: ${conDireccion.join(", ")}. ` +
        "La de devolución va en `DEVOLUCION_DIRECCION`, porque va a cambiar.",
    ).toEqual([]);
  });
});
