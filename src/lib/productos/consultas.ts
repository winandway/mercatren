import "server-only";

import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { condicionDeBusqueda } from "@/lib/catalogo/buscar";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { getDb } from "@/lib/db";
import {
  depositos,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";

/**
 * El catalogo visto desde el panel del comercio.
 *
 * A diferencia de las consultas publicas, aqui SI se ven los borradores y los
 * agotados: es la mesa de trabajo del comercio. Y a diferencia de las
 * publicas, aqui SIEMPRE se filtra por alcance: un vendedor ve lo suyo y nada
 * mas.
 */

/** La tienda que toca mirar, segun quien pregunta. */
async function tiendaDelAlcance(comercioPedido?: string) {
  const alcance = await obtenerAlcance();
  if (alcance.tipo === "tienda") return alcance.tiendaId;

  if (comercioPedido) {
    const db = getDb();
    const [t] = await db
      .select({ id: tiendas.id })
      .from(tiendas)
      .where(eq(tiendas.slug, comercioPedido))
      .limit(1);
    return t?.id ?? null;
  }
  return null;
}

export type FiltrosMisProductos = {
  busqueda?: string;
  estado?: "borrador" | "publicado" | "agotado";
  comercio?: string;
  pagina?: number;
};

const POR_PAGINA = 24;

export async function listarMisProductos(filtros: FiltrosMisProductos = {}) {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(filtros.comercio);

  if (!tiendaId) {
    return { productos: [], total: 0, pagina: 1, paginas: 1, tiendaId: null };
  }

  const condiciones: SQL[] = [eq(productos.tiendaId, tiendaId)];
  if (filtros.estado) condiciones.push(eq(productos.estado, filtros.estado));

  const { donde: filtroBusqueda } = condicionDeBusqueda(filtros.busqueda);
  if (filtroBusqueda) condiciones.push(filtroBusqueda);

  const donde = and(...condiciones);
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const [conteo] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(donde);

  const filas = await db
    .select({
      id: productos.id,
      slug: productos.slug,
      /* Para el selector de departamento de la lista: se cambia ahí mismo y
         NO mueve el producto de tienda. */
      categoriaId: productos.categoriaId,
      depositoId: productos.depositoId,
      tituloEs: productos.tituloEs,
      sku: productos.sku,
      precioCentavos: productos.precioCentavos,
      existencias: productos.existencias,
      controlaExistencias: productos.controlaExistencias,
      unidad: productos.unidad,
      estado: productos.estado,
      destacado: productos.destacado,
      actualizadoEn: productos.actualizadoEn,
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
    .orderBy(desc(productos.actualizadoEn))
    .limit(POR_PAGINA)
    .offset((pagina - 1) * POR_PAGINA);

  const total = Number(conteo?.n ?? 0);

  return {
    tiendaId,
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    productos: filas.map((f) => ({
      ...f,
      imagenUrl: direccionImagen({ url: f.fotoUrl, clave: f.fotoClave }),
    })),
  };
}

/** Cuantos productos hay en cada estado, para las pestanas. */
export async function contarPorEstado(comercioPedido?: string) {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercioPedido);
  if (!tiendaId) return { publicado: 0, borrador: 0, agotado: 0, total: 0 };

  const filas = await db
    .select({ estado: productos.estado, n: sql<number>`COUNT(*)` })
    .from(productos)
    .where(eq(productos.tiendaId, tiendaId))
    .groupBy(productos.estado);

  const cuenta = { publicado: 0, borrador: 0, agotado: 0, total: 0 };
  for (const f of filas) {
    const n = Number(f.n);
    cuenta[f.estado as keyof typeof cuenta] = n;
    cuenta.total += n;
  }
  return cuenta;
}

/** Un producto del comercio, con sus fotos, para editarlo. */
export async function obtenerMiProducto(id: string) {
  const db = getDb();
  const alcance = await obtenerAlcance();

  const [producto] = await db
    /* Columnas nombradas, no `.select()`: ver la explicacion en
       src/lib/catalogo/consultas.ts. */
    .select({
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
      depositoId: productos.depositoId,
      /**
       * EL PRECIO DEL COMERCIO, SIN EL AJUSTE. Es el que se le enseña en el
       * formulario, y faltaba aquí.
       *
       * Sin esta columna el formulario caía en su respaldo y mostraba el
       * precio PUBLICADO. Al guardar, el ajuste se aplicaba encima del precio
       * que ya lo tenía, y cada vez que el comercio abría y guardaba su
       * producto el precio subía solo: 500 → 515.25 → 531 → 547… Un comercio
       * lo reportó el 5 ago 2026 con un producto que llegó a 595.
       */
      precioBaseCentavos: productos.precioBaseCentavos,
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
    })
    .from(productos)
    .where(eq(productos.id, id))
    .limit(1);

  if (!producto) return null;

  // La barrera: si es un vendedor, el producto tiene que ser de su tienda.
  if (alcance.tipo === "tienda" && producto.tiendaId !== alcance.tiendaId) {
    return null;
  }

  const fotos = await db
    .select()
    .from(imagenesProducto)
    .where(eq(imagenesProducto.productoId, id))
    .orderBy(asc(imagenesProducto.orden));

  // La ciudad del depósito, para que el selector salga con la suya marcada.
  let depositoZona: string | null = null;
  if (producto.depositoId) {
    const [dep] = await db
      .select({ zona: depositos.zona })
      .from(depositos)
      .where(eq(depositos.id, producto.depositoId))
      .limit(1);
    depositoZona = dep?.zona ?? null;
  }

  return {
    producto: { ...producto, depositoZona },
    imagenes: fotos.map((f) => ({
      id: f.id,
      url: direccionImagen(f),
      /** Las que vinieron del sistema de origen no se pueden borrar del bucket. */
      esNuestra: Boolean(f.clave),
    })),
  };
}
