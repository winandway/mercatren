import "server-only";

import { and, count, eq, inArray, sql } from "drizzle-orm";

import { DEPARTAMENTOS } from "@/lib/catalogo/departamentos";
import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";

/**
 * CUÁNTO LLEVAMOS CARGADO EN ESTADOS UNIDOS.
 *
 * ══ POR QUÉ HACE FALTA UNA PANTALLA APARTE ══
 *
 * La de Catálogo de Estados Unidos sirve para **buscar y agregar**; después de
 * pulsar el botón, el producto desaparece de la vista y no queda ni un número
 * en pantalla. Con la meta de mil productos por delante, eso es trabajar a
 * ciegas: no se sabe si van 78 o 400, ni qué departamento está vacío.
 *
 * ══ Y EL DEPARTAMENTO VACÍO ES EL DATO ÚTIL ══
 *
 * Saber que hay 300 productos no dice qué buscar mañana. Saber que Mascotas
 * tiene 4 y Ferretería 120, sí. Por eso se listan **todos** los departamentos,
 * incluidos los que están en cero: un departamento que no aparece no se echa
 * de menos.
 */

/** Cómo se reconoce una tienda nuestra de Estados Unidos. */
const ES_DE_ESTADOS_UNIDOS = sql`UPPER(TRIM(COALESCE(${tiendas.paisOrigen}, ''))) = 'US'`;

export type TiendaUs = {
  id: string;
  slug: string;
  nombre: string;
  estado: string;
  logoClave: string | null;
  publicados: number;
  borradores: number;
  total: number;
};

export type ConteoDepartamento = {
  slug: string;
  nombre: string;
  cuantos: number;
};

export type ResumenUs = {
  tiendas: TiendaUs[];
  departamentos: ConteoDepartamento[];
  /** Lo que de verdad se quiere saber: cuántos van hacia los mil. */
  totalProductos: number;
  totalPublicados: number;
  totalTiendas: number;
};

export async function resumenDeEstadosUnidos(
  idioma: string,
): Promise<ResumenUs> {
  const db = getDb();

  const filas = await db
    .select({
      id: tiendas.id,
      slug: tiendas.slug,
      nombre: tiendas.nombre,
      estado: tiendas.estado,
      logoClave: tiendas.logoClave,
      /* Se cuentan por estado en la misma consulta: una por tienda serían
         veintitrés consultas para dibujar una tabla. */
      publicados: sql<number>`SUM(CASE WHEN ${productos.estado} = 'publicado' THEN 1 ELSE 0 END)`,
      total: count(productos.id),
    })
    .from(tiendas)
    .leftJoin(productos, eq(productos.tiendaId, tiendas.id))
    .where(ES_DE_ESTADOS_UNIDOS)
    .groupBy(tiendas.id)
    .orderBy(sql`COUNT(${productos.id}) DESC`);

  const lista: TiendaUs[] = filas.map((f) => {
    const total = Number(f.total ?? 0);
    const publicados = Number(f.publicados ?? 0);
    return {
      id: f.id,
      slug: f.slug,
      nombre: f.nombre,
      estado: f.estado,
      logoClave: f.logoClave,
      publicados,
      borradores: Math.max(0, total - publicados),
      total,
    };
  });

  /* Cuántos hay en cada departamento, solo dentro de nuestras tiendas de EE. UU. */
  const ids = lista.map((t) => t.id);
  const porDepartamento = ids.length
    ? await db
        .select({
          categoriaId: productos.categoriaId,
          cuantos: count(productos.id),
        })
        .from(productos)
        .where(inArray(productos.tiendaId, ids))
        .groupBy(productos.categoriaId)
    : [];

  const cuenta = new Map<string, number>();
  for (const d of porDepartamento) {
    /* El departamento se guarda como `dep-<slug>`. */
    const slug = d.categoriaId?.startsWith("dep-")
      ? d.categoriaId.slice(4)
      : null;
    if (slug) cuenta.set(slug, Number(d.cuantos ?? 0));
  }

  /**
   * TODOS los departamentos, también los que están en cero.
   *
   * Un departamento que no aparece en la lista no se echa de menos, y el hueco
   * es justo lo que dice qué buscar mañana.
   */
  const departamentos: ConteoDepartamento[] = DEPARTAMENTOS.map((d) => ({
    slug: d.slug,
    nombre: idioma === "en" ? d.en : d.es,
    cuantos: cuenta.get(d.slug) ?? 0,
  })).sort((a, b) => b.cuantos - a.cuantos);

  return {
    tiendas: lista,
    departamentos,
    totalProductos: lista.reduce((n, t) => n + t.total, 0),
    totalPublicados: lista.reduce((n, t) => n + t.publicados, 0),
    totalTiendas: lista.length,
  };
}

/** Los productos de EE. UU. que se quedaron sin departamento reconocido. */
export async function sinDepartamentoUs(): Promise<number> {
  const db = getDb();
  const [fila] = await db
    .select({ n: count(productos.id) })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(and(ES_DE_ESTADOS_UNIDOS, sql`${productos.categoriaId} IS NULL`));

  return Number(fila?.n ?? 0);
}
