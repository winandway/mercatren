import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import {
  DEPARTAMENTOS,
  nombreDepartamento,
} from "@/lib/catalogo/departamentos";
import {
  CJ_POR_RONDA,
  familiaDe,
  intercalarPorTienda,
  PRODUCTOS_POR_RONDA,
} from "@/lib/catalogo/intercalar";
import { recordado, recordadoEnElBorde } from "@/lib/cachecito";
import { getDb } from "@/lib/db";

import { condicionDeBusqueda } from "./buscar";
import {
  categorias,
  depositos,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";
import { zonaPorSlug } from "@/lib/entrega/zonas";
import { DIAS_PRODUCTO_NUEVO } from "@/lib/dinero";
import type { Mercado } from "@/lib/mercado/mercados";
import {
  type FiltroDeMercado,
  tiendaVisibleEn,
  visibleEn,
} from "@/lib/mercado/repositorio";
import { RUTA_MEDIA } from "@/lib/rutas";

/**
 * Consultas del catalogo publico.
 *
 * Estas SI son abiertas: cualquiera puede ver la tienda sin cuenta. Por eso
 * aqui no se pide permiso, pero a cambio solo se devuelve lo que puede ver
 * cualquiera: productos PUBLICADOS de comercios ACTIVOS **del mercado por el
 * que se entro**, y nada de datos internos del comercio.
 */

const VISIBLE = and(
  eq(productos.estado, "publicado"),
  eq(tiendas.estado, "activa"),
);

/**
 * EL CANDADO DEL MERCADO (17 ago 2026).
 *
 * El dominio decide el catalogo: mercatren.com enseña el mercado US (los
 * comercios de Venezuela + el catalogo de EE. UU.) y mercatren.cl enseña
 * SOLO lo de Chile. Un producto que no se puede entregar en Chile no puede
 * salir en mercatren.cl.
 *
 * Se resuelve AQUI, dentro de las consultas, y no en cada pagina: igual que
 * el alcance de los comercios, si dependiera de que cada pantalla lo pase,
 * la primera que lo olvide enseñaria el catalogo de un pais en el dominio
 * de otro.
 */
function visibleAqui(mercado: Mercado): FiltroDeMercado {
  return visibleEn(mercado);
}

export type OrdenCatalogo = "recientes" | "precio_asc" | "precio_desc";

export type FiltrosCatalogo = {
  busqueda?: string;
  categoria?: string;
  comercio?: string;
  orden?: OrdenCatalogo;
  pagina?: number;
  porPagina?: number;
  /** Slugs de ciudad: solo productos cuyo depósito esté en alguna de ellas. */
  zona?: string[];
};

/**
 * EL FILTRO POR CIUDAD: quien eligió Caracas ve lo que se retira en Caracas.
 *
 * Antes elegir ciudad no filtraba nada — salía todo lo de El Vigía aunque
 * uno estuviera parado en Caracas, y el dueño lo mandó a corregir: "debería
 * salir todo lo que hay en Caracas cuando seleccione Caracas".
 *
 * Se filtra por el DEPÓSITO del producto, que es donde de verdad está la
 * mercancía. La lista de ciudades llega ya armada (la ciudad del cliente +
 * su estado + los pueblos vecinos, ver ciudadesVisiblesDesde); aquí solo se
 * traduce a SQL.
 */
/**
 * EL CORTE DE LA NOVEDAD, EN SEGUNDOS.
 *
 * Va en segundos y no como Date a propósito: la columna se declara
 * `integer(mode: "timestamp")`, que guarda segundos, y D1 rechaza cualquier
 * objeto como parámetro con un `D1_TYPE_ERROR` que tumba la consulta entera.
 * Pasó el 5 ago 2026 al ordenar por novedad: el catálogo devolvía 500.
 */
function corteDeNovedad(): number {
  return Math.floor(
    (Date.now() - DIAS_PRODUCTO_NUEVO * 24 * 60 * 60 * 1000) / 1000,
  );
}

function enZona(ciudades: string[]) {
  const lista = sql.join(
    ciudades.map((c) => sql`${c}`),
    sql`, `,
  );

  /**
   * LOS PRODUCTOS SIN DEPÓSITO HEREDAN LA CIUDAD DE SU TIENDA.
   *
   * Un comercio nuevo subió su arnés y su casco ANTES de que el formulario
   * pidiera la ciudad: quedaron sin depósito y el filtro de Caracas los
   * excluía — el dueño refrescó diez veces y nunca salieron, mientras Bley
   * copaba la pantalla. No era favoritismo: era este hueco.
   *
   * La tienda guarda su ciudad como texto libre ("Caracas", "CARACAS"), así
   * que se compara sin mayúsculas y sin acentos contra el nombre de cada
   * ciudad del filtro. El producto CON depósito sigue mandando el depósito,
   * que es más preciso.
   */
  const nombres = sql.join(
    ciudades
      .map((slug) => zonaPorSlug(slug)?.nombre)
      .filter((n): n is string => Boolean(n))
      .map((n) => sql`${normalizarCiudad(n)}`),
    sql`, `,
  );

  return sql`(
    ${productos.depositoId} IN (
      SELECT dz.id FROM ${depositos} dz
       WHERE dz.activo = 1 AND dz.zona IN (${lista})
    )
    OR (
      ${productos.depositoId} IS NULL
      AND LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(${tiendas.ciudad}), 'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u')) IN (${nombres})
    )
    /**
     * ══ LO QUE SE ENTREGA EN ESTADOS UNIDOS NO SE FILTRA POR CIUDAD ══
     *
     * Este filtro contesta «¿dónde lo retiro?», y esa pregunta solo existe en
     * Venezuela. Lo que se DESPACHA —EE. UU., y desde el 27 ago 2026 también
     * Chile y Colombia— no se retira en ningún lado: va a la dirección del
     * comprador, así que la zona no lo puede esconder.
     *
     * Sin esta línea quedaban invisibles: la tienda de Estados Unidos no tiene
     * depósito ni una ciudad venezolana, así que las dos condiciones de arriba
     * le daban falso y **los 78 productos no salían en la portada** aunque el
     * catálogo estuviera montado y publicado.
     */
    OR UPPER(TRIM(COALESCE(${tiendas.paisOrigen}, ''))) IN ('US', 'CL', 'CO')
  )`;
}

/** "El Vigía " → "el vigia": para comparar la ciudad libre de la tienda. */
function normalizarCiudad(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * La direccion de una foto.
 * Si vino de la tienda de origen se muestra desde alli; si la subio el comercio
 * a nuestro bucket, se sirve por /media.
 */
export function direccionImagen(imagen: {
  url: string | null;
  clave: string | null;
}) {
  if (imagen.url) return imagen.url;
  if (imagen.clave) return `${RUTA_MEDIA}/${imagen.clave}`;
  return null;
}

export type ProductoLista = {
  id: string;
  slug: string;
  tituloEs: string;
  tituloEn: string | null;
  precioCentavos: number;
  precioAntesCentavos: number | null;
  moneda: string;
  existencias: number;
  controlaExistencias: boolean;
  unidad: string | null;
  marca: string | null;
  destacado: boolean;
  /** Para el sello de "nuevo". Texto cuando viaja por JSON. */
  creadoEn: Date | string | null;
  tiendaNombre: string;
  tiendaSlug: string;
  /**
   * El país de la tienda, que es de donde sale el destino del producto.
   *
   * Va en la tarjeta para poder dibujar la banderita sin una consulta más: en
   * una portada con seis bandas son cientos de tarjetas, y preguntar por cada
   * una sería una consulta por producto.
   */
  tiendaPais: string | null;
  imagenUrl: string | null;
  imagenAlt: string | null;
};

/**
 * LA FOTO DE LA TARJETA ROTA ENTRE LAS QUE TIENE EL PRODUCTO (23 ago 2026).
 *
 * Lo pidió el dueño con un caso concreto: MAXIUM tiene dos fotos de sus
 * láminas de zinc; la primera es fea y la segunda, linda — y la linda no la
 * veía nadie, porque la tarjeta siempre enseñaba la primera. Ahora cada
 * visita (la semilla de la portada) o cada día (las páginas sin semilla)
 * elige OTRA de las fotos del producto: «un día una foto, otro día otra».
 *
 *  - El turno se calcula con `ROW_NUMBER` dentro de las fotos del producto,
 *    no con la columna `orden`: el importador deja `orden = 0` en todas, y
 *    con esa columna sola todas empatarían y no rotaría nada.
 *  - Las tres subconsultas (dirección, clave y texto alternativo) llevan el
 *    MISMO criterio de orden, así que las tres hablan de la misma foto.
 *  - La semilla va como literal entero (`sql.raw` de un número saneado), no
 *    como parámetro, por la misma razón que el divisor de la ronda.
 *  - La ficha del producto no pasa por aquí: ahí se ven todas las fotos, en
 *    su orden. Esto es solo la tarjeta del listado.
 */
/**
 * UNA FOTO QUE EL ORIGEN YA NO TIENE NO SE ENSEÑA (3 sep 2026). `fotos_rotas`
 * guarda las que el reloj intentó traer y se dieron por perdidas (404 del
 * origen, o muchos intentos seguidos). Se compara también la dirección: si
 * la sincronización trae una nueva, la foto vuelve sola. Va en la tarjeta,
 * en la galería y en el buscador — las tres puertas por donde sale una foto.
 */
const SIN_FOTOS_ROTAS = sql`NOT EXISTS (SELECT 1 FROM fotos_rotas fr WHERE fr.imagen_id = imagenes_producto.id AND fr.definitiva = 1 AND fr.url = imagenes_producto.url)`;

function fotoDeTurno(semilla: number) {
  const desplazamiento = sql.raw(String(Math.trunc(Math.abs(semilla)) || 0));
  const turno = sql`((ROW_NUMBER() OVER (ORDER BY ${imagenesProducto.orden}, imagenes_producto.rowid) + ${desplazamiento}) % COUNT(*) OVER ())`;
  const elegir = (columna: SQL) =>
    sql<
      string | null
    >`(SELECT ${columna} FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} AND ${SIN_FOTOS_ROTAS} ORDER BY ${turno} LIMIT 1)`;
  return {
    url: elegir(sql`${imagenesProducto.url}`),
    clave: elegir(sql`${imagenesProducto.clave}`),
    alt: elegir(sql`${imagenesProducto.textoAltEs}`),
  };
}

/**
 * La semilla de las páginas que NO traen una por visita (el catálogo por
 * categoría, los similares): cambia una vez al día, así la foto de turno es
 * estable entre una página y la siguiente del mismo listado.
 */
function semillaDelDia(): number {
  return (Math.floor(Date.now() / 86_400_000) % 99_999) + 1;
}

export async function listarProductos(
  mercado: Mercado,
  filtros: FiltrosCatalogo = {},
) {
  const db = getDb();
  const foto = fotoDeTurno(semillaDelDia());
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(60, Math.max(6, filtros.porPagina ?? 24));

  const condiciones: SQL[] = [visibleAqui(mercado)];

  /**
   * El slug puede ser un DEPARTAMENTO de Mercatren o una categoria del propio
   * comercio, y desde fuera no se distinguen: los dos llegan igual en la
   * direccion. Se acepta cualquiera de los dos.
   *
   * Si es departamento hay que traer tambien lo que cuelga de el. Los
   * productos de Bley estan en "PVC" y "Hierro", que cuelgan de "Ferreteria y
   * construccion": buscando solo el departamento, quien lo toca veria cero
   * productos teniendo 622 debajo. Eso pasaba y por eso esta esta consulta.
   */
  if (filtros.categoria) {
    condiciones.push(
      sql`${productos.categoriaId} IN (
        SELECT c.id FROM categorias c WHERE c.slug = ${filtros.categoria}
        UNION
        SELECT h.id FROM categorias h
          JOIN categorias d ON d.id = h.padre_id
         WHERE d.slug = ${filtros.categoria} AND d.tienda_id IS NULL
      )`,
    );
  }
  if (filtros.comercio) {
    condiciones.push(eq(tiendas.slug, filtros.comercio));
  }
  if (filtros.zona?.length) {
    condiciones.push(enZona(filtros.zona));
  }

  // La busqueda usa el MISMO motor que el desplegable del encabezado
  // (src/lib/catalogo/buscar.ts): varias palabras en cualquier orden, sin
  // acentos, y ordenadas por que tan bien calzan.
  const { donde: filtroBusqueda, orden: ordenPorRelevancia } =
    condicionDeBusqueda(filtros.busqueda);
  if (filtroBusqueda) condiciones.push(filtroBusqueda);

  const donde = and(...condiciones);

  const orden =
    filtros.orden === "precio_asc"
      ? asc(productos.precioCentavos)
      : filtros.orden === "precio_desc"
        ? desc(productos.precioCentavos)
        : // Buscando, lo primero es lo que mejor calza; sin buscar, lo recién
          // llegado y después lo destacado. Ver la nota de parrillaDeProductos.
          (ordenPorRelevancia ??
          sql`CASE WHEN ${productos.creadoEn} > ${corteDeNovedad()} THEN 0 ELSE 1 END`);

  const [total] = await db
    .select({ n: count() })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
    .where(donde);

  const filas = await db
    .select({
      id: productos.id,
      slug: productos.slug,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
      precioCentavos: productos.precioCentavos,
      precioAntesCentavos: productos.precioAntesCentavos,
      moneda: productos.moneda,
      existencias: productos.existencias,
      controlaExistencias: productos.controlaExistencias,
      unidad: productos.unidad,
      marca: productos.marca,
      destacado: productos.destacado,
      creadoEn: productos.creadoEn,
      tiendaId: tiendas.id,
      tiendaNombre: tiendas.nombre,
      tiendaSlug: tiendas.slug,
      tiendaPais: tiendas.paisOrigen,
      fotoUrl: foto.url,
      fotoClave: foto.clave,
      fotoAlt: foto.alt,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
    .where(donde)
    .orderBy(orden, desc(productos.actualizadoEn))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);

  /* El catálogo también salía en bloque cuando no hay filtro de comercio. */
  const lista: ProductoLista[] = intercalarPorTienda(
    filas.map((f) => ({
      id: f.id,
      slug: f.slug,
      tituloEs: f.tituloEs,
      tituloEn: f.tituloEn,
      precioCentavos: f.precioCentavos,
      precioAntesCentavos: f.precioAntesCentavos,
      moneda: f.moneda,
      existencias: f.existencias,
      controlaExistencias: f.controlaExistencias,
      unidad: f.unidad,
      marca: f.marca,
      destacado: f.destacado,
      creadoEn: f.creadoEn,
      tiendaId: f.tiendaId,
      tiendaNombre: f.tiendaNombre,
      tiendaSlug: f.tiendaSlug,
      tiendaPais: f.tiendaPais,
      imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
      imagenAlt: f.fotoAlt,
    })),
    (p) => p.tiendaSlug,
  );

  return {
    productos: lista,
    total: Number(total?.n ?? 0),
    pagina,
    paginas: Math.max(1, Math.ceil(Number(total?.n ?? 0) / porPagina)),
  };
}

/** Un producto con todas sus fotos, para su ficha. */
export async function obtenerProductoPorSlug(mercado: Mercado, slug: string) {
  const db = getDb();

  const [fila] = await db
    .select({
      /**
       * LAS COLUMNAS SE NOMBRAN UNA POR UNA, nunca `productos` a secas.
       *
       * Pedir la tabla entera hace que Drizzle liste TODAS las columnas del
       * esquema, incluidas las recien agregadas. Y en YaDominios Cloud
       * `schema.sql` solo trae CREATE TABLE IF NOT EXISTS: una base que ya
       * existe NO recibe columnas nuevas. Resultado: el codigo pide una
       * columna que en produccion no esta y la pantalla revienta con 500.
       *
       * Paso de verdad el 5 ago 2026 con `precio_base_centavos` y
       * `deposito_id`: en local perfecto, en produccion ninguna ficha de
       * producto abria. Nombrando las columnas, agregar una al esquema no
       * puede volver a tumbar nada.
       */
      producto: {
        id: productos.id,
        tiendaId: productos.tiendaId,
        categoriaId: productos.categoriaId,
        slug: productos.slug,
        sku: productos.sku,
        marca: productos.marca,
        tituloEs: productos.tituloEs,
        tituloEn: productos.tituloEn,
        descripcionEs: productos.descripcionEs,
        descripcionEn: productos.descripcionEn,
        precioCentavos: productos.precioCentavos,
        precioAntesCentavos: productos.precioAntesCentavos,
        moneda: productos.moneda,
        existencias: productos.existencias,
        controlaExistencias: productos.controlaExistencias,
        unidad: productos.unidad,
        pesoGramos: productos.pesoGramos,
        estado: productos.estado,
        destacado: productos.destacado,
        fuenteId: productos.fuenteId,
        externoId: productos.externoId,
        sincronizadoEn: productos.sincronizadoEn,
        creadoEn: productos.creadoEn,
        actualizadoEn: productos.actualizadoEn,
        depositoId: productos.depositoId,
      },
      tiendaId: tiendas.id,
      tiendaNombre: tiendas.nombre,
      tiendaSlug: tiendas.slug,
      tiendaPais: tiendas.paisOrigen,
      /* Dónde está la TIENDA: el respaldo de «dónde se retira» cuando el
         producto no tiene depósito (misma regla que el filtro `enZona`). */
      tiendaCiudad: tiendas.ciudad,
      tiendaDireccion: tiendas.direccion,
      /* Dónde se retira: el dato que decide si la compra le sirve o no. */
      depositoNombre: depositos.nombre,
      depositoZona: depositos.zona,
      depositoQueGuarda: depositos.queGuarda,
      depositoDireccion: depositos.direccion,
      depositoComoLlegar: depositos.comoLlegar,
      categoriaNombreEs: categorias.nombreEs,
      categoriaNombreEn: categorias.nombreEn,
      categoriaSlug: categorias.slug,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
    .leftJoin(depositos, eq(depositos.id, productos.depositoId))
    .where(and(eq(productos.slug, slug), visibleAqui(mercado)))
    .limit(1);

  if (!fila) return null;

  const fotos = await db
    .select()
    .from(imagenesProducto)
    .where(
      and(eq(imagenesProducto.productoId, fila.producto.id), SIN_FOTOS_ROTAS),
    )
    .orderBy(asc(imagenesProducto.orden));

  return {
    ...fila,
    imagenes: fotos
      .map((f) => ({
        id: f.id,
        url: direccionImagen(f),
        altEs: f.textoAltEs,
        altEn: f.textoAltEn,
      }))
      .filter(
        (
          f,
        ): f is {
          id: string;
          url: string;
          altEs: string | null;
          altEn: string | null;
        } => Boolean(f.url),
      ),
  };
}

/** Categorias que de verdad tienen algo que mostrar. */
/**
 * LO QUE VA AL PIE DE LA FICHA: PRODUCTOS SIMILARES.
 *
 * Lo pidió el dueño: «no es posible que yo abra un producto y abajo no
 * aparezca un producto más que diga similares». Primero los de la MISMA
 * CATEGORÍA (de cualquier tienda), después los de la MISMA TIENDA, nunca el
 * propio producto, y lo más nuevo antes. Respeta el mercado y la zona igual
 * que el resto del catálogo: no hay un camino aparte que se pueda quedar
 * atrás.
 */
export async function productosSimilares(
  mercado: Mercado,
  de: { productoId: string; categoriaId: string | null; tiendaId: string },
  zona?: string[],
  limite = 10,
): Promise<ProductoLista[]> {
  const db = getDb();
  const foto = fotoDeTurno(semillaDelDia());

  const parecido = de.categoriaId
    ? or(
        eq(productos.categoriaId, de.categoriaId),
        eq(productos.tiendaId, de.tiendaId),
      )
    : eq(productos.tiendaId, de.tiendaId);

  const donde = and(
    visibleAqui(mercado),
    gt(productos.precioCentavos, 0),
    ne(productos.id, de.productoId),
    parecido,
    zona?.length ? enZona(zona) : undefined,
  );

  const filas = await db
    .select({
      id: productos.id,
      slug: productos.slug,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
      precioCentavos: productos.precioCentavos,
      precioAntesCentavos: productos.precioAntesCentavos,
      moneda: productos.moneda,
      existencias: productos.existencias,
      controlaExistencias: productos.controlaExistencias,
      unidad: productos.unidad,
      marca: productos.marca,
      destacado: productos.destacado,
      creadoEn: productos.creadoEn,
      tiendaId: tiendas.id,
      tiendaNombre: tiendas.nombre,
      tiendaSlug: tiendas.slug,
      tiendaPais: tiendas.paisOrigen,
      fotoUrl: foto.url,
      fotoClave: foto.clave,
      fotoAlt: foto.alt,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(donde)
    .orderBy(
      /* Misma categoría antes que misma tienda: lo parecido pesa más que lo
         vecino. Y dentro de cada grupo, lo más nuevo primero. */
      de.categoriaId
        ? sql`CASE WHEN ${productos.categoriaId} = ${de.categoriaId} THEN 0 ELSE 1 END`
        : sql`0`,
      desc(productos.creadoEn),
      productos.id,
    )
    .limit(Math.min(24, Math.max(1, limite)));

  return filas.map((f): ProductoLista => ({
    id: f.id,
    slug: f.slug,
    tituloEs: f.tituloEs,
    tituloEn: f.tituloEn,
    precioCentavos: f.precioCentavos,
    precioAntesCentavos: f.precioAntesCentavos,
    moneda: f.moneda,
    existencias: f.existencias,
    controlaExistencias: f.controlaExistencias,
    unidad: f.unidad,
    marca: f.marca,
    destacado: f.destacado,
    creadoEn: f.creadoEn,
    tiendaNombre: f.tiendaNombre,
    tiendaSlug: f.tiendaSlug,
    tiendaPais: f.tiendaPais,
    imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
    imagenAlt: f.fotoAlt,
  }));
}

export async function listarCategoriasConProductos(mercado: Mercado) {
  const db = getDb();

  const filas = await db
    .select({
      slug: categorias.slug,
      nombreEs: categorias.nombreEs,
      nombreEn: categorias.nombreEn,
      cuantos: count(productos.id),
    })
    .from(categorias)
    .innerJoin(productos, eq(productos.categoriaId, categorias.id))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(visibleAqui(mercado))
    .groupBy(categorias.slug, categorias.nombreEs, categorias.nombreEn)
    .orderBy(desc(count(productos.id)));

  return filas.map((f) => ({ ...f, cuantos: Number(f.cuantos) }));
}

/** Comercios con catalogo publicado. */
export async function listarComerciosDelCatalogo(mercado: Mercado) {
  const db = getDb();

  const filas = await db
    .select({
      slug: tiendas.slug,
      nombre: tiendas.nombre,
      cuantos: count(productos.id),
    })
    .from(tiendas)
    .innerJoin(productos, eq(productos.tiendaId, tiendas.id))
    .where(visibleAqui(mercado))
    .groupBy(
      tiendas.id,
      tiendas.slug,
      tiendas.nombre,
      tiendas.logoClave,
      tiendas.ciudad,
      tiendas.creadoEn,
    )
    .orderBy(desc(count(productos.id)));

  return filas.map((f) => ({ ...f, cuantos: Number(f.cuantos) }));
}

/* -------------------------------------------------------------------------- */
/* Lo que arma la portada                                                     */
/* -------------------------------------------------------------------------- */

/** Los productos de una fila de la portada. */
/**
 * Todo lo que necesita la portada, de una sola vez.
 *
 * Si la base no responde devuelve listas vacias y la portada lo maneja: antes
 * que tumbarla con un error 500, se muestra vacia.
 */
export async function obtenerPortada(
  mercado: Mercado,
  idioma = "es",
  semilla = 7919,
  zona?: string[],
) {
  /**
   * CADA CONSULTA SE CAE SOLA. Antes un tropiezo de CUALQUIERA de las cuatro
   * vaciaba la portada entera, y la página leía ese vacío como "en tu ciudad
   * no hay nada" y le plantaba al cliente el aviso de ciudad sin comercios —
   * pasó con Caracas teniendo 114 productos. Un error de la base no puede
   * disfrazarse de dato del negocio: por eso `fallo` viaja aparte y el aviso
   * solo puede salir cuando el cero es de verdad.
   *
   * La tira de departamentos y los comercios destacados son iguales para todo
   * el mundo y cambian poco: se recuerdan un minuto para no repetir esos
   * agregados en cada visita. Lo filtrado por zona se consulta siempre.
   */
  /* La llave de lo recordado LLEVA EL MERCADO: sin eso, el primero que
     entrara por mercatren.cl guardaria su lista vacia (o la llena de .com)
     y el otro dominio la serviria durante un minuto. */

  const [parrilla, departamentos, bandas, comercios] = await Promise.all([
    /* 48 y no 24: la portada enseña la primera tanda ARRIBA («De todas las
       tiendas») y la segunda abajo, donde arranca la parrilla infinita. */
    parrillaDeProductos(mercado, semilla, 1, 48, zona).catch((e) => {
      console.error("[portada] la parrilla no respondio:", e);
      return null;
    }),
    // La tira de arriba enseña TODOS los departamentos del servicio, con o
    // sin zona: es el cartel de "esto se puede vender aquí", no el filtro.
    recordado(`portada-departamentos-${mercado.codigo}-${idioma}`, 60_000, () =>
      listarDepartamentosDePortada(mercado, idioma),
    ).catch(() => []),
    bandasDeDepartamentos(mercado, idioma, 6, 21, zona, semilla).catch(
      () => [],
    ),
    recordado(`portada-comercios-${mercado.codigo}`, 60_000, () =>
      listarComerciosDestacados(mercado),
    ).catch(() => []),
  ]);

  return {
    parrilla: parrilla ?? { productos: [], total: 0, pagina: 1, paginas: 1 },
    departamentos,
    bandas,
    comercios,
    /** La parrilla FALLÓ (distinto de "salió vacía"): con esto la portada
        sabe que no debe acusar a la ciudad de no tener comercios. */
    fallo: parrilla === null,
  };
}

/**
 * TODOS los comercios activos, para la portada y el listado de tiendas.
 *
 * ══ SALEN TAMBIÉN LOS QUE NO TIENEN NI UN PRODUCTO (9 ago 2026) ══
 *
 * Antes esto llevaba un `innerJoin` contra productos, y un join así se come
 * silenciosamente a toda tienda con el catálogo vacío. Sonaba razonable —para
 * qué enseñarle a un comprador una tienda sin nada— y en la práctica hacía
 * daño:
 *
 * **El comerciante entra a `/tiendas` a ver la suya.** Va a mirar cómo quedó,
 * si el logo se ve, si los datos salieron bien, si el botón de contacto está.
 * Y no la encontraba. Pasó con MEGAYES, que llevaba tres días sin aparecer, y
 * con la tienda que se creó hoy. Desde fuera se lee como que el sistema no
 * funciona, y quien acaba de abrir su tienda es justo el que menos margen
 * tiene para dudar.
 *
 * Al comprador no le cuesta nada: **la tarjeta dice cuántos productos hay**
 * antes de entrar. Nadie pierde el clic — y una tienda vacía con nombre y
 * ciudad reales es, de hecho, una señal de que el sitio tiene comercios
 * llegando.
 *
 * Se ordena por catálogo, así que las vacías quedan al final solas.
 *
 * OJO: el mapa del sitio SÍ las deja fuera hasta que publiquen algo, y no es
 * una contradicción — esa lista es para Google, y mandarlo a una página sin
 * contenido cuenta en contra. Son dos públicos distintos.
 */
export async function listarComerciosDestacados(mercado: Mercado) {
  const db = getDb();

  const filas = await db
    .select({
      slug: tiendas.slug,
      nombre: tiendas.nombre,
      descripcionEs: tiendas.descripcionEs,
      descripcionEn: tiendas.descripcionEn,
      paisOrigen: tiendas.paisOrigen,
      logoClave: tiendas.logoClave,
      ciudad: tiendas.ciudad,
      creadoEn: tiendas.creadoEn,
      cuantos: count(productos.id),
    })
    .from(tiendas)
    /**
     * `leftJoin`, no `innerJoin`: con el inner, una tienda sin productos
     * desaparece de la lista sin que nadie se entere.
     *
     * Y LA CONDICIÓN DEL PRODUCTO VA AQUÍ, EN EL ENGANCHE, NO EN EL `where`.
     * Esto cuesta media hora de no entender nada: en una tienda vacía el
     * estado del producto es NULO, así que un `where` que exija
     * `estado = 'publicado'` la descarta igual — y el `leftJoin` vuelve a
     * comportarse como un `innerJoin`, en silencio y con el código pareciendo
     * correcto. Pasó justo así al arreglar esto.
     */
    .leftJoin(
      productos,
      and(
        eq(productos.tiendaId, tiendas.id),
        eq(productos.estado, "publicado"),
      ),
    )
    // En el filtro se queda SOLO lo que es de la tienda.
    .where(tiendaVisibleEn(mercado))
    .groupBy(tiendas.id, tiendas.slug, tiendas.nombre)
    /* LA MAYORISTA VA PRIMERA (30 ago 2026, pedido del dueño): es la tienda
       con prioridad de la casa y el directorio la enseña de entrada. El
       resto sigue por tamaño de catálogo, como siempre. */
    .orderBy(
      sql`CASE WHEN ${tiendas.slug} = 'us-mayorista' THEN 0 ELSE 1 END`,
      desc(count(productos.id)),
    );

  return filas.map((f) => ({ ...f, cuantos: Number(f.cuantos) }));
}

/** La tienda de un comercio: sus datos y sus productos. */
export async function obtenerTiendaPorSlug(
  mercado: Mercado,
  slug: string,
  pagina = 1,
  /**
   * SOLO SE PIDEN LAS NO PÚBLICAS CUANDO HAY ALGUIEN CON SESIÓN MIRANDO.
   *
   * Por defecto va **false**, así que para un visitante esta consulta es
   * exactamente la de siempre, con su `estado = 'activa'`. Se hizo así después
   * de que quitar el filtro para todos dejara caída la ficha de un comercio en
   * producción: el camino del público no puede depender de código nuevo.
   */
  incluirNoPublicas = false,
) {
  const db = getDb();

  const [tienda] = await db
    .select({
      id: tiendas.id,
      slug: tiendas.slug,
      /**
       * SE TRAE EL ESTADO Y **NO** SE FILTRA POR ÉL AQUÍ.
       *
       * Filtrarlo en la consulta era lo que le daba un 404 al comercio sobre su
       * PROPIA tienda recién creada, que nace en `pendiente`. Quién puede verla
       * lo decide `puedeVerLaFicha` en la pantalla, que sabe quién está
       * mirando; esta función solo trae los datos.
       *
       * La pantalla sigue devolviendo 404 a un visitante: eso no cambió.
       */
      estado: tiendas.estado,
      nombre: tiendas.nombre,
      descripcionEs: tiendas.descripcionEs,
      descripcionEn: tiendas.descripcionEn,
      paisOrigen: tiendas.paisOrigen,
      logoClave: tiendas.logoClave,
      portadaClave: tiendas.portadaClave,
      creadoEn: tiendas.creadoEn,
      // La ficha de la empresa, tal como la lleno el comercio. Lo que este
      // vacio no se muestra: mejor una ficha corta que una con huecos.
      razonSocial: tiendas.razonSocial,
      identificacionFiscal: tiendas.identificacionFiscal,
      correoContacto: tiendas.correoContacto,
      telefono: tiendas.telefono,
      direccion: tiendas.direccion,
      ciudad: tiendas.ciudad,
      sitioWeb: tiendas.sitioWeb,
      horario: tiendas.horario,
    })
    .from(tiendas)
    .where(
      /* El publico solo ve las fichas de SU mercado: una tienda de
         mercatren.com no existe en mercatren.cl (404, como cualquier slug
         inventado). El dueño y el equipo (incluirNoPublicas) la ven desde
         cualquier dominio: su panel vive en el principal. */
      incluirNoPublicas
        ? eq(tiendas.slug, slug)
        : and(eq(tiendas.slug, slug), tiendaVisibleEn(mercado)),
    )
    .limit(1);

  if (!tienda) return null;

  const listado = await listarProductos(mercado, { comercio: slug, pagina });

  return { tienda, ...listado };
}

/**
 * LOS DEPARTAMENTOS PARA LA PORTADA.
 *
 * Salen SIEMPRE los 22, tengan productos o no. Un departamento vacío no es un
 * hueco: es el cartel que le dice a quien llega "aquí se pueden vender motos".
 * Esconderlos hasta que alguien venda motos es esperar a que aparezca solo el
 * vendedor que no sabe que puede vender aquí.
 *
 * NO SE TRAE NINGUNA FOTO: el círculo lleva siempre el icono. La imagen de un
 * departamento de Mercatren no puede depender de qué producto subió un cliente
 * ese día — esa parte del sitio es nuestra.
 *
 * Se cuenta el departamento Y sus subcategorías: los productos de Bley cuelgan
 * de "PVC" y "Hierro", que a su vez cuelgan de "Ferretería y construcción".
 * Contando solo el departamento saldría en cero teniendo 622 productos debajo.
 */
export type DepartamentoDePortada = {
  slug: string;
  nombre: string;
  icono: string;
  cuantos: number;
};

/**
 * LOS DEPARTAMENTOS PARA LA PORTADA.
 *
 * Salen SIEMPRE los 22, tengan productos o no. Un departamento vacío no es un
 * hueco: es el cartel que le dice a quien llega "aquí se pueden vender motos".
 * Esconderlos hasta que alguien venda motos es esperar a que aparezca solo el
 * vendedor que no sabe que puede vender aquí.
 *
 * NO SE TRAE NINGUNA FOTO: el círculo lleva siempre el icono. La imagen de un
 * departamento de Mercatren no puede depender de qué producto subió un cliente
 * ese día — esa parte del sitio es nuestra.
 *
 * Se cuenta el departamento Y sus subcategorías: los productos de Bley cuelgan
 * de "PVC" y "Hierro", que a su vez cuelgan de "Ferretería y construcción".
 * Contando solo el departamento saldría en cero teniendo 622 productos debajo.
 */

export async function listarDepartamentosDePortada(
  mercado: Mercado,
  idioma: string,
  zona?: string[],
): Promise<DepartamentoDePortada[]> {
  const db = getDb();

  /**
   * "Los productos de este departamento" = los que cuelgan de él directamente
   * MÁS los que cuelgan de una subcategoría suya. Los de Bley están en "PVC" y
   * "Hierro", que cuelgan de "Ferretería y construcción": contando solo el
   * departamento saldría en cero teniendo 622 productos debajo.
   *
   * Con zona elegida, los conteos también se acotan a lo que se retira ahí:
   * un departamento que en Caracas está vacío no puede bajar como banda
   * llena de mercancía de otra ciudad.
   */
  // Mismo criterio que enZona, incluido el respaldo de la ciudad de la
  // tienda para productos sin depósito. `t` es el alias de tiendas de la
  // consulta de abajo.
  const FILTRO_ZONA = zona?.length
    ? sql`AND (
        p.deposito_id IN (
          SELECT dz.id FROM depositos dz
           WHERE dz.activo = 1
             AND dz.zona IN (${sql.join(
               zona.map((c) => sql`${c}`),
               sql`, `,
             )})
        )
        OR (
          p.deposito_id IS NULL
          AND LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(t.ciudad), 'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u')) IN (${sql.join(
            zona
              .map((c) => zonaPorSlug(c)?.nombre)
              .filter((n): n is string => Boolean(n))
              .map((n) => sql`${normalizarCiudad(n)}`),
            sql`, `,
          )})
        )
      )`
    : sql``;

  const DEL_DEPARTAMENTO = sql`
    p.estado = 'publicado'
    AND t.estado = 'activa'
    AND t.mercado = ${mercado.codigo}
    AND (
      p.categoria_id = d.id
      OR p.categoria_id IN (
        SELECT h.id FROM categorias h WHERE h.padre_id = d.id
      )
    )
    ${FILTRO_ZONA}
  `;

  const filas = await db.all<{ slug: string; cuantos: number }>(sql`
    SELECT
      d.slug AS slug,
      (SELECT COUNT(*)
         FROM productos p
         JOIN tiendas t ON t.id = p.tienda_id
        WHERE ${DEL_DEPARTAMENTO}) AS cuantos
    FROM categorias d
    WHERE d.tienda_id IS NULL
  `);

  const porSlug = new Map(filas.map((f) => [f.slug, f]));

  // El orden y los nombres salen del código, no de la base: la lista es
  // nuestra y así no depende de que la siembra haya corrido.
  return DEPARTAMENTOS.map((d) => {
    const fila = porSlug.get(d.slug);
    return {
      slug: d.slug,
      nombre: nombreDepartamento(d, idioma),
      icono: d.icono,
      cuantos: Number(fila?.cuantos ?? 0),
    };
  });
}

/**
 * EL ORDEN DE LA PORTADA: RONDAS POR VENDEDOR, VENEZUELA PRIMERO, CJ CON CUPO.
 *
 * Lo que vio el dueño el 23 ago 2026, con sus palabras: «sale primero el
 * bloque de Bley completo, y ahí viene todo lo de CJ, y el resto de productos
 * como que no existen». Tenía razón, y la causa eran dos cosas:
 *
 *  1. Las rondas del 22 ago contaban a cada tienda `us-<rubro>` como una tienda
 *     más. Son veintitrés. Una ronda eran 46 productos de CJ antes de que
 *     MAXIUM (una sola lámina de zinc, mayorista) enseñara nada.
 *  2. Dentro de la ronda iban primero «las tiendas con novedades», y la
 *     ferretería SIEMPRE tiene novedades (sincroniza todos los días): la
 *     tienda de Tucaní con dos productos nunca iba delante.
 *
 * La regla nueva, que es la que pidió: «esas tiendas son chiquitas, sácalas de
 * primero a todos; ¿que tiene un solo producto? no importa, sácalo de primero;
 * eso de CJ debe salir variadito, unos cinco, seis productos».
 *
 *  - Cada producto tiene un PUESTO dentro de su FAMILIA (`familiaDe`): un
 *    comercio venezolano es su propia familia y va del más nuevo al más viejo;
 *    todo lo de Estados Unidos es UNA familia, «us», barajada con la semilla
 *    (es de la casa y lo que importa ahí es la variedad).
 *  - La RONDA = puesto / cupo. El cupo es PRODUCTOS_POR_RONDA (2) por comercio
 *    venezolano y CJ_POR_RONDA (6) para toda la familia «us». Ronda 0 = los dos
 *    más nuevos de CADA comercio de Venezuela + seis de CJ.
 *  - Dentro de la ronda, VENEZUELA PRIMERO: esas tiendas son las que están en
 *    la calle, con dirección y mostrador; CJ lo surte un proveedor.
 *  - Y las tiendas se BARAJAN con la semilla de la visita —un puesto fijo
 *    «mata la gracia», ya lo dijo el dueño una vez—, así que una vez abre
 *    MAXIUM, otra vez MEGAYES, y siempre todas en la primera pantalla.
 *
 * LO QUE SE QUITÓ A PROPÓSITO: la ventaja entre tiendas por «tener novedades».
 * Lo nuevo de cada comercio sigue yendo primero DENTRO de su tienda (ronda 0
 * son sus dos más nuevos), que es lo que hace que «cada vez que un cliente
 * sube un producto salga entre los primeros»; lo que ya no pasa es que una
 * tienda que sincroniza a diario tape a las que no.
 *
 * Se usa en la parrilla Y en las bandas de departamento: la misma regla en
 * los dos sitios, o la portada se contradice sola. `tiendas.rowid` y
 * `productos.rowid` van a mano (Drizzle no conoce la columna interna). Los
 * cupos van como literales (`sql.raw`): un parámetro numérico puede llegar
 * como REAL y la división dejaría de ser entera.
 */
function ordenPorRondas(semilla: number): SQL[] {
  const esUs = sql`UPPER(TRIM(COALESCE(${tiendas.paisOrigen}, ''))) = 'US'`;
  const familia = sql`CASE WHEN ${esUs} THEN 'us' ELSE ${productos.tiendaId} END`;
  const puesto = sql`ROW_NUMBER() OVER (PARTITION BY ${familia} ORDER BY CASE WHEN ${esUs} THEN (productos.rowid * ${semilla}) % 104729 ELSE 0 END, ${productos.creadoEn} DESC, productos.rowid DESC)`;
  const cupo = sql`CASE WHEN ${esUs} THEN ${sql.raw(String(CJ_POR_RONDA))} ELSE ${sql.raw(String(PRODUCTOS_POR_RONDA))} END`;
  return [
    /* la ronda */
    sql`((${puesto} - 1) / ${cupo})`,
    /* dentro de la ronda, Venezuela primero */
    sql`CASE WHEN ${esUs} THEN 1 ELSE 0 END`,
    /* las tiendas barajadas con la semilla de la visita */
    sql`(tiendas.rowid * ${semilla}) % 104729`,
    sql`${productos.tiendaId}`,
    desc(productos.creadoEn),
    sql`${productos.id}`,
  ];
}

/**
 * LA PARRILLA DE LA PORTADA: todos los productos, barajados, por tandas.
 *
 * POR QUÉ NO `ORDER BY RANDOM()` AQUÍ. Barajar de nuevo en cada tanda haría
 * que la página 2 repitiera productos de la página 1 y se saltara otros: al
 * bajar, el cliente vería el mismo taladro tres veces. Hace falta un orden
 * que sea distinto en cada visita pero ESTABLE dentro de la visita.
 *
 * La solución es una semilla: se genera una vez al entrar y se arrastra en
 * todas las tandas. `(rowid * semilla) % primo` reparte las filas de una
 * forma que parece azar y siempre da el mismo resultado con la misma semilla.
 * Barato y sin tablas de más.
 */
export async function parrillaDeProductos(
  mercado: Mercado,
  semilla: number,
  pagina = 1,
  porPagina = 24,
  zona?: string[],
) {
  /**
   * LA PRIMERA TANDA SE RECUERDA UN MINUTO (24 ago 2026).
   *
   * Es la que abre la portada —la que pagaba TODO el mundo— y la consulta
   * lleva funciones de ventana sobre el catálogo entero. Se guarda con el
   * orden del DÍA (semilla estable) y se ROTA EN MEMORIA con la semilla de la
   * visita, así la portada sigue moviéndose entre visitas sin volver a
   * consultar. Las páginas siguientes (la parrilla infinita) no se recuerdan:
   * las pide poca gente y con su propia semilla.
   *
   * La llave lleva el mercado y la ciudad, como manda `muro-cache`.
   */
  if (pagina === 1) {
    const base = await recordadoEnElBorde(
      `portada-parrilla-${mercado.codigo}-${(zona ?? []).join(",")}-${porPagina}`,
      60_000,
      () => parrillaSinCache(mercado, semillaDelDia(), 1, porPagina, zona),
    );
    return { ...base, productos: rotarComienzo(base.productos, semilla) };
  }
  return parrillaSinCache(mercado, semilla, pagina, porPagina, zona);
}

/**
 * Mueve el COMIENZO de la lista sin tocar su patrón.
 *
 * La lista ya viene intercalada (nunca más de dos de la misma familia
 * seguidos), y ese patrón es cíclico: rotándola en bloques del tamaño de una
 * ronda, una visita abre con una tienda y otra con otra, y el intercalado
 * sigue intacto.
 *
 * **NO se puede reordenar por familia**: agruparía todos los productos de cada
 * tienda uno detrás de otro, que es exactamente el problema que las rondas
 * vinieron a arreglar. (Lo escribí así primero y lo destapó la propia
 * medición.)
 */
function rotarComienzo(
  productos: ProductoLista[],
  semilla: number,
): ProductoLista[] {
  if (productos.length < 3) return productos;
  const bloques = Math.floor(productos.length / PRODUCTOS_POR_RONDA);
  if (bloques < 2) return productos;
  const giro = (Math.abs(Math.trunc(semilla)) % bloques) * PRODUCTOS_POR_RONDA;
  if (giro === 0) return productos;
  return [...productos.slice(giro), ...productos.slice(0, giro)];
}

async function parrillaSinCache(
  mercado: Mercado,
  semilla: number,
  pagina: number,
  porPagina: number,
  zona?: string[],
) {
  const db = getDb();
  const foto = fotoDeTurno(semilla);

  const visible = visibleAqui(mercado);
  const donde = zona?.length
    ? and(visible, gt(productos.precioCentavos, 0), enZona(zona))
    : and(visible, gt(productos.precioCentavos, 0));

  const filas = await db
    .select({
      id: productos.id,
      slug: productos.slug,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
      precioCentavos: productos.precioCentavos,
      precioAntesCentavos: productos.precioAntesCentavos,
      moneda: productos.moneda,
      existencias: productos.existencias,
      controlaExistencias: productos.controlaExistencias,
      unidad: productos.unidad,
      marca: productos.marca,
      destacado: productos.destacado,
      creadoEn: productos.creadoEn,
      tiendaId: tiendas.id,
      tiendaNombre: tiendas.nombre,
      tiendaSlug: tiendas.slug,
      tiendaPais: tiendas.paisOrigen,
      fotoUrl: foto.url,
      fotoClave: foto.clave,
      fotoAlt: foto.alt,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(donde)
    /**
     * 104729 es primo: con un primo el reparto no cae en ciclos cortos y no
     * se agrupan los productos de la misma tienda.
     *
     * `rowid` es la columna interna de SQLite y Drizzle no la conoce, asi que
     * va escrita a mano. Se cualifica con el nombre de la tabla porque hay un
     * JOIN y sin eso seria ambigua.
     */
    /**
     * LOS RECIÉN LLEGADOS LLEVAN VENTAJA, PERO SIGUEN BARAJÁNDOSE.
     *
     * La primera versión los clavaba de primeros con un CASE 0/1, y el dueño
     * lo notó a la primera: "le doy actualizar y se quedan en el mismo
     * sitio, ya no se mueven". Tenía razón — un puesto fijo mata la gracia
     * del barajado.
     *
     * Ahora el producto nuevo juega la MISMA lotería que los demás, pero su
     * número sale de un rango diez veces más chico: casi siempre cae en las
     * primeras filas, y en una posición DISTINTA en cada visita. Un viejo
     * con mucha suerte todavía puede colarse antes — y eso es bueno: se ve
     * vivo, no acomodado.
     *
     * El corte de novedad se calcula al vuelo, sin columna ni cron: a los
     * siete días la ventaja se apaga sola.
     */
    /**
     * RONDAS POR TIENDA (22 ago 2026): LOS 2 MÁS NUEVOS DE CADA TIENDA, LUEGO
     * LOS 2 SIGUIENTES, Y ASÍ.
     *
     * El barajado anterior (semilla + ventaja a lo recién llegado) era justo
     * como mecánica, pero ciego a la PROPORCIÓN: la ferretería tiene 622
     * productos recientes contra 78 de nuestras tiendas, así que «lo nuevo»
     * era 90 % ferretería y la portada arrancaba con veintidós de la misma
     * tienda seguidos. El intercalado posterior (tope de dos seguidos) no
     * puede arreglar proporciones: solo separa lo que ya vino amontonado.
     *
     * Lo que pidió el dueño es otro algoritmo: «de cada tienda dos, tres
     * productos, revueltos, y las que están subiendo productos nuevos,
     * primero». Eso se hace EN LA CONSULTA, con funciones de ventana:
     *
     *   1. `ronda`: el puesto de cada producto dentro de su tienda, del más
     *      nuevo al más viejo, en bloques de PRODUCTOS_POR_RONDA. Ronda 0 son
     *      los dos más nuevos de CADA tienda; ronda 1 los dos siguientes…
     *      Así la primera pantalla enseña muchas tiendas, no una.
     *   2. Dentro de la ronda, primero las tiendas con NOVEDADES (algún
     *      producto de los últimos días): subir productos te pone delante.
     *   3. Y después, las tiendas se BARAJAN con la semilla de la visita —
     *      el dueño ya dijo una vez que un puesto fijo «mata la gracia»—,
     *      así que el orden de tiendas cambia entre visitas y es estable
     *      dentro de una (la parrilla infinita pide más con la misma
     *      semilla).
     *
     * `tiendas.rowid` y `productos.rowid` van escritos a mano: Drizzle no
     * conoce la columna interna de SQLite, y con el JOIN hay que cualificar.
     * El divisor va como literal (`sql.raw`), no como parámetro: un parámetro
     * numérico puede llegar como REAL y la división dejaría de ser entera.
     */
    /* RONDAS POR VENDEDOR (23 ago 2026): ver `ordenPorRondas`. */
    .orderBy(...ordenPorRondas(semilla))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);

  const [conteo] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(donde);

  const total = Number(conteo?.n ?? 0);

  return {
    /* SE INTERCALA DESPUÉS DE CONSULTAR, no en el SQL: el orden que llega ya
       trae la semilla y la ventaja de lo recién llegado, y eso no se rehace —
       solo se separa lo que quedó amontonado. Ver `catalogo/intercalar.ts`. */
    productos: intercalarPorTienda(
      filas.map((f): ProductoLista => ({
        id: f.id,
        slug: f.slug,
        tituloEs: f.tituloEs,
        tituloEn: f.tituloEn,
        precioCentavos: f.precioCentavos,
        precioAntesCentavos: f.precioAntesCentavos,
        moneda: f.moneda,
        existencias: f.existencias,
        controlaExistencias: f.controlaExistencias,
        unidad: f.unidad,
        marca: f.marca,
        destacado: f.destacado,
        creadoEn: f.creadoEn,
        tiendaNombre: f.tiendaNombre,
        tiendaSlug: f.tiendaSlug,
        tiendaPais: f.tiendaPais,
        imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
        imagenAlt: f.fotoAlt,
      })),
      /* Por FAMILIA, no por tienda: seis de CJ seguidos son seis tiendas
         distintas para el intercalado por tienda, y el dueño los ve como un
         bloque. Con la familia se reparten entre los comercios venezolanos. */
      familiaDe,
    ),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

/**
 * LAS BANDAS DE LA PORTADA: un departamento, sus productos, el siguiente.
 *
 * Es como baja Amazon: en vez de una parrilla plana de seiscientas cosas
 * sueltas, el cliente va pasando por "ferretería", "repuestos", "motos", y en
 * cada tramo entiende dónde está. Una parrilla plana se lee como un depósito;
 * las bandas se leen como una tienda por departamentos, que es lo que somos.
 *
 * SOLO BAJAN LOS QUE TIENEN PRODUCTOS. Un departamento vacío con un título y
 * nada debajo parece un error. Los vacíos se quedan arriba en la tira, que es
 * donde sí sirven: ahí son el cartel que dice "aquí se pueden vender motos".
 *
 * Van ordenados por cantidad: primero el que más tiene, que es el que más
 * probabilidad tiene de enganchar a quien acaba de entrar.
 */
export type BandaDeDepartamento = {
  slug: string;
  nombre: string;
  cuantos: number;
  productos: ProductoLista[];
};

export async function bandasDeDepartamentos(
  mercado: Mercado,
  idioma: string,
  cuantasBandas = 6,
  porBanda = 21,
  zona?: string[],
  semilla: number = semillaDelDia(),
): Promise<BandaDeDepartamento[]> {
  /**
   * SE RECUERDAN UN MINUTO (24 ago 2026). Son SEIS consultas con funciones de
   * ventana, y el resultado es el mismo para todo el que entre desde la misma
   * ciudad en ese minuto: la portada tardaba dos segundos en producción y esto
   * es la mitad del trabajo. La llave lleva el MERCADO (regla del proyecto: un
   * dominio no puede servir el catálogo de otro), el idioma y la ciudad.
   *
   * La semilla NO entra en la llave a propósito: cambia en cada visita y haría
   * que no se recordara nunca. Lo que se mueve entre visitas es el orden de la
   * parrilla de abajo, que sí la usa.
   */
  return recordadoEnElBorde(
    `portada-bandas-${mercado.codigo}-${idioma}-${(zona ?? []).join(",")}-${cuantasBandas}x${porBanda}`,
    60_000,
    () =>
      bandasSinCache(mercado, idioma, cuantasBandas, porBanda, zona, semilla),
  );
}

async function bandasSinCache(
  mercado: Mercado,
  idioma: string,
  cuantasBandas: number,
  porBanda: number,
  zona: string[] | undefined,
  semilla: number,
): Promise<BandaDeDepartamento[]> {
  const conProductos = (
    await listarDepartamentosDePortada(mercado, idioma, zona)
  )
    .filter((d) => d.cuantos > 0)
    .sort((a, b) => b.cuantos - a.cuantos)
    .slice(0, cuantasBandas);

  if (conProductos.length === 0) return [];

  const db = getDb();
  const foto = fotoDeTurno(semilla);
  const visible = visibleAqui(mercado);

  return Promise.all(
    conProductos.map(async (d) => {
      const filas = await db
        .select({
          id: productos.id,
          slug: productos.slug,
          tituloEs: productos.tituloEs,
          tituloEn: productos.tituloEn,
          precioCentavos: productos.precioCentavos,
          precioAntesCentavos: productos.precioAntesCentavos,
          moneda: productos.moneda,
          existencias: productos.existencias,
          controlaExistencias: productos.controlaExistencias,
          unidad: productos.unidad,
          marca: productos.marca,
          destacado: productos.destacado,
          creadoEn: productos.creadoEn,
          tiendaNombre: tiendas.nombre,
          tiendaSlug: tiendas.slug,
          tiendaPais: tiendas.paisOrigen,
          fotoUrl: foto.url,
          fotoClave: foto.clave,
          fotoAlt: foto.alt,
        })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .where(
          and(
            visible,
            gt(productos.precioCentavos, 0),
            ...(zona?.length ? [enZona(zona)] : []),
            sql`${productos.categoriaId} IN (
              SELECT c.id FROM categorias c
               WHERE c.slug = ${d.slug} AND c.tienda_id IS NULL
              UNION
              SELECT h.id FROM categorias h
                JOIN categorias p ON p.id = h.padre_id
               WHERE p.slug = ${d.slug} AND p.tienda_id IS NULL
            )`,
          ),
        )
        /* EL MISMO ORDEN QUE LA PARRILLA (23 ago 2026). Antes cada banda
           barajaba con RANDOM() a secas, y en la de Ferretería la lámina de
           zinc de MAXIUM competía contra seiscientos productos de la
           ferretería: salía una vez de cada seiscientas. Con las rondas, la
           banda abre con los dos más nuevos de CADA comercio venezolano del
           departamento, después seis de CJ, y recién ahí el resto. */
        .orderBy(...ordenPorRondas(semilla))
        .limit(porBanda);

      return {
        slug: d.slug,
        nombre: d.nombre,
        cuantos: d.cuantos,
        /* Mismo intercalado que la parrilla: dentro de una banda también
           salían todos los de una tienda juntos. */
        productos: intercalarPorTienda(
          filas.map((f): ProductoLista => ({
            id: f.id,
            slug: f.slug,
            tituloEs: f.tituloEs,
            tituloEn: f.tituloEn,
            precioCentavos: f.precioCentavos,
            precioAntesCentavos: f.precioAntesCentavos,
            moneda: f.moneda,
            existencias: f.existencias,
            controlaExistencias: f.controlaExistencias,
            unidad: f.unidad,
            marca: f.marca,
            destacado: f.destacado,
            creadoEn: f.creadoEn,
            tiendaNombre: f.tiendaNombre,
            tiendaSlug: f.tiendaSlug,
            tiendaPais: f.tiendaPais,
            imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
            imagenAlt: f.fotoAlt,
          })),
          familiaDe,
        ),
      };
    }),
  );
}
