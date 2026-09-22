import "server-only";

import { and, asc, inArray, lt, sql } from "drizzle-orm";

import type { ImagenCruda } from "@/lib/catalogo/fotos-de-producto-armar";
import { getDb } from "@/lib/db";
import { fotosDeProducto, imagenesProducto } from "@/lib/db/schema";

import {
  agruparFotos,
  elegirFoto,
  type FotoGuardada,
  leerFotosGuardadas,
} from "./fotos-de-producto-armar";

/**
 * ══ LAS FOTOS DE CADA PRODUCTO SE GUARDAN ELEGIDAS (emergencia de costo, 18 sep 2026) ══
 *
 * Lo que pasó: el listado de productos era, con los conteos ya arreglados,
 * la consulta más cara de la base: ~100 millones de filas por hora. No por
 * los productos, sino por la FOTO: tres subconsultas por fila sobre
 * `imagenes_producto` (url, clave y alt), cada una con funciones de ventana
 * y el cruce con `fotos_rotas`. Y en la portada, con `ORDER BY` de ventana,
 * SQLite las evaluaba para las 17.000 filas antes de quedarse con 48.
 *
 * Lo que hay ahora: la tabla `fotos_de_producto` guarda por producto la
 * lista de sus fotos sanas (hasta 12, en orden) en un JSON. Un listado pide
 * primero sus productos SIN foto, y después UNA fila por producto:
 * `fotosDe(ids)`. La elección (rota con la semilla) se hace en código.
 *
 * Cómo se mantiene, en tres capas:
 *  1. **Se llena sola**: si a un producto le falta la fila, se calcula
 *     desde `imagenes_producto` en ese momento y se guarda. Un producto
 *     recién publicado sale con foto en su primera visita.
 *  2. **Se borra donde cambian las fotos** (`olvidarFotosDe`): subir, copiar
 *     al bucket, sincronizar, marcar rota. La visita siguiente la rehace.
 *  3. **El reloj rehace las de más de un día** (`refrescarFotosViejas`), por
 *     si a algún sitio nuevo se le olvidó borrar. Es la red de seguridad, no
 *     el mecanismo.
 */

const SIN_FOTOS_ROTAS = sql`NOT EXISTS (SELECT 1 FROM fotos_rotas fr WHERE fr.imagen_id = ${imagenesProducto.id} AND fr.definitiva = 1 AND fr.url = ${imagenesProducto.url})`;

/** Más vieja que esto, el reloj la rehace. */
export const FOTOS_VIEJAS_MS = 24 * 60 * 60_000;

/** `filas × columnas ≤ 100` por sentencia en la base de la nube. */
const FILAS_POR_SENTENCIA = 30;

function trozos<T>(lista: readonly T[], tamano: number): T[][] {
  const salida: T[][] = [];
  for (let i = 0; i < lista.length; i += tamano) {
    salida.push(lista.slice(i, i + tamano));
  }
  return salida;
}

/** Las fotos sanas de estos productos, leídas de `imagenes_producto`. */
/**
 * ══ NUNCA MÁS DE `IDS_POR_CONSULTA` EN UN `IN` (22 sep 2026) ══
 *
 * `refrescarFotosViejas(150)` mandaba 150 ids en un solo `IN (?, ?, …)`, y
 * la base de la nube no admite más de 100 variables por sentencia. Falló
 * 6.440 veces seguidas, una por minuto desde el 19 sep, anotadas en
 * `errores_sistema` como `reloj/fotos-guardadas`, y ninguna lista vieja se
 * rehizo. Se trocea aquí, en la única función que arma esa consulta.
 */
export const IDS_POR_CONSULTA = 90;

async function calcularFotosDe(
  ids: readonly string[],
): Promise<Map<string, FotoGuardada[]>> {
  if (ids.length === 0) return new Map();
  const db = getDb();
  const imagenes: ImagenCruda[] = [];
  for (const trozo of trozos(ids, IDS_POR_CONSULTA)) {
    imagenes.push(
      ...(await db
        .select({
          productoId: imagenesProducto.productoId,
          url: imagenesProducto.url,
          clave: imagenesProducto.clave,
          textoAltEs: imagenesProducto.textoAltEs,
          textoAltEn: imagenesProducto.textoAltEn,
        })
        .from(imagenesProducto)
        .where(
          and(inArray(imagenesProducto.productoId, trozo), SIN_FOTOS_ROTAS),
        )
        .orderBy(
          imagenesProducto.productoId,
          asc(imagenesProducto.orden),
          sql`imagenes_producto.rowid`,
        )),
    );
  }
  const agrupadas = agruparFotos(imagenes);
  /* Un producto sin fotos también se guarda (lista vacía): si no, cada
     visita volvería a preguntar por él. */
  for (const id of ids) if (!agrupadas.has(id)) agrupadas.set(id, []);
  return agrupadas;
}

