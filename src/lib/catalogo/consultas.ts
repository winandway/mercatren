import "server-only";

import { and, asc, count, desc, eq, gt, sql } from "drizzle-orm";

import {
  DEPARTAMENTOS,
  nombreDepartamento,
} from "@/lib/catalogo/departamentos";
import { getDb } from "@/lib/db";

import { condicionDeBusqueda } from "./buscar";
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
        : // Buscando, lo primero es lo que mejor calza; sin buscar, lo destacado.
          (ordenPorRelevancia ?? desc(productos.destacado));

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
/**
 * UNA FILA DE LA PORTADA.
 *
 * "azar" baraja de verdad, en la base, en cada visita. Con 622 productos y
 * dos filas fijas, quien entraba tres veces veía exactamente lo mismo tres
 * veces y se iba pensando que la tienda tenía veinte cosas. Barajando, la
 * portada se siente viva y el catálogo entero termina asomándose.
 *
 * ORDER BY RANDOM() sobre 622 filas no cuesta nada. El día que sean cien mil
 * habrá que cambiarlo por una muestra sobre un rango de ids — pero cambiarlo
 * antes de tiempo sería complicar el código por un problema que no existe.
 */
async function filaDeProductos(
  orden: "destacados" | "nuevos" | "baratos" | "azar" | "ofertas",
  limite = 12,
  departamento?: string,
) {
  const db = getDb();

  const criterio =
    orden === "nuevos"
      ? desc(productos.creadoEn)
      : orden === "baratos"
        ? asc(productos.precioCentavos)
        : orden === "azar"
          ? sql`RANDOM()`
          : orden === "ofertas"
            ? sql`RANDOM()`
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
    .where(
      and(
        VISIBLE,
        gt(productos.precioCentavos, 0),
        // Una oferta de verdad: solo si hay precio anterior y es mayor.
        orden === "ofertas"
          ? sql`${productos.precioAntesCentavos} > ${productos.precioCentavos}`
          : undefined,
        // Los de un departamento: los suyos y los de sus subcategorías.
        departamento
          ? sql`${productos.categoriaId} IN (
              SELECT c.id FROM categorias c
              WHERE c.slug = ${departamento} AND c.tienda_id IS NULL
              UNION ALL
              SELECT h.id FROM categorias h
              JOIN categorias d ON d.id = h.padre_id
              WHERE d.slug = ${departamento} AND d.tienda_id IS NULL
            )`
          : undefined,
      ),
    )
    // El desempate por azar también, si no las filas barajadas se repiten
    // entre sí cuando muchos productos comparten el mismo criterio.
    .orderBy(
      criterio,
      orden === "azar" || orden === "ofertas"
        ? sql`RANDOM()`
        : desc(productos.actualizadoEn),
    )
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
export async function obtenerPortada(idioma = "es") {
  const vacia = {
    descubre: [],
    destacados: [],
    nuevos: [],
    baratos: [],
    ofertas: [],
    departamentos: [],
    comercios: [],
  };

  try {
    const [
      descubre,
      destacados,
      nuevos,
      baratos,
      ofertas,
      departamentos,
      comercios,
    ] = await Promise.all([
      // La primera fila baraja: es la que decide si quien entra siente que
      // hay tienda o siente que ya lo vio todo.
      filaDeProductos("azar", 14),
      filaDeProductos("destacados", 14),
      filaDeProductos("nuevos", 14),
      filaDeProductos("baratos", 14),
      filaDeProductos("ofertas", 14),
      listarDepartamentosDePortada(idioma),
      listarComerciosDestacados(),
    ]);

    return {
      descubre,
      destacados,
      nuevos,
      baratos,
      ofertas,
      departamentos,
      comercios,
    };
  } catch (e) {
    console.error("[portada] la base no respondio; se muestra vacia:", e);
    return vacia;
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
    .where(and(eq(tiendas.slug, slug), eq(tiendas.estado, "activa")))
    .limit(1);

  if (!tienda) return null;

  const listado = await listarProductos({ comercio: slug, pagina });

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

export async function listarDepartamentosDePortada(
  idioma: string,
): Promise<DepartamentoDePortada[]> {
  const db = getDb();

  /**
   * "Los productos de este departamento" = los que cuelgan de él directamente
   * MÁS los que cuelgan de una subcategoría suya. Los de Bley están en "PVC" y
   * "Hierro", que cuelgan de "Ferretería y construcción": contando solo el
   * departamento saldría en cero teniendo 622 productos debajo.
   */
  const DEL_DEPARTAMENTO = sql`
    p.estado = 'publicado'
    AND t.estado = 'activa'
    AND (
      p.categoria_id = d.id
      OR p.categoria_id IN (
        SELECT h.id FROM categorias h WHERE h.padre_id = d.id
      )
    )
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
