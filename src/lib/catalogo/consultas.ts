import "server-only";

import { and, asc, count, desc, eq, gt, sql } from "drizzle-orm";

import {
  DEPARTAMENTOS,
  nombreDepartamento,
} from "@/lib/catalogo/departamentos";
import { recordado } from "@/lib/cachecito";
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
    creadoEn: f.creadoEn,
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
        depositoId: productos.depositoId,
      },
      tiendaNombre: tiendas.nombre,
      tiendaSlug: tiendas.slug,
      tiendaPais: tiendas.paisOrigen,
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
  const [parrilla, departamentos, bandas, comercios] = await Promise.all([
    parrillaDeProductos(semilla, 1, 24, zona).catch((e) => {
      console.error("[portada] la parrilla no respondio:", e);
      return null;
    }),
    // La tira de arriba enseña TODOS los departamentos del servicio, con o
    // sin zona: es el cartel de "esto se puede vender aquí", no el filtro.
    recordado(`portada-departamentos-${idioma}`, 60_000, () =>
      listarDepartamentosDePortada(idioma),
    ).catch(() => []),
    bandasDeDepartamentos(idioma, 6, 21, zona).catch(() => []),
    recordado("portada-comercios", 60_000, listarComerciosDestacados).catch(
      () => [],
    ),
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
      logoClave: tiendas.logoClave,
      ciudad: tiendas.ciudad,
      creadoEn: tiendas.creadoEn,
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
  zona?: string[],
) {
  const db = getDb();

  const donde = zona?.length
    ? and(VISIBLE, gt(productos.precioCentavos, 0), enZona(zona))
    : and(VISIBLE, gt(productos.precioCentavos, 0));

  const desdeCuandoEsNuevo = corteDeNovedad();

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
      fotoUrl: PRIMERA_FOTO.url,
      fotoClave: PRIMERA_FOTO.clave,
      fotoAlt: PRIMERA_FOTO.alt,
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
    .orderBy(
      sql`CASE WHEN ${productos.creadoEn} > ${desdeCuandoEsNuevo}
        THEN ((productos.rowid * ${semilla}) % 104729) / 10
        ELSE ((productos.rowid * ${semilla}) % 104729) END`,
      productos.id,
    )
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);

  const [conteo] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(donde);

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
      creadoEn: f.creadoEn,
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
  zona?: string[],
): Promise<BandaDeDepartamento[]> {
  const conProductos = (await listarDepartamentosDePortada(idioma, zona))
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
          creadoEn: productos.creadoEn,
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
        /* Los recién llegados llevan VENTAJA en el barajado, no puesto
           fijo: su número sale de un rango diez veces más chico, así que
           casi siempre caen en la primera fila pero en un sitio distinto en
           cada carga. Clavarlos de primeros se sentía congelado — el dueño
           lo notó refrescando. */
        .orderBy(
          sql`CASE WHEN ${productos.creadoEn} > ${corteDeNovedad()}
            THEN ABS(RANDOM()) % 100000
            ELSE ABS(RANDOM()) % 1000000 END`,
        )
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
          creadoEn: f.creadoEn,
          tiendaNombre: f.tiendaNombre,
          tiendaSlug: f.tiendaSlug,
          imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
          imagenAlt: f.fotoAlt,
        })),
      };
    }),
  );
}
