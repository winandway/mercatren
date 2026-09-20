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
      buscar.indexOf("const TITULO"),
    );
    expect(corto.length).toBeGreaterThan(50);
    expect(corto).not.toContain("descripcion");
    expect(corto).toContain("tituloEs");
    expect(corto).toContain("marca");
  });

  it("la descripción NO entra en la consulta, ni normalizada ni cruda", () => {
    /* Compararla cruda no bastó: «ventilador» seguía en 18 s en vivo. */
    expect(buscar).not.toContain("descripcionEs");
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

  it("una búsqueda es UN recorrido, con tope y guardado en el borde", () => {
    const lista = buscar.slice(
      buscar.indexOf("export async function idsQueCalzan("),
      buscar.indexOf("export type Sugerencia"),
    );
    expect(lista).toContain("recordadoEnElBorde(");
    expect(lista).toContain("`busqueda-${mercado.codigo}-");
    expect(lista).toContain(".limit(TOPE_DE_RESULTADOS)");
    /* Ni un COUNT(*) en el buscador: el total es el largo de la lista. */
    expect(buscar).not.toContain("COUNT(*)");
  });

  it("el desplegable y la página comparten esa lista", () => {
    const sugerir = buscar.slice(
      buscar.indexOf("export async function sugerencias("),
    );
    expect(sugerir).toContain("idsQueCalzan(mercado, busqueda)");
    expect(sugerir).toContain("inArray(productos.id, primeras)");
    const listado = consultas.slice(
      consultas.indexOf("export async function listarProductos("),
      consultas.indexOf("export async function listarProductosDeTienda("),
    );
    expect(listado).toContain("idsQueCalzan(mercado, filtros.busqueda)");
    /* Lo del equipo no se guarda en una caché pública. */
    expect(listado).toContain("filtros.busqueda && !filtros.paraElEquipo");
  });

  it("el encabezado no consulta en cada letra", () => {
    const caja = leer("src/components/layout/buscador.tsx");
    expect(caja).toContain("const LETRAS_MINIMAS = 3;");
    const espera = Number(caja.match(/const ESPERA_MS = (\d+);/)?.[1] ?? 0);
    expect(espera).toBeGreaterThanOrEqual(300);
  });

  it("el tope es uno solo y lo exporta `buscar.ts`", () => {
    expect(buscar).toContain("export const TOPE_DE_RESULTADOS");
    expect(consultas).toMatch(/TOPE_DE_RESULTADOS,\s*\} from "\.\/buscar"/);
  });
});

describe("una búsqueda no corre dos veces, y los robots no la recorren", () => {
  it("con `q`, los metadatos salen sin tocar la base y con noindex", () => {
    const pagina = sinComentarios(
      leer("src/app/[locale]/(tienda)/catalogo/page.tsx"),
    );
    const meta = pagina.slice(
      pagina.indexOf("export async function generateMetadata("),
      pagina.indexOf("type Parametros"),
    );
    const conQ = meta.indexOf("if (filtros.q) {");
    const consulta = meta.indexOf("listarProductos(");
    expect(conQ).toBeGreaterThan(-1);
    /* El atajo va ANTES de la consulta: con `q` nunca se llega a ella. */
    expect(conQ).toBeLessThan(consulta);
    expect(meta).toContain("robots: { index: false, follow: true }");
  });

  it("robots.txt cierra los resultados del buscador a los tres robots", async () => {
    const { CERRADO, robotsTxt } = await import("@/lib/seo/robots");
    expect(CERRADO).toContain("/*?q=");
    expect(CERRADO).toContain("/*&q=");
    const texto = robotsTxt("https://mercatren.com");
    expect(texto.match(/Disallow: \/\*\?q=/g)?.length).toBeGreaterThanOrEqual(
      3,
    );
  });
});
