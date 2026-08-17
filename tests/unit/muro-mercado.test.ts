import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EL MURO DEL MERCADO.
 *
 * ══ QUÉ PROTEGE ══
 *
 * Que una consulta pública del catálogo se escriba sin el filtro del país.
 * Ese olvido NO da error y NO rompe ninguna pantalla: simplemente enseña la
 * mercancía de un país en el dominio de otro. Es el fallo que más tarda en
 * descubrirse, porque desde fuera todo «funciona».
 *
 * ══ POR QUÉ SE LEE EL CÓDIGO FUENTE ══
 *
 * Las otras defensas (el tipo `FiltroDeMercado`, el argumento obligatorio) las
 * comprueba el compilador y son las primeras. Esta prueba cubre lo que el
 * compilador no puede ver: que alguien, con el mercado ya en la mano, escriba
 * una consulta nueva y se olvide de usarlo. El tipo obliga a RECIBIR el país;
 * esto obliga a USARLO.
 *
 * ══ SE COMPRUEBA EN ROJO ══
 *
 * Comprobado el 17 ago 2026 metiendo el fallo a propósito: se quitó el
 * `visibleAqui(mercado)` de `listarComerciosDelCatalogo` y la prueba se puso
 * roja nombrando esa función. Una prueba que pasa con el error delante no
 * protege a nadie.
 */

const RAIZ = join(process.cwd(), "src");

/** Los archivos que consultan tablas con dimensión de país. */
const VIGILADOS = [
  "lib/catalogo/consultas.ts",
  "lib/catalogo/buscar.ts",
] as const;

/** Las formas válidas de traer el país a una consulta. Todas salen de la capa
 *  (`src/lib/mercado/repositorio.ts`); no hay una sexta escrita a mano. */
const FILTROS = [
  "visibleAqui(mercado)",
  "visibleEn(mercado)",
  "tiendaVisibleEn(mercado)",
  "soloDeEsteMercado(mercado",
  /* Una consulta puede heredar el filtro de otra que ya lo aplicó. */
  "donde",
  "condiciones",
  "visible",
];

function fuente(relativo: string): string {
  return readFileSync(join(RAIZ, relativo), "utf8");
}

/**
 * Parte el archivo en funciones exportadas, quedándose con el cuerpo de cada
 * una. Sirve para poder señalar POR NOMBRE la que falla: un «falta un filtro
 * en algún sitio» obliga a leer mil líneas.
 */
function funcionesExportadas(codigo: string): Array<[string, string]> {
  const trozos = codigo.split(/^export (?:async )?function /m).slice(1);
  return trozos.map((trozo) => {
    const nombre = trozo.slice(0, trozo.indexOf("(")).trim();
    const siguiente = trozo.indexOf("\n}\n");
    return [nombre, siguiente === -1 ? trozo : trozo.slice(0, siguiente)];
  });
}

/** ¿Esta función toca alguna tabla que lleva país? */
function consultaDatosConPais(cuerpo: string): boolean {
  return (
    /\.from\(\s*(productos|tiendas|categorias)/.test(cuerpo) ||
    /\.innerJoin\(\s*tiendas/.test(cuerpo)
  );
}

describe("ninguna consulta pública puede olvidarse del país", () => {
  for (const archivo of VIGILADOS) {
    describe(archivo, () => {
      const codigo = fuente(archivo);

      it("cada consulta que toca productos o tiendas lleva su filtro de mercado", () => {
        const sinFiltro = funcionesExportadas(codigo)
          .filter(([, cuerpo]) => consultaDatosConPais(cuerpo))
          .filter(([, cuerpo]) => !FILTROS.some((f) => cuerpo.includes(f)))
          .map(([nombre]) => nombre);

        expect(
          sinFiltro,
          `Estas consultas de ${archivo} traen datos con país y no filtran por mercado. ` +
            `Un chileno vería stock de otro país. Usa visibleEn(mercado) o ` +
            `tiendaVisibleEn(mercado) de src/lib/mercado/repositorio.ts.`,
        ).toEqual([]);
      });

      it("recibe el mercado por argumento, no lo deduce por su cuenta", () => {
        /* Si un archivo de consultas vuelve a llamar a `mercadoActual()`, es
           que dedujo el país por dentro — y entonces el argumento del tipo
           deja de ser la única puerta. El país entra por la firma. */
        expect(codigo).not.toContain("mercadoActual(");
      });

      it("el filtro no se reescribe a mano", () => {
        /* Una segunda copia de `eq(tiendas.mercado, …)` se desincroniza de la
           primera al primer arreglo. Ya pasó: consultas.ts y buscar.ts tenían
           cada uno su `visibleAqui`. */
        expect(codigo).not.toContain("eq(tiendas.mercado");
      });
    });
  }

  it("la marca del filtro no se puede fabricar fuera de la capa", () => {
    /* `FiltroDeMercado` lleva un símbolo único que NO se exporta: sin eso,
       cualquiera podría escribir `as FiltroDeMercado` y colar una condición
       sin país por delante del compilador. */
    const capa = fuente("lib/mercado/repositorio.ts");
    expect(capa).toContain("declare const marcaDeMercado: unique symbol");
    expect(capa).not.toContain("export const marcaDeMercado");
  });
});
