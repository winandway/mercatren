import "server-only";

import { and, asc, count, desc, eq, gt, like, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  categorias,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";
import { RUTA_MEDIA } from "@/lib/rutas";

/**
 * Consultas del catalogo publico.
 *
 * Estas SI son abiertas: cualquiera puede ver la tienda sin cuenta. Por eso
 * aqui no se pide permiso, pero a cambio solo se devuelve lo que puede ver
 * cualquiera: productos PUBLICADOS de comercios ACTIVOS, y nada de datos
 * internos del comercio.
 */

const VISIBLE = and(
  eq(productos.estado, "publicado"),
  eq(tiendas.estado, "activa"),
);

export type OrdenCatalogo = "recientes" | "precio_asc" | "precio_desc";

export type FiltrosCatalogo = {
  busqueda?: string;
  categoria?: string;
  comercio?: string;
  orden?: OrdenCatalogo;
  pagina?: number;
  porPagina?: number;
};

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
  tiendaNombre: string;
  tiendaSlug: string;
  imagenUrl: string | null;
  imagenAlt: string | null;
};

/** La primera foto de cada producto, para las tarjetas del listado. */
const PRIMERA_FOTO = {
  url: sql<
    string | null
  >`(SELECT ${imagenesProducto.url} FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY ${imagenesProducto.orden} LIMIT 1)`,
  clave: sql<
    string | null
  >`(SELECT ${imagenesProducto.clave} FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY ${imagenesProducto.orden} LIMIT 1)`,
  alt: sql<
    string | null
  >`(SELECT ${imagenesProducto.textoAltEs} FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY ${imagenesProducto.orden} LIMIT 1)`,
};

export async function listarProductos(filtros: FiltrosCatalogo = {}) {
  const db = getDb();
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(60, Math.max(6, filtros.porPagina ?? 24));

  const condiciones = [VISIBLE];

  if (filtros.categoria) {
    condiciones.push(eq(categorias.slug, filtros.categoria));
  }
  if (filtros.comercio) {
    condiciones.push(eq(tiendas.slug, filtros.comercio));
  }

  const busqueda = filtros.busqueda?.trim();
  if (busqueda) {
    const patron = `%${busqueda.toLowerCase()}%`;
    condiciones.push(
      or(
        like(sql`LOWER(${productos.tituloEs})`, patron),
        like(sql`LOWER(${productos.tituloEn})`, patron),
        like(sql`LOWER(${productos.descripcionEs})`, patron),
        like(sql`LOWER(${productos.marca})`, patron),
        like(sql`LOWER(${productos.sku})`, patron),
      )!,
    );
  }

  const donde = and(...condiciones);

  const orden =
    filtros.orden === "precio_asc"
      ? asc(productos.precioCentavos)
      : filtros.orden === "precio_desc"
        ? desc(productos.precioCentavos)
        : desc(productos.destacado);

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
      tiendaNombre: tiendas.nombre,
      tiendaSlug: tiendas.slug,
      fotoUrl: PRIMERA_FOTO.url,
      fotoClave: PRIMERA_FOTO.clave,
      fotoAlt: PRIMERA_FOTO.alt,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
    .where(donde)
    .orderBy(orden, desc(productos.actualizadoEn))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);

  const lista: ProductoLista[] = filas.map((f) => ({
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
    tiendaNombre: f.tiendaNombre,
    tiendaSlug: f.tiendaSlug,
    imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
    imagenAlt: f.fotoAlt,
  }));

  return {
    productos: lista,
    total: Number(total?.n ?? 0),
    pagina,
    paginas: Math.max(1, Math.ceil(Number(total?.n ?? 0) / porPagina)),
  };
}

/** Un producto con todas sus fotos, para su ficha. */
export async function obtenerProductoPorSlug(slug: string) {
  const db = getDb();

  const [fila] = await db
    .select({
      producto: productos,
      tiendaNombre: tiendas.nombre,
      tiendaSlug: tiendas.slug,
      tiendaPais: tiendas.paisOrigen,
      categoriaNombreEs: categorias.nombreEs,
      categoriaNombreEn: categorias.nombreEn,
      categoriaSlug: categorias.slug,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(categorias, eq(categorias.id, productos.categoriaId))
    .where(and(eq(productos.slug, slug), VISIBLE))
    .limit(1);

  if (!fila) return null;

  const fotos = await db
    .select()
    .from(imagenesProducto)
    .where(eq(imagenesProducto.productoId, fila.producto.id))
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
export async function listarCategoriasConProductos() {
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
    .where(VISIBLE)
    .groupBy(categorias.slug, categorias.nombreEs, categorias.nombreEn)
    .orderBy(desc(count(productos.id)));

  return filas.map((f) => ({ ...f, cuantos: Number(f.cuantos) }));
}

/** Comercios con catalogo publicado. */
export async function listarComerciosDelCatalogo() {
  const db = getDb();

  const filas = await db
    .select({
      slug: tiendas.slug,
      nombre: tiendas.nombre,
      cuantos: count(productos.id),
    })
    .from(tiendas)
    .innerJoin(productos, eq(productos.tiendaId, tiendas.id))
    .where(VISIBLE)
    .groupBy(tiendas.slug, tiendas.nombre)
    .orderBy(desc(count(productos.id)));

  return filas.map((f) => ({ ...f, cuantos: Number(f.cuantos) }));
}

/* -------------------------------------------------------------------------- */
/* Lo que arma la portada                                                     */
/* -------------------------------------------------------------------------- */

/** Los productos de una fila de la portada. */
async function filaDeProductos(
  orden: "destacados" | "nuevos" | "baratos",
  limite = 12,
) {
  const db = getDb();

  const criterio =
    orden === "nuevos"
      ? desc(productos.creadoEn)
      : orden === "baratos"
        ? asc(productos.precioCentavos)
        : desc(productos.destacado);

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
      tiendaNombre: tiendas.nombre,
      tiendaSlug: tiendas.slug,
      fotoUrl: PRIMERA_FOTO.url,
      fotoClave: PRIMERA_FOTO.clave,
      fotoAlt: PRIMERA_FOTO.alt,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(and(VISIBLE, gt(productos.precioCentavos, 0)))
    .orderBy(criterio, desc(productos.actualizadoEn))
    .limit(limite);

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
    tiendaNombre: f.tiendaNombre,
    tiendaSlug: f.tiendaSlug,
    imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
    imagenAlt: f.fotoAlt,
  }));
}

