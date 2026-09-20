import "server-only";

import { eq, sql } from "drizzle-orm";

import { recordado } from "@/lib/cachecito";
import { getDb } from "@/lib/db";
import {
  categorias,
  configuracion,
  productos,
  textoDeBusqueda,
  tiendas,
} from "@/lib/db/schema";

import { normalizarSql } from "./normalizar-sql";

/**
 * ══ QUIÉN LLENA `texto_de_busqueda`, Y CUÁNDO SE PUEDE USAR ══
 * (20 sep 2026 — el arreglo de raíz de la búsqueda lenta)
 *
 * El reloj llama a `ponerAlDiaElTextoDeBusqueda` cada pocos minutos. Cada
 * tanda es UNA sentencia `INSERT OR REPLACE … SELECT` que prepara el texto de
 * los productos que no tienen fila, de los que cambiaron después de
 * calcularla, y —red de seguridad— de los que llevan más de una semana sin
 * rehacerse (el nombre de un comercio o de un departamento cambia sin tocar
 * el producto).
 *
 * LA BÚSQUEDA SOLO USA LA TABLA CUANDO ESTÁ COMPLETA. Mientras el reloj la
 * llena por primera vez (o si algún día se vacía), la marca `LLAVE_LISTO` no
 * está y el buscador sigue por el camino de siempre. Una tabla a medias
 * devolvería «sin resultados» para productos que sí existen, que es peor que
 * tardar.
 */

export const LLAVE_LISTO = "texto_de_busqueda_listo";
/** Cada cuánto busca el reloj productos nuevos o cambiados. */
export const TEXTO_CADA_MS = 5 * 60_000;
/** Filas por sentencia: una tanda tarda décimas de segundo. */
const POR_TANDA = 3000;
/** Más vieja que esto, la fila se rehace aunque el producto no cambiara. */
const VIEJA_SEGUNDOS = 7 * 24 * 60 * 60;

const TITULO = normalizarSql(productos.tituloEs);
const MARCA_Y_SKU = normalizarSql(
  sql`COALESCE(${productos.marca}, '') || ' ' || COALESCE(${productos.sku}, '')`,
);
/** Lo MISMO que buscaba `TEXTO_CORTO` en `buscar.ts`, campo por campo. */
const TEXTO = normalizarSql(sql`
  COALESCE(${productos.tituloEs}, '') || ' ' ||
  COALESCE(${productos.tituloEn}, '') || ' ' ||
  COALESCE(${productos.marca}, '') || ' ' ||
  COALESCE(${productos.sku}, '') || ' ' ||
  COALESCE(${tiendas.nombre}, '') || ' ' ||
  COALESCE(${categorias.nombreEs}, '')
`);

function cambios(r: unknown): number {
  return Number(
    (r as { meta?: { changes?: number } } | null)?.meta?.changes ?? 0,
  );
}

/** Prepara hasta `POR_TANDA` productos pendientes. Devuelve cuántos hizo. */
async function unaTanda(ahoraSegundos: number): Promise<number> {
  const r = await getDb().run(sql`
    INSERT OR REPLACE INTO ${textoDeBusqueda}
      (producto_id, titulo, marca_sku, texto, calculado_en)
    SELECT ${productos.id}, ${TITULO}, ${MARCA_Y_SKU}, ${TEXTO}, ${ahoraSegundos}
    FROM ${productos}
    INNER JOIN ${tiendas} ON ${tiendas.id} = ${productos.tiendaId}
    LEFT JOIN ${categorias} ON ${categorias.id} = ${productos.categoriaId}
    LEFT JOIN ${textoDeBusqueda} ON ${textoDeBusqueda.productoId} = ${productos.id}
    WHERE ${textoDeBusqueda.productoId} IS NULL
       OR ${productos.actualizadoEn} > ${textoDeBusqueda.calculadoEn}
       OR ${textoDeBusqueda.calculadoEn} < ${ahoraSegundos - VIEJA_SEGUNDOS}
    LIMIT ${POR_TANDA}
  `);
  return cambios(r);
}

async function marcar(listo: boolean): Promise<void> {
  const valor = listo ? String(Date.now()) : "";
  await getDb()
    .insert(configuracion)
    .values({ clave: LLAVE_LISTO, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } });
}

/**
 * Pone la tabla al día, tanda a tanda, mientras quede tiempo. Cuando una
 * tanda sale incompleta ya no queda nada pendiente: se marca como lista.
 */
export async function ponerAlDiaElTextoDeBusqueda(
  queda: () => number,
  maximoDeTandas = 20,
): Promise<{ preparados: number; listo: boolean }> {
  let preparados = 0;
  let listo = false;
  for (let i = 0; i < maximoDeTandas && queda() > 4_000; i++) {
    const hechos = await unaTanda(Math.floor(Date.now() / 1000));
    preparados += hechos;
    if (hechos < POR_TANDA) {
      listo = true;
      break;
    }
  }
  if (listo) await marcar(true);
  return { preparados, listo };
}

/**
 * ¿Se puede buscar en la tabla? Un minuto de memoria: es una fila de
 * `configuracion`, igual para todos los países.
 */
export async function textoDeBusquedaListo(): Promise<boolean> {
  return recordado("texto-de-busqueda-listo", 60_000, async () => {
    try {
      const [fila] = await getDb()
        .select({ valor: configuracion.valor })
        .from(configuracion)
        .where(eq(configuracion.clave, LLAVE_LISTO))
        .limit(1);
      return Boolean(fila?.valor);
    } catch {
      return false;
    }
  });
}

/** Para el canario: cuántas filas hay y si la búsqueda ya la usa. */
export async function estadoDelTextoDeBusqueda(): Promise<{
  listo: boolean;
  filas: number;
}> {
  const [conteo] = await getDb()
    .select({ n: sql<number>`COUNT(*)` })
    .from(textoDeBusqueda);
  return {
    listo: await textoDeBusquedaListo(),
    filas: Number(conteo?.n ?? 0),
  };
}
