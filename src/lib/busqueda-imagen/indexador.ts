"use server";

import { and, eq, isNull, notInArray, sql } from "drizzle-orm";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { embeddingDeImagen } from "@/lib/busqueda-imagen/embeddings";
import { DIMENSION, vectorABytes } from "@/lib/busqueda-imagen/similitud";
import { getDb } from "@/lib/db";
import {
  embeddingsProducto,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * EL INDEXADOR DEL BUSCADOR VISUAL (30 ago 2026).
 *
 * Recorre los productos publicados que aún no tienen vector, baja la foto
 * principal y la pasa por `gemini-embedding-2`. Va POR TANDAS desde el
 * panel — el mismo patrón de «traer las fotos del catálogo»: se puede parar
 * y retomar, es idempotente (solo mira lo que falta), y una foto que falle
 * no detiene a las demás: su motivo queda escrito en la fila.
 *
 * Indexar el catálogo entero (~13.000 fotos) cuesta menos de dos dólares,
 * una sola vez; los productos nuevos entran en la siguiente pasada.
 */

const POR_TANDA = 8;

export type AvanceDelIndice = {
  ok: boolean;
  hechos: number;
  fallidos: number;
  pendientes: number;
  mensaje?: string;
};

async function fotoDelProducto(
  db: ReturnType<typeof getDb>,
  productoId: string,
): Promise<{ bytes: ArrayBuffer; mime: string } | null> {
  const [foto] = await db
    .select({ url: imagenesProducto.url, clave: imagenesProducto.clave })
    .from(imagenesProducto)
    .where(eq(imagenesProducto.productoId, productoId))
    .orderBy(imagenesProducto.orden, imagenesProducto.id)
    .limit(1);
  if (!foto) return null;

  try {
    if (foto.clave) {
      const { env } = getCloudflareContext();
      const objeto = await env.BUCKET.get(foto.clave);
      if (!objeto) return null;
      return {
        bytes: await objeto.arrayBuffer(),
        mime: objeto.httpMetadata?.contentType ?? "image/webp",
      };
    }
    if (foto.url) {
      const r = await fetch(foto.url);
      if (!r.ok) return null;
      return {
        bytes: await r.arrayBuffer(),
        mime: r.headers.get("content-type") ?? "image/jpeg",
      };
    }
  } catch {
    return null;
  }
  return null;
}

/** Una tanda del índice. El panel la llama repetido hasta que no queden. */
export async function indexarUnaTanda(): Promise<AvanceDelIndice> {
  await exigirEquipoInterno();
  const db = getDb();

  /* Los publicados con tienda activa que aún no tienen fila de vector. */
  const yaHechos = db
    .select({ id: embeddingsProducto.productoId })
    .from(embeddingsProducto);
  const cola = await db
    .select({ id: productos.id, mercado: tiendas.mercado })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(productos.estado, "publicado"),
        eq(tiendas.estado, "activa"),
        notInArray(productos.id, yaHechos),
      ),
    )
    .limit(POR_TANDA);

  const [quedan] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(productos.estado, "publicado"),
        eq(tiendas.estado, "activa"),
        notInArray(productos.id, yaHechos),
      ),
    );

  if (cola.length === 0) {
    return { ok: true, hechos: 0, fallidos: 0, pendientes: 0 };
  }

  let hechos = 0;
  let fallidos = 0;
  for (const fila of cola) {
    const foto = await fotoDelProducto(db, fila.id);
    if (!foto) {
      await db
        .insert(embeddingsProducto)
        .values({
          productoId: fila.id,
          mercado: fila.mercado ?? "US",
          vector: Buffer.alloc(0),
          dimension: 0,
          modelo: "gemini-embedding-2",
          error: "Sin foto legible.",
        })
        .onConflictDoNothing();
      fallidos += 1;
      continue;
    }
    const r = await embeddingDeImagen(foto.bytes, foto.mime);
    await db
      .insert(embeddingsProducto)
      .values({
        productoId: fila.id,
        mercado: fila.mercado ?? "US",
        vector: r.ok ? Buffer.from(vectorABytes(r.vector)) : Buffer.alloc(0),
        dimension: r.ok ? DIMENSION : 0,
        modelo: "gemini-embedding-2",
        error: r.ok ? null : r.motivo,
      })
      .onConflictDoUpdate({
        target: embeddingsProducto.productoId,
        set: {
          vector: r.ok ? Buffer.from(vectorABytes(r.vector)) : Buffer.alloc(0),
          dimension: r.ok ? DIMENSION : 0,
          error: r.ok ? null : r.motivo,
        },
      });
    if (r.ok) hechos += 1;
    else fallidos += 1;
    /* Respiro corto entre llamadas: el modelo aguanta, pero un panel que
       martilla es la forma de encontrarle el límite. */
    await new Promise((esperar) => setTimeout(esperar, 150));
  }

  return {
    ok: true,
    hechos,
    fallidos,
    pendientes: Math.max(0, Number(quedan?.n ?? 0) - cola.length),
  };
}

/** Cuántos vectores hay y cuántos faltan, para la tarjeta del panel. */
export async function estadoDelIndice() {
  await exigirEquipoInterno();
  const db = getDb();
  const [conVector] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(embeddingsProducto)
    .where(
      and(
        sql`${embeddingsProducto.dimension} > 0`,
        isNull(embeddingsProducto.error),
      ),
    );
  const [publicados] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(eq(productos.estado, "publicado"), eq(tiendas.estado, "activa")),
    );
  const [conError] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(embeddingsProducto)
    .where(sql`${embeddingsProducto.error} IS NOT NULL`);
  return {
    indexados: Number(conVector?.n ?? 0),
    publicados: Number(publicados?.n ?? 0),
    conError: Number(conError?.n ?? 0),
  };
}