/**
 * Todo lo que necesita la portada, de una sola vez.
 * Si el catalogo esta vacio devuelve listas vacias y la portada lo maneja.
 *
 * Tambien aguanta una base SIN TABLAS (un sitio recien publicado al que
 * todavia no se le aplicaron las migraciones): antes que tumbar la portada
 * con un error 500, se muestra vacia. El catalogo llega con las migraciones.
 */
export async function obtenerPortada() {
  try {
    const [destacados, nuevos, categorias, comercios] = await Promise.all([
      filaDeProductos("destacados"),
      filaDeProductos("nuevos"),
      listarCategoriasConImagen(),
      listarComerciosDestacados(),
    ]);

    return { destacados, nuevos, categorias, comercios };
  } catch (e) {
    console.error("[portada] la base no respondio; se muestra vacia:", e);
    return { destacados: [], nuevos: [], categorias: [], comercios: [] };
  }
}

/** Categorias con una foto de muestra, para los circulos de la portada. */
export async function listarCategoriasConImagen() {
  const db = getDb();

  const filas = await db
    .select({
      slug: categorias.slug,
      nombreEs: categorias.nombreEs,
      nombreEn: categorias.nombreEn,
      cuantos: count(productos.id),
      fotoUrl: sql<
        string | null
      >`(SELECT ${imagenesProducto.url} FROM ${imagenesProducto} JOIN ${productos} AS p2 ON p2.id = ${imagenesProducto.productoId} WHERE p2.categoria_id = ${categorias.id} AND p2.estado = 'publicado' LIMIT 1)`,
      fotoClave: sql<
        string | null
      >`(SELECT ${imagenesProducto.clave} FROM ${imagenesProducto} JOIN ${productos} AS p3 ON p3.id = ${imagenesProducto.productoId} WHERE p3.categoria_id = ${categorias.id} AND p3.estado = 'publicado' LIMIT 1)`,
    })
    .from(categorias)
    .innerJoin(productos, eq(productos.categoriaId, categorias.id))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(VISIBLE)
    .groupBy(
      categorias.id,
      categorias.slug,
      categorias.nombreEs,
      categorias.nombreEn,
    )
    .orderBy(desc(count(productos.id)));

  return filas.map((f) => ({
    slug: f.slug,
    nombreEs: f.nombreEs,
    nombreEn: f.nombreEn,
    cuantos: Number(f.cuantos),
    imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
  }));
}

/** Comercios con catalogo, para la portada y el listado de tiendas. */
export async function listarComerciosDestacados() {
  const db = getDb();

  const filas = await db
    .select({
      slug: tiendas.slug,
      nombre: tiendas.nombre,
      descripcionEs: tiendas.descripcionEs,
      descripcionEn: tiendas.descripcionEn,
      paisOrigen: tiendas.paisOrigen,
      cuantos: count(productos.id),
    })
    .from(tiendas)
    .innerJoin(productos, eq(productos.tiendaId, tiendas.id))
    .where(VISIBLE)
    .groupBy(tiendas.id, tiendas.slug, tiendas.nombre)
    .orderBy(desc(count(productos.id)));

  return filas.map((f) => ({ ...f, cuantos: Number(f.cuantos) }));
}

/** La tienda de un comercio: sus datos y sus productos. */
export async function obtenerTiendaPorSlug(slug: string, pagina = 1) {
  const db = getDb();

  const [tienda] = await db
    .select({
      id: tiendas.id,
      slug: tiendas.slug,
      nombre: tiendas.nombre,
      descripcionEs: tiendas.descripcionEs,
      descripcionEn: tiendas.descripcionEn,
      paisOrigen: tiendas.paisOrigen,
      logoClave: tiendas.logoClave,
      portadaClave: tiendas.portadaClave,
      creadoEn: tiendas.creadoEn,
    })
    .from(tiendas)
    .where(and(eq(tiendas.slug, slug), eq(tiendas.estado, "activa")))
    .limit(1);

  if (!tienda) return null;

  const listado = await listarProductos({ comercio: slug, pagina });

  return { tienda, ...listado };
}
