import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ══ EL CANDADO DE LA EMERGENCIA DE COSTO (17 sep 2026) ══
 *
 * La base `site-mercatren-db` llegó a leer 134 mil millones de filas al mes
 * ($109 de sobrecosto, camino de $775/mes). Cinco consultas se llevaban casi
 * todo, y las cinco eran CONTEOS o BÚSQUEDAS que recorrían el catálogo entero
 * en cada visita:
 *
 *   #1 la tira de departamentos (subconsulta correlacionada: 458.000 filas)
 *   #2 el directorio de comercios con conteo (441.000 filas)
 *   #3 el menú de categorías (47.000 filas)
 *   #4 la ficha por slug (10.000 filas: sin índice por slug)
 *   #5 el bombillo de ciudades (32.000 filas)
 *
 * Lo que las arregló: los conteos salen de una foto guardada que el reloj
 * rehace cada cinco minutos (`src/lib/catalogo/conteos.ts`); la ficha
 * resuelve el slug sola y trae la fila por su clave; y los índices compuestos
 * viajan en `schema.sql`. Esta prueba lee el código y se pone roja si
 * cualquiera de esas piezas vuelve atrás. Comprobada en rojo el 17 sep 2026
 * devolviendo la subconsulta correlacionada a `listarDepartamentosDePortada`.
 */

const RAIZ = process.cwd();
const leer = (relativo: string) => readFileSync(join(RAIZ, relativo), "utf8");
/** Solo el código: los comentarios cuentan la historia y nombran lo viejo. */
const sinComentarios = (codigo: string) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** El cuerpo de una función exportada, por nombre. */
function funcion(codigo: string, nombre: string): string {
  const inicio = codigo.indexOf(`export async function ${nombre}(`);
  expect(inicio, `no existe ${nombre}`).toBeGreaterThan(-1);
  const resto = codigo.slice(inicio);
  const fin = resto.indexOf("\n}\n");
  return fin === -1 ? resto : resto.slice(0, fin);
}