async function guardarFotos(fotos: Map<string, FotoGuardada[]>) {
  const db = getDb();
  const ahora = new Date();
  const filas = [...fotos.entries()].map(([productoId, lista]) => ({
    productoId,
    fotos: JSON.stringify(lista),
    actualizadoEn: ahora,
  }));
  for (const trozo of trozos(filas, FILAS_POR_SENTENCIA)) {
    await db
      .insert(fotosDeProducto)
      .values(trozo)
      .onConflictDoUpdate({
        target: fotosDeProducto.productoId,
        set: {
          fotos: sql`excluded.fotos`,
          actualizadoEn: sql`excluded.actualizado_en`,
        },
      });
  }
}

/**
 * Las fotos guardadas de estos productos: una fila por producto. Las que
 * faltan se calculan y se guardan en el momento, una vez.
 */
export async function fotosDe(
  ids: readonly string[],
): Promise<Map<string, FotoGuardada[]>> {
  const unicos = [...new Set(ids)];
  const resultado = new Map<string, FotoGuardada[]>();
  if (unicos.length === 0) return resultado;
  const db = getDb();

  for (const trozo of trozos(unicos, 100)) {
    const filas = await db
      .select({
        productoId: fotosDeProducto.productoId,
        fotos: fotosDeProducto.fotos,
      })
      .from(fotosDeProducto)
      .where(inArray(fotosDeProducto.productoId, trozo));
    for (const f of filas)
      resultado.set(f.productoId, leerFotosGuardadas(f.fotos));
  }

  const faltan = unicos.filter((id) => !resultado.has(id));
  if (faltan.length > 0) {
    const nuevas = await calcularFotosDe(faltan);
    for (const [id, lista] of nuevas) resultado.set(id, lista);
    /* Guardar no puede tumbar el listado: si falla, la visita siguiente
       vuelve a calcular. */
    await guardarFotos(nuevas).catch((fallo) => {
      console.error("[fotos-de-producto] no se pudo guardar:", fallo);
    });
  }
  return resultado;
}

/** La foto de turno de cada producto, ya elegida con la semilla. */
export async function fotoDeTurnoDe(
  ids: readonly string[],
  semilla: number,
): Promise<Map<string, FotoGuardada | null>> {
  const fotos = await fotosDe(ids);
  const elegidas = new Map<string, FotoGuardada | null>();
  for (const id of ids) elegidas.set(id, elegirFoto(fotos.get(id), semilla));
  return elegidas;
}

/**
 * Borra lo guardado de estos productos: se llama donde cambian las fotos.
 * Nunca lanza — un olvido fallido lo cubre el reloj al día siguiente.
 */
export async function olvidarFotosDe(ids: readonly string[]): Promise<void> {
  const unicos = [...new Set(ids)].filter(Boolean);
  if (unicos.length === 0) return;
  try {
    const db = getDb();
    for (const trozo of trozos(unicos, 100)) {
      await db
        .delete(fotosDeProducto)
        .where(inArray(fotosDeProducto.productoId, trozo));
    }
  } catch (fallo) {
    console.error("[fotos-de-producto] no se pudo olvidar:", fallo);
  }
}

/**
 * Para el reloj: rehace un puñado de las filas más viejas que un día.
 * Devuelve cuántas rehizo; cero cuando no hay nada viejo.
 */
export async function refrescarFotosViejas(limite = 150): Promise<number> {
  const db = getDb();
  const corte = new Date(Date.now() - FOTOS_VIEJAS_MS);
  const viejas = await db
    .select({ productoId: fotosDeProducto.productoId })
    .from(fotosDeProducto)
    .where(lt(fotosDeProducto.actualizadoEn, corte))
    .orderBy(asc(fotosDeProducto.actualizadoEn))
    .limit(limite);
  if (viejas.length === 0) return 0;
  const ids = viejas.map((v) => v.productoId);
  await guardarFotos(await calcularFotosDe(ids));
  return ids.length;
}
