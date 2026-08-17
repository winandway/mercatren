import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EL MURO DE LA CACHÉ (fase 3 del plan multi-país).
 *
 * ══ POR QUÉ ES UN MURO APARTE DEL DE LOS DATOS ══
 *
 * Porque protege de otra cosa, y esta es la parte que casi todo el mundo se
 * salta: **la caché responde ANTES de llegar a la base**. Se puede tener el
 * filtro de país perfecto en cada consulta y aun así servirle a un visitante
 * del .com una página chilena guardada, sin tocar la base ni una vez.
 *
 * ══ Y NO SE VE EN DESARROLLO ══
 *
 * Ahí solo hay una persona pidiendo una ruta a la vez. El fallo aparece con
 * tráfico real: dos visitantes de países distintos piden la misma dirección y
 * el segundo recibe lo que se guardó para el primero.
 *
 * ══ LAS DOS CACHÉS DE ESTE PROYECTO ══
 *
 * 1. `recordado()` — la memoria del worker, por llave. La llave TIENE que
 *    llevar el mercado.
 * 2. El prerenderizado de Next — una ruta estática se hornea UNA vez y se
 *    sirve igual en los dos dominios. Lo encontró esta auditoría: de 80
 *    rutas solo 5 se hornean, y `manifest.webmanifest` era la única de las
 *    cinco cuyo contenido cambia con el país. No se veía en ninguna pantalla:
 *    se veía en el celular de quien instalara la aplicación desde Chile.
 */

const RAIZ = process.cwd();

function fuente(relativo: string): string {
  return readFileSync(join(RAIZ, relativo), "utf8");
}

/** Los archivos que guardan algo en la memoria del worker. */
const CON_CACHE = [
  "src/components/layout/encabezado.tsx",
  "src/lib/catalogo/consultas.ts",
] as const;

describe("toda llave de caché lleva el país dentro", () => {
  for (const archivo of CON_CACHE) {
    it(`${archivo}`, () => {
      const codigo = fuente(archivo);

      /* Cada `recordado(` con su primer argumento, sea comilla o plantilla. */
      const llaves = [...codigo.matchAll(/recordado\(\s*([`"'][^`"']*[`"'])/g)]
        .map((m) => m[1])
        .filter((llave): llave is string => llave !== undefined);

      expect(
        llaves.length,
        `${archivo} no tiene ninguna llave de caché: ¿se movió el código?`,
      ).toBeGreaterThan(0);

      const sinPais = llaves.filter((l) => !l.includes("mercado.codigo"));

      expect(
        sinPais,
        `Estas llaves de caché de ${archivo} no llevan el país. Los dos ` +
          `dominios comparten worker: lo que guarde el primer visitante se le ` +
          `sirve al siguiente, aunque sea de otro país. Agrégale ` +
          "`${mercado.codigo}` a la llave.",
      ).toEqual([]);
    });
  }
});

describe("ninguna ruta que dependa del país se hornea", () => {
  it("el manifest de la aplicación se arma por petición", () => {
    /**
     * Es la que destapó la auditoría. Llevaba el nombre de la marca dentro y
     * se horneaba una sola vez: quien instalara la aplicación desde
     * mercatren.cl se encontraba el nombre del otro país en su pantalla de
     * inicio.
     */
    const codigo = fuente("src/app/manifest.ts");
    expect(codigo).toContain('export const dynamic = "force-dynamic"');
    expect(codigo).toContain("mercadoActual");
  });

  it("el mapa del sitio también", () => {
    /* Un sitemap horneado serviría las direcciones de un dominio desde el
       otro, y Google descarta entero un mapa de dominio cruzado. */
    const codigo = fuente("src/app/sitemap.ts");
    expect(codigo).toContain('export const dynamic = "force-dynamic"');
    expect(codigo).toContain("mercadoActual");
  });
});
