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
      },
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
 * Todo lo que necesita la portada, de una sola vez.
 *
 * Si la base no responde devuelve listas vacias y la portada lo maneja: antes
 * que tumbarla con un error 500, se muestra vacia.
 */
export async function obtenerPortada(idioma = "es", semilla = 7919) {
  const vacia = {
    parrilla: { productos: [], total: 0, pagina: 1, paginas: 1 },
    departamentos: [],
    bandas: [],
    comercios: [],
  };

  try {
    const [parrilla, departamentos, bandas, comercios] = await Promise.all([
      parrillaDeProductos(semilla, 1, 24),
      listarDepartamentosDePortada(idioma),
      bandasDeDepartamentos(idioma),
      listarComerciosDestacados(),
    ]);

    return { parrilla, departamentos, bandas, comercios };
  } catch (e) {
    console.error("[portada] la base no respondio; se muestra vacia:", e);
    return vacia;
  }
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
  semilla: number,
  pagina = 1,
  porPagina = 24,
) {
  const db = getDb();

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
    /**
     * 104729 es primo: con un primo el reparto no cae en ciclos cortos y no
     * se agrupan los productos de la misma tienda.
     *
     * `rowid` es la columna interna de SQLite y Drizzle no la conoce, asi que
     * va escrita a mano. Se cualifica con el nombre de la tabla porque hay un
     * JOIN y sin eso seria ambigua.
     */
    .orderBy(sql`((productos.rowid * ${semilla}) % 104729)`, productos.id)
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);

  const [conteo] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(and(VISIBLE, gt(productos.precioCentavos, 0)));

  const total = Number(conteo?.n ?? 0);

  return {
    productos: filas.map((f): ProductoLista => ({
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
    })),
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
  idioma: string,
  cuantasBandas = 6,
  porBanda = 21,
): Promise<BandaDeDepartamento[]> {
  const conProductos = (await listarDepartamentosDePortada(idioma))
    .filter((d) => d.cuantos > 0)
    .sort((a, b) => b.cuantos - a.cuantos)
    .slice(0, cuantasBandas);

  if (conProductos.length === 0) return [];

  const db = getDb();

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
        // Barajado: la banda enseña una muestra, no siempre los mismos 21.
        .orderBy(sql`RANDOM()`)
        .limit(porBanda);

      return {
        slug: d.slug,
        nombre: d.nombre,
        cuantos: d.cuantos,
        productos: filas.map((f): ProductoLista => ({
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
        })),
      };
    }),
  );
}
