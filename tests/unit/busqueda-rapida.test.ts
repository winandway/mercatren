import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ══ EL CANDADO DE LA BÚSQUEDA LENTA (20 sep 2026) ══
 *
 * Buscar «ventilador» en mercatren.com tardaba 19 segundos y a ratos devolvía
 * «Algo se atascó de nuestro lado» (500 por tiempo agotado). Tres cosas lo
 * causaban, y las tres viven en `buscar.ts`:
 *
 *  1. Los CATORCE `REPLACE` de quitar acentos se aplicaban al texto
 *     concatenado CON la descripción. Una descripción de CJ pesa miles de
 *     letras: catorce pasadas sobre eso × 47.000 productos, por búsqueda.
 *  2. El desplegable traía la foto con DOS subconsultas correlacionadas por
 *     fila, cada una cruzando `fotos_rotas` — evaluadas para todo lo que
 *     calzaba, no solo para las ocho que se enseñan.
 *  3. La página contaba TODO lo que calzaba (`COUNT(*)`, «Página 1 de 179») y
 *     después volvía a recorrerlo para traer veinticuatro filas.
 *
 * Esta prueba lee el código y se pone roja si cualquiera de las tres vuelve.
 * Comprobada en rojo el 20 sep 2026 devolviendo `descripcionEs` dentro de
 * `normalizar()` y el `COUNT(*)` al conteo del catálogo.
 */

const RAIZ = process.cwd();
const leer = (relativo: string) => readFileSync(join(RAIZ, relativo), "utf8");
/** Solo el código: los comentarios cuentan la historia y nombran lo viejo. */
const sinComentarios = (codigo: string) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("la descripción no pasa por los catorce REPLACE", () => {
  const buscar = sinComentarios(leer("src/lib/catalogo/buscar.ts"));

  it("`normalizar()` NO recibe la descripción", () => {
    /* El texto corto que sí se normaliza, y lo que tiene prohibido llevar. */
    const corto = buscar.slice(
      buscar.indexOf("const TEXTO_CORTO"),
      buscar.indexOf("const DESCRIPCION"),
    );
    expect(corto.length).toBeGreaterThan(50);
    expect(corto).not.toContain("descripcion");
    expect(corto).toContain("tituloEs");
    expect(corto).toContain("marca");
  });

  it("la descripción se compara cruda, y se sigue buscando en ella", () => {
    expect(buscar).toContain(
      "const DESCRIPCION = sql`COALESCE(${productos.descripcionEs}, '')`",
    );
    expect(buscar).toContain('sql`${DESCRIPCION} LIKE ${"%" + f + "%"}`');
    /* Y el nombre viejo, que llevaba la descripción dentro, ya no existe. */
    expect(buscar).not.toContain("TEXTO_PRODUCTO");
  });
});

describe("el desplegable no saca la foto con subconsultas por fila", () => {
  const buscar = sinComentarios(leer("src/lib/catalogo/buscar.ts"));

  it("usa la foto guardada de `fotos_de_producto`", () => {
    expect(buscar).toContain("fotoDeTurnoDe(");
    expect(buscar).toContain("semillaDelDia()");
  });

  it("no queda ni una subconsulta a `imagenes_producto` ni a `fotos_rotas`", () => {
    expect(buscar).not.toContain("imagenesProducto");
    expect(buscar).not.toContain("fotos_rotas");
  });
});

describe("buscando, nada cuenta el catálogo entero", () => {
  const buscar = sinComentarios(leer("src/lib/catalogo/buscar.ts"));
  const consultas = sinComentarios(leer("src/lib/catalogo/consultas.ts"));

  it("el desplegable cuenta hasta un tope", () => {
    expect(buscar).toContain("contarHasta(donde, TOPE_DEL_DESPLEGABLE)");
    expect(buscar).toMatch(/\.limit\(tope\)/);
    /* Y ya no hay un COUNT(*) suelto en el buscador. */
    expect(buscar).not.toContain("COUNT(*)");
  });

  it("el catálogo con búsqueda también, y sin búsqueda sigue contando", () => {
    const listado = consultas.slice(
      consultas.indexOf("export async function listarProductos("),
      consultas.indexOf("export async function listarProductosDeTienda("),
    );
    expect(listado.length).toBeGreaterThan(100);
    expect(listado).toContain("filtros.busqueda");
    expect(listado).toContain(".limit(TOPE_DE_RESULTADOS)");
    /* El `count()` se queda para categoría, comercio y ciudad: esos caminan
       un índice compuesto. Lo que no puede es correr con búsqueda. */
    const conBusqueda = listado.indexOf("filtros.busqueda\n");
    const conCount = listado.indexOf("select({ n: count() })");
    expect(conCount).toBeGreaterThan(-1);
    if (conBusqueda > -1) expect(conCount).toBeGreaterThan(conBusqueda);
  });

  it("el tope es uno solo y lo exporta `buscar.ts`", () => {
    expect(buscar).toContain("export const TOPE_DE_RESULTADOS");
    expect(consultas).toContain('TOPE_DE_RESULTADOS } from "./buscar"');
  });
});
