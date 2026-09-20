import { and, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { recordadoEnElBorde } from "@/lib/cachecito";
import { getDb } from "@/lib/db";
import {
  categorias,
  productos,
  textoDeBusqueda,
  tiendas,
} from "@/lib/db/schema";
import type { Mercado } from "@/lib/mercado/mercados";

import { normalizarTexto } from "./normalizar";
import { normalizarSql } from "./normalizar-sql";
import { expandir } from "./sinonimos";
import {
  type FiltroDeMercado,
  tiendaVisibleEn,
  visibleEn,
} from "@/lib/mercado/repositorio";

import { direccionImagen, semillaDelDia } from "./consultas";
import { fotoDeTurnoDe } from "./fotos-de-producto";
import { textoDeBusquedaListo } from "./texto-de-busqueda";

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

/* Quitar acentos dentro de SQL: ver `normalizar-sql.ts`. */
const normalizar = normalizarSql;

/** La misma regla, pero en JavaScript, para lo que escribe la persona.
 *  Vive en `normalizar.ts` para no formar un círculo con `sinonimos.ts`. */
export { normalizarTexto };

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
 *
 * ══ EL NOMBRE DEL DEPARTAMENTO CUENTA, Y EN ESPAÑOL ══
 *
 * Un producto de CJ se llama «Winch Straps, 6000 Lbs Load Capacity»: ni su
 * título ni su descripción dicen una palabra en español. Pero está colgado de
 * «Ferretería y construcción», y eso sí está en español para todos los
 * productos, vengan de donde vengan.
 *
 * Así, quien escribe «ferreteria» encuentra el departamento entero aunque cada
 * ficha esté en inglés, y funciona antes de traducir un solo producto.
 *
 * ══ VA COMO SUBCONSULTA, Y ESO NO ES UN DETALLE DE ESTILO ══
 *
 * La primera versión lo escribió como `categorias.nombreEs` a secas,
 * aprovechando que el listado del catálogo ya hacía ese join. **Y rompió el
 * buscador entero**: `sugerencias()` —el desplegable que sale mientras se
 * escribe— solo une `productos` con `tiendas`, así que su consulta quedó
 * inválida, murió en su `try`, y devolvía cero resultados para TODO. Lo
 * destapó probarlo en el navegador: «tablero» daba 3 y pasó a dar 0.
 *
 * Este fragmento lo comparten varias consultas con joins distintos, así que
 * **no puede depender de lo que haya unido quien lo llama**. La subconsulta se
 * basta sola, igual que ya se hace aquí mismo con la primera foto.
 * Primero se concatena y despues se limpia: asi son catorce reemplazos y no
 * catorce por cada campo.
 */
/**
 * ══ LA DESCRIPCIÓN NO SE NORMALIZA (emergencia de lentitud, 20 sep 2026) ══
 *
 * Buscar «ventilador» tardaba 19 segundos y a ratos devolvía 500 por tiempo
 * agotado. La culpa no era del LIKE: era de los CATORCE `REPLACE` anidados
 * aplicados al texto CONCATENADO, que incluía `descripcion_es`. Una
 * descripción de CJ pesa varios miles de letras; catorce pasadas sobre eso,
 * por cada uno de los 47.000 productos, son gigabytes de texto manipulado en
 * cada búsqueda.
 *
 * Ahora se parte en dos:
 *  - **Los campos cortos** (títulos, marca, SKU, comercio, departamento) sí
 *    se normalizan: son los que deciden la relevancia y son baratos.
 *  - **La descripción** no entra en la consulta. Ni normalizada ni cruda: ver
 *    la nota de abajo.
 *
 * NO volver a meter `descripcionEs` en el texto que se busca.
 * Candado: `tests/unit/busqueda-rapida.test.ts`.
 */
const TEXTO_CORTO = normalizar(sql`
  COALESCE(${productos.tituloEs}, '') || ' ' ||
  COALESCE(${productos.tituloEn}, '') || ' ' ||
  COALESCE(${productos.marca}, '') || ' ' ||
  COALESCE(${productos.sku}, '') || ' ' ||
  COALESCE(${tiendas.nombre}, '') || ' ' ||
  COALESCE((SELECT ${categorias.nombreEs} FROM ${categorias}
            WHERE ${categorias.id} = ${productos.categoriaId}), '')
`);

/* ══ Y LA DESCRIPCIÓN YA NO SE RECORRE EN CADA BÚSQUEDA (20 sep 2026, 2.ª parte) ══
   Compararla cruda no bastó: medido en vivo, «ventilador» seguía en 18 s. Un
   `LIKE` por cada sinónimo sobre 47.000 descripciones de varios miles de
   letras es leer cientos de megas por búsqueda. Se busca en lo corto —títulos
   en los dos idiomas, marca, SKU, comercio y departamento—, que es donde la
   gente acierta. */

const TITULO = normalizar(productos.tituloEs);

/** Marca y SKU juntos: los dos identifican el producto de forma corta. */
const MARCA_Y_SKU = normalizar(
  sql`COALESCE(${productos.marca}, '') || ' ' || COALESCE(${productos.sku}, '')`,
);

/**
 * Dónde se busca. Dos juegos con el MISMO contenido:
 *  - `AL_VUELO`: se normaliza en la consulta (catorce `REPLACE` por fila). Es
 *    el camino de siempre y el respaldo.
 *  - `PREPARADO`: las columnas de `texto_de_busqueda`, que el reloj ya dejó
 *    sin acentos y en minúsculas. Un `LIKE` a secas. Ver `texto-de-busqueda.ts`.
 */
type Campos = { texto: SQL; titulo: SQL; marcaSku: SQL };
const AL_VUELO: Campos = {
  texto: TEXTO_CORTO,
  titulo: TITULO,
  marcaSku: MARCA_Y_SKU,
};
const PREPARADO: Campos = {
  texto: sql`${textoDeBusqueda.texto}`,
  titulo: sql`${textoDeBusqueda.titulo}`,
  marcaSku: sql`${textoDeBusqueda.marcaSku}`,
};

/** El candado del mercado sale de la capa: el dominio decide qué catálogo se
 *  busca, y buscar en mercatren.cl no puede encontrar mercancía que solo se
 *  entrega desde mercatren.com. Aquí NO se vuelve a escribir el filtro — una
 *  segunda copia se desincroniza de la primera al primer arreglo. */
function visibleAqui(mercado: Mercado): FiltroDeMercado {
  return visibleEn(mercado);
}

/**
 * Que tan bien calza un producto con lo buscado.
 *
 * La escala importa: que el titulo empiece por lo buscado vale mas que
 * mencionarlo, y mencionarlo en el titulo vale mas que en la descripcion.
 */
function puntuacion(
  busqueda: string,
  palabras: string[],
  campos: Campos = AL_VUELO,
): SQL {
  const TITULO = campos.titulo;
  const MARCA_Y_SKU = campos.marcaSku;
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
function todasLasPalabras(
  palabras: string[],
  campos: Campos = AL_VUELO,
): SQL | undefined {
  const TEXTO_CORTO = campos.texto;
  if (palabras.length === 0) return undefined;
  /**
   * CADA PALABRA VALE POR TODAS SUS EQUIVALENTES.
   *
   * Sigue haciendo falta que estén TODAS las palabras —quien escribe «freno
   * bicicleta» quiere las dos cosas—, pero cada una se da por buena si aparece
   * ella o cualquiera de sus sinónimos: su plural, su nombre en otro país, o
   * su nombre en inglés.
   *
   * Ese último es el que desbloquea el catálogo de Estados Unidos, que está
   * escrito en inglés: «bicicleta» encuentra «bike» sin haber traducido ni un
   * producto. Ver `sinonimos.ts`.
   */
  return and(
    ...palabras.map((p) => {
      const formas = expandir(p);
      /* Nunca vacío: `expandir` siempre devuelve al menos lo escrito. Pero si
         un día devolviera vacío, un `or()` sin argumentos daría `undefined` y
         la palabra dejaría de filtrar — es decir, el buscador traería el
         catálogo entero. Se protege aquí. */
      const buscables = formas.length === 0 ? [p] : formas;
      return or(
        ...buscables.map((f) => sql`${TEXTO_CORTO} LIKE ${"%" + f + "%"}`),
      );
    }),
  );
}

/**
 * ══ BUSCAR NO CUENTA EL CATÁLOGO ENTERO (20 sep 2026) ══
 *
 * Con búsqueda, la página hacía un `COUNT(*)` sobre TODO lo que calzaba —un
 * segundo recorrido completo, solo para escribir «Página 1 de 179»— y después
 * otro para traer las veinticuatro que se ven. Nadie abre la página 179: los
 * únicos que recorren esa paginación son los robots, y cada página suya era
 * otro recorrido del catálogo.
 *
 * Ahora se cuenta HASTA UN TOPE. Si hay más, la paginación llega hasta ahí y
 * lo demás se afina escribiendo mejor lo buscado, que es lo que hace la gente.
 */
export const TOPE_DE_RESULTADOS = 600;

/** Cuánto vive guardada una búsqueda: lo que tarda alguien en paginarla. */
export const BUSQUEDA_GUARDADA_MS = 5 * 60_000;

/**
 * ══ UNA BÚSQUEDA = UN SOLO RECORRIDO, GUARDADO CINCO MINUTOS ══
 *
 * Los primeros `TOPE_DE_RESULTADOS` ids que calzan, ya ordenados por
 * relevancia. De esta lista salen el desplegable (las ocho primeras), el
 * total, y TODAS las páginas de resultados: quien escribe «ventilador», mira
 * el desplegable, pulsa Enter y pasa a la página 2 recorre el catálogo UNA
 * vez, no seis. Y el siguiente visitante que busque lo mismo, ninguna.
 *
 * Solo lo público: la búsqueda del equipo (que ve lo «en revisión») no pasa
 * por aquí, porque esto se guarda en una caché compartida.
 */
export async function idsQueCalzan(
  mercado: Mercado,
  busqueda: string,
): Promise<string[]> {
  const palabras = palabrasDe(busqueda);
  if (palabras.length === 0) return [];
  return recordadoEnElBorde(
    `busqueda-${mercado.codigo}-${palabras.join(" ")}`,
    BUSQUEDA_GUARDADA_MS,
    async () => {
      const frase = palabras.join(" ");
      /* Con el texto ya preparado, si el reloj terminó de llenarlo; si no,
         normalizando al vuelo como siempre. Nunca con la tabla a medias. */
      const preparado = await textoDeBusquedaListo();
      const campos = preparado ? PREPARADO : AL_VUELO;
      const base = getDb()
        .select({ id: productos.id })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId));
      const conTexto = preparado
        ? base.innerJoin(
            textoDeBusqueda,
            eq(textoDeBusqueda.productoId, productos.id),
          )
        : base;
      const filas = await conTexto
        .where(and(visibleAqui(mercado), todasLasPalabras(palabras, campos)))
        .orderBy(
          sql`(${puntuacion(frase, palabras, campos)}) DESC`,
          desc(productos.actualizadoEn),
        )
        .limit(TOPE_DE_RESULTADOS);
      return filas.map((f) => f.id);
    },
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
export async function sugerencias(
  mercado: Mercado,
  busqueda: string,
  cuantas = 8,
) {
  const palabras = palabrasDe(busqueda);
  if (palabras.length === 0)
    return { productos: [], comercios: [], total: 0, hayMas: false };

  const db = getDb();
  const [ids, comercios] = await Promise.all([
    idsQueCalzan(mercado, busqueda),

    // Si lo buscado es el nombre de un comercio, se ofrece su tienda entera.
    db
      .select({ slug: tiendas.slug, nombre: tiendas.nombre })
      .from(tiendas)
      .where(
        and(
          tiendaVisibleEn(mercado),
          sql`${normalizar(tiendas.nombre)} LIKE ${"%" + palabras[0] + "%"}`,
        ),
      )
      .limit(3),
  ]);

  /* Las que se enseñan, por su clave y nada más en el WHERE (ver la trampa
     del índice de estado en CLAUDE.md). El orden lo pone la lista. */
  const primeras = ids.slice(0, cuantas);
  const sueltas =
    primeras.length === 0
      ? []
      : await db
          .select({
            id: productos.id,
            slug: productos.slug,
            tituloEs: productos.tituloEs,
            tituloEn: productos.tituloEn,
            precioCentavos: productos.precioCentavos,
            moneda: productos.moneda,
            existencias: productos.existencias,
            controlaExistencias: productos.controlaExistencias,
            tiendaNombre: tiendas.nombre,
            tiendaSlug: tiendas.slug,
          })
          .from(productos)
          .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
          .where(inArray(productos.id, primeras));
  const porId = new Map(sueltas.map((f) => [f.id, f]));
  const filas = primeras
    .map((id) => porId.get(id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const cuantosCalzan = ids.length;

  /* La foto sale de `fotos_de_producto`, igual que en los listados: las dos
     subconsultas por fila que había aquí se evaluaban para TODO lo que
     calzaba, no solo para las ocho que se muestran. */
  const fotos = await fotoDeTurnoDe(
    filas.map((f) => f.id),
    semillaDelDia(),
  );

  return {
    productos: filas.map((f): Sugerencia => {
      const foto = fotos.get(f.id) ?? null;
      return {
        slug: f.slug,
        titulo: f.tituloEs,
        precioCentavos: f.precioCentavos,
        moneda: f.moneda,
        imagenUrl: foto
          ? direccionImagen({ url: foto.url, clave: foto.clave })
          : null,
        tiendaNombre: f.tiendaNombre,
        tiendaSlug: f.tiendaSlug,
        agotado: f.controlaExistencias && f.existencias <= 0,
      };
    }),
    comercios,
    total: cuantosCalzan,
    /* Al tope no se dice un número: enseñar «Ver los 200 resultados» cuando
       hay tres mil es mentir con precisión. */
    hayMas: cuantosCalzan >= TOPE_DE_RESULTADOS,
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
export async function categoriasQueCalzan(mercado: Mercado, busqueda: string) {
  const palabras = palabrasDe(busqueda);
  if (palabras.length === 0) return [];

  const db = getDb();
  /**
   * SOLO CATEGORÍAS QUE DE VERDAD TIENEN ALGO EN ESTE PAÍS.
   *
   * Antes esta consulta no miraba el mercado: en mercatren.cl, escribir
   * «taladro» ofrecía el atajo a «Ferretería y construcción» y ese atajo
   * llevaba a una página vacía. No es una fuga de datos, es peor de leer:
   * el sitio promete un camino y al final no hay nada.
   */
  return db
    .selectDistinct({ slug: categorias.slug, nombre: categorias.nombreEs })
    .from(categorias)
    .innerJoin(productos, eq(productos.categoriaId, categorias.id))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        visibleEn(mercado),
        sql`${normalizar(categorias.nombreEs)} LIKE ${"%" + palabras[0] + "%"}`,
      ),
    )
    .limit(3);
}