describe("los conteos del catálogo leen la foto guardada, no la base", () => {
  const consultas = sinComentarios(leer("src/lib/catalogo/consultas.ts"));

  it("#1 la tira de departamentos ya no hace una subconsulta por departamento", () => {
    expect(consultas).not.toMatch(/\(SELECT COUNT\(\*\)/);
    expect(consultas).not.toContain("h.padre_id = d.id");
    const tira = funcion(consultas, "listarDepartamentosDePortada");
    expect(tira).toContain("conteosDe(mercado)");
    /* Con ciudad, un GROUP BY plano y los hijos sumados en código. */
    expect(consultas).toContain(".groupBy(productos.categoriaId)");
    expect(consultas).toContain("armarDepartamentos(porCategoria, arbol)");
  });

  it("#2 el directorio de comercios sale de la foto", () => {
    const f = funcion(consultas, "listarComerciosDestacados");
    expect(f).toContain("conteosDe(mercado)");
    expect(f).not.toContain(".leftJoin(");
    expect(f).not.toContain("groupBy(");
    /* La forma de siempre: `creadoEn` vuelve a ser una fecha. */
    expect(f).toContain("creadoEn: new Date(creadoEnMs)");
  });

  it("#2b los comercios del catálogo también, y solo los que tienen algo", () => {
    const f = funcion(consultas, "listarComerciosDelCatalogo");
    expect(f).toContain("conteosDe(mercado)");
    expect(f).toContain("c.cuantos > 0");
  });

  it("#3 el menú de categorías sale de la foto", () => {
    const f = funcion(consultas, "listarCategoriasConProductos");
    expect(f).toContain("conteosDe(mercado)");
    expect(f).not.toContain("innerJoin(");
  });

  it("#5 el bombillo de ciudades sale de la foto", () => {
    const cobertura = sinComentarios(leer("src/lib/entrega/cobertura.ts"));
    expect(cobertura).toContain("conteosDe(mercado)");
    expect(cobertura).not.toContain("GROUP BY");
    expect(cobertura).not.toContain("groupBy(");
  });

  it("el total del catálogo sin filtros y el de la portada sin ciudad salen de la foto", () => {
    const listado = funcion(consultas, "listarProductos");
    expect(listado).toContain("(await conteosDe(mercado)).total");
    expect(consultas).toContain("(await conteosDe(mercado)).totalConPrecio");
  });
});

describe("#4 la ficha por slug no recorre el catálogo", () => {
  const consultas = sinComentarios(leer("src/lib/catalogo/consultas.ts"));
  const ficha = funcion(consultas, "obtenerProductoPorSlug");

  it("resuelve el slug solo, sin otro índice que elegir, y trae la fila por id", () => {
    const porSlug = ficha.indexOf(".where(eq(productos.slug, slug))");
    const porId = ficha.indexOf("inArray(\n          productos.id,");
    expect(porSlug).toBeGreaterThan(-1);
    expect(porId).toBeGreaterThan(porSlug);
    /* El filtro de mercado y de «publicado» sigue decidiendo qué se ve. */
    expect(ficha).toContain(
      "visibleAqui(mercado, Boolean(opciones?.paraElEquipo))",
    );
  });

  it("los similares son dos consultas acotadas por índice, no un OR ordenado por CASE", () => {
    const similares = funcion(consultas, "productosSimilares");
    expect(similares).not.toContain("or(");
    expect(similares).not.toContain("THEN 0 ELSE 1 END`");
    expect(similares).toContain("eq(productos.categoriaId, de.categoriaId)");
    expect(similares).toContain("eq(productos.tiendaId, de.tiendaId)");
    expect(similares).toContain(".orderBy(desc(productos.creadoEn))");
    expect(similares).toContain(".limit(cuantos)");
    /* Sin desempate por id (18 sep 2026): así el índice sirve para el orden. */
    expect(similares).not.toContain("desc(productos.creadoEn), productos.id");
  });
});

describe("la foto: quién la rehace y quién avisa si no", () => {
  it("el módulo guarda en `configuracion` (existe en producción) y la lee con la caché del borde", () => {
    const conteos = sinComentarios(leer("src/lib/catalogo/conteos.ts"));
    expect(conteos).toContain(".insert(configuracion)");
    expect(conteos).toContain(
      "onConflictDoUpdate({ target: configuracion.clave",
    );
    expect(conteos).toContain("recordadoEnElBorde(");
    expect(conteos).toContain("`conteos-catalogo-${mercado.codigo}`");
    /* Sin fila, se calcula UNA vez y se guarda: nunca por visita. */
    expect(conteos).toContain(
      "(await conteosGuardados(mercado)) ?? recalcularConteos(mercado)",
    );
    /* Los agregados baratos: un GROUP BY plano por categoría y tienda. */
    expect(conteos).toContain(
      ".groupBy(productos.categoriaId, productos.tiendaId)",
    );
    expect(conteos).toContain(".groupBy(depositos.zona)");
    expect(conteos).not.toMatch(/\(SELECT COUNT\(\*\)/);
  });

  it("el reloj la rehace cada cinco minutos, antes de darle el latido a CJ", () => {
    const tick = leer("src/lib/reloj/tick.ts");
    const conteos = tick.indexOf("recalcularTodosLosConteos()");
    const importacion = tick.indexOf("avanzarImportacionesEnCurso(");
    expect(conteos).toBeGreaterThan(-1);
    expect(conteos).toBeLessThan(importacion);
    expect(tick).toContain("CONTEOS_CADA_MS");
    const modulo = leer("src/lib/catalogo/conteos.ts");
    expect(modulo).toContain("CONTEOS_CADA_MS = 5 * 60_000");
  });

  it("el canario dice la edad de la foto y marca las viejas", () => {
    const salud = leer("src/app/datos/salud/route.ts");
    expect(salud).toContain("edadDeLosConteos()");
    expect(salud).toContain("conteos,");
  });

  it("la puerta de pruebas puede rehacerla a mano", () => {
    const puerta = leer("src/app/datos/probar-compra/route.ts");
    expect(puerta).toContain('z.literal("conteos")');
    expect(puerta).toContain("recalcularTodosLosConteos()");
  });
});

describe("los índices compuestos viajan en schema.sql", () => {
  const INDICES = [
    "CREATE INDEX IF NOT EXISTS `idx_productos_slug` ON `productos` (`slug`);",
    "CREATE INDEX IF NOT EXISTS `idx_productos_estado_categoria` ON `productos` (`estado`,`categoria_id`);",
    "CREATE INDEX IF NOT EXISTS `idx_productos_estado_tienda` ON `productos` (`estado`,`tienda_id`);",
    "CREATE INDEX IF NOT EXISTS `idx_productos_deposito_estado` ON `productos` (`deposito_id`,`estado`);",
    "CREATE INDEX IF NOT EXISTS `idx_productos_categoria_creado` ON `productos` (`categoria_id`,`creado_en`);",
    "CREATE INDEX IF NOT EXISTS `idx_productos_tienda_creado` ON `productos` (`tienda_id`,`creado_en`);",
    "CREATE INDEX IF NOT EXISTS `idx_tiendas_mercado_estado` ON `tiendas` (`mercado`,`estado`);",
  ];

  it("cada índice está en el esquema y en schema.sql, tal cual", () => {
    const schema = leer("schema.sql");
    const esquema = leer("src/lib/db/schema.ts");
    for (const indice of INDICES) {
      expect(schema, indice).toContain(indice);
      const nombre = indice.match(/`(idx_[a-z_]+)`/)?.[1];
      expect(esquema, nombre).toContain(`index("${nombre}")`);
    }
  });
});
