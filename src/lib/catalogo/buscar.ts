import { and, eq, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  categorias,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";
import { mercadoActual } from "@/lib/mercado/actual";

import { direccionImagen } from "./consultas";

/**
 * El motor de busqueda del catalogo.
 *
 * Tres decisiones que lo hacen util de verdad, y no un LIKE disfrazado:
 *
 * 1. NO IMPORTAN LOS ACENTOS NI LAS MAYUSCULAS. Quien busca "lamina" tiene
 *    que encontrar "Lámina", y quien busca "PVC" tiene que encontrar "pvc".
 *    Se normaliza el texto de la base y el de la busqueda con la misma regla.
 *
 * 2. VARIAS PALABRAS, EN CUALQUIER ORDEN. "lamina pvc roja" encuentra
 *    "Láminas de techo PVC acanalado rojo": cada palabra tiene que aparecer
 *    en algun lado del producto, no la frase entera pegada. Es lo que separa
 *    un buscador que sirve de uno que devuelve "sin resultados" siempre.
 *
 * 3. LOS RESULTADOS VIENEN ORDENADOS POR QUE TAN BIEN CALZAN. Un producto
 *    cuyo titulo empieza por lo buscado va antes que uno que lo menciona de
 *    pasada en la descripcion. Sin esto, el primer resultado es cualquiera.
 *
 * Se busca en titulo (los dos idiomas), descripcion, marca, SKU y nombre del
 * comercio. La normalizacion se hace en la consulta y no en una columna
 * aparte a proposito: con este tamano de catalogo sobra, y evita tener que
 * migrar la base cada vez que se afine la regla.
 */

/** Las parejas que se reemplazan para ignorar acentos. */
const ACENTOS: [string, string][] = [
  ["á", "a"],
  ["Á", "a"],
  ["é", "e"],
  ["É", "e"],
  ["í", "i"],
  ["Í", "i"],
  ["ó", "o"],
  ["Ó", "o"],
  ["ú", "u"],
  ["Ú", "u"],
  ["ü", "u"],
  ["Ü", "u"],
  ["ñ", "n"],
  ["Ñ", "n"],
];

/**
 * El mismo texto, sin acentos y en minusculas, dentro de SQL.
 *
 * OJO: las letras van escritas dentro de la consulta (sql.raw) y NO como
 * parametros. Con parametros, cada columna normalizada gastaba 28 huecos y la
 * base cortaba con "too many SQL variables". Es seguro porque son constantes
 * de este archivo, nunca texto de nadie.
 *
 * Y se normaliza el texto YA CONCATENADO, no columna por columna: catorce
 * reemplazos en total en vez de catorce por columna.
 */
function normalizar(columna: SQL | unknown): SQL {
  let expresion = sql`COALESCE(${columna}, '')`;
  for (const [con, sin] of ACENTOS) {
    expresion = sql`REPLACE(${expresion}, ${sql.raw(`'${con}'`)}, ${sql.raw(`'${sin}'`)})`;
  }
  return sql`LOWER(${expresion})`;
}

/** La misma regla, pero en JavaScript, para lo que escribe la persona. */
export function normalizarTexto(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Parte lo buscado en palabras.
 * Se descartan las de una sola letra: no filtran nada y ensucian el orden.
 */
export function palabrasDe(busqueda: string) {
  return normalizarTexto(busqueda)
    .split(/[\s,]+/)
    .filter((p) => p.length > 1)
    .slice(0, 8); // mas de ocho palabras no aporta y encarece la consulta
}

/**
 * Todo el texto de un producto, pegado y normalizado UNA sola vez.
 * Primero se concatena y despues se limpia: asi son catorce reemplazos y no
 * catorce por cada campo.
 */
const TEXTO_PRODUCTO = normalizar(sql`
  COALESCE(${productos.tituloEs}, '') || ' ' ||
  COALESCE(${productos.tituloEn}, '') || ' ' ||
  COALESCE(${productos.descripcionEs}, '') || ' ' ||
  COALESCE(${productos.marca}, '') || ' ' ||
  COALESCE(${productos.sku}, '') || ' ' ||
  COALESCE(${tiendas.nombre}, '')
`);

const TITULO = normalizar(productos.tituloEs);

/** Marca y SKU juntos: los dos identifican el producto de forma corta. */
const MARCA_Y_SKU = normalizar(
  sql`COALESCE(${productos.marca}, '') || ' ' || COALESCE(${productos.sku}, '')`,
);

/** Solo productos publicados de comercios activos. */
const VISIBLE = and(
  eq(productos.estado, "publicado"),
  eq(tiendas.estado, "activa"),
);

/** El mismo candado del mercado que en consultas.ts: el dominio decide qué
 *  catálogo se busca. Buscar en mercatren.cl no puede encontrar mercancía
 *  que solo se entrega desde mercatren.com. */
async function visibleAqui() {
  const mercado = await mercadoActual();
  return and(VISIBLE, eq(tiendas.mercado, mercado.codigo))!;
}

/**
 * Que tan bien calza un producto con lo buscado.
 *
 * La escala importa: que el titulo empiece por lo buscado vale mas que
 * mencionarlo, y mencionarlo en el titulo vale mas que en la descripcion.
 */
function puntuacion(busqueda: string, palabras: string[]): SQL {
  const frase = normalizarTexto(busqueda);
  const partes: SQL[] = [
    // La frase completa, tal cual: lo que mas vale.
    sql`(CASE WHEN ${TITULO} = ${frase} THEN 1000 ELSE 0 END)`,
    sql`(CASE WHEN ${TITULO} LIKE ${frase + "%"} THEN 400 ELSE 0 END)`,
    sql`(CASE WHEN ${TITULO} LIKE ${"%" + frase + "%"} THEN 200 ELSE 0 END)`,
  ];

  // Y despues, palabra por palabra. Se puntua contra el titulo y contra la
  // marca y el SKU juntos; la descripcion ya cuenta para filtrar, y sumarla
  // aqui alargaria la consulta sin cambiar el orden.
  for (const palabra of palabras) {
    const dentro = `%${palabra}%`;
    partes.push(
      sql`(CASE WHEN ${TITULO} LIKE ${palabra + "%"} THEN 60 ELSE 0 END)`,
      sql`(CASE WHEN ${TITULO} LIKE ${dentro} THEN 30 ELSE 0 END)`,
      sql`(CASE WHEN ${MARCA_Y_SKU} LIKE ${dentro} THEN 15 ELSE 0 END)`,
    );
  }

  // Un empujon a lo destacado y a lo que hay en existencia: entre dos
  // productos que calzan igual, es mejor mostrar el que se puede comprar.
  partes.push(
    sql`(CASE WHEN ${productos.destacado} = 1 THEN 25 ELSE 0 END)`,
    sql`(CASE WHEN ${productos.controlaExistencias} = 0 OR ${productos.existencias} > 0 THEN 20 ELSE 0 END)`,
  );

  return sql.join(partes, sql` + `);
}

/** La condicion: TODAS las palabras tienen que aparecer en el producto. */
function todasLasPalabras(palabras: string[]): SQL | undefined {
  if (palabras.length === 0) return undefined;
  return and(
    ...palabras.map((p) => sql`${TEXTO_PRODUCTO} LIKE ${"%" + p + "%"}`),
  );
}

export type Sugerencia = {
  slug: string;
  titulo: string;
  precioCentavos: number;
  moneda: string;
  imagenUrl: string | null;
  tiendaNombre: string;
  tiendaSlug: string;
  agotado: boolean;
};

/**
 * Las mejores coincidencias, para el desplegable del buscador.
 * Devuelve pocas y ordenadas: es una ayuda mientras se escribe, no un listado.
 */
export async function sugerencias(busqueda: string, cuantas = 8) {
  const palabras = palabrasDe(busqueda);
  if (palabras.length === 0) return { productos: [], comercios: [], total: 0 };

  const db = getDb();
  const relevancia = puntuacion(busqueda, palabras);
  const mercado = await mercadoActual();
  const donde = and(await visibleAqui(), todasLasPalabras(palabras));

  const [filas, [conteo], comercios] = await Promise.all([
    db
      .select({
        slug: productos.slug,
        tituloEs: productos.tituloEs,
        tituloEn: productos.tituloEn,
        precioCentavos: productos.precioCentavos,
        moneda: productos.moneda,
        existencias: productos.existencias,
        controlaExistencias: productos.controlaExistencias,
        tiendaNombre: tiendas.nombre,
        tiendaSlug: tiendas.slug,
        fotoUrl: sql<
          string | null
        >`(SELECT ${imagenesProducto.url} FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY ${imagenesProducto.orden} LIMIT 1)`,
        fotoClave: sql<
          string | null
        >`(SELECT ${imagenesProducto.clave} FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY ${imagenesProducto.orden} LIMIT 1)`,
      })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .where(donde)
      .orderBy(sql`(${relevancia}) DESC`)
      .limit(cuantas),

    db
      .select({ n: sql<number>`COUNT(*)` })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .where(donde),

    // Si lo buscado es el nombre de un comercio, se ofrece su tienda entera.
    db
      .select({ slug: tiendas.slug, nombre: tiendas.nombre })
      .from(tiendas)
      .where(
        and(
          eq(tiendas.estado, "activa"),
          eq(tiendas.mercado, mercado.codigo),
          sql`${normalizar(tiendas.nombre)} LIKE ${"%" + palabras[0] + "%"}`,
        ),
      )
      .limit(3),
  ]);

  return {
    productos: filas.map((f): Sugerencia => ({
      slug: f.slug,
      titulo: f.tituloEs,
      precioCentavos: f.precioCentavos,
      moneda: f.moneda,
      imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
      tiendaNombre: f.tiendaNombre,
      tiendaSlug: f.tiendaSlug,
      agotado: f.controlaExistencias && f.existencias <= 0,
    })),
    comercios,
    total: Number(conteo?.n ?? 0),
  };
}

/**
 * La condicion y el orden para el listado completo del catalogo, para que la
 * pagina de resultados use EXACTAMENTE el mismo motor que el desplegable.
 */
export function condicionDeBusqueda(busqueda?: string) {
  const palabras = palabrasDe(busqueda ?? "");
  if (palabras.length === 0) return { donde: undefined, orden: undefined };

  return {
    donde: todasLasPalabras(palabras),
    orden: sql`(${puntuacion(busqueda!, palabras)}) DESC`,
  };
}

/** Categorias que calzan con lo buscado, para sugerir un atajo. */
export async function categoriasQueCalzan(busqueda: string) {
  const palabras = palabrasDe(busqueda);
  if (palabras.length === 0) return [];

  const db = getDb();
  return db
    .selectDistinct({ slug: categorias.slug, nombre: categorias.nombreEs })
    .from(categorias)
    .where(
      sql`${normalizar(categorias.nombreEs)} LIKE ${"%" + palabras[0] + "%"}`,
    )
    .limit(3);
}
