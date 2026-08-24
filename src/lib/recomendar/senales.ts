import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { recordado } from "@/lib/cachecito";
import { getDb } from "@/lib/db";
import {
  itemsPedido,
  meGustaVideo,
  pedidos,
  productos,
  videosTienda,
} from "@/lib/db/schema";

/**
 * LAS SEÑALES DE UNA PERSONA QUE YA ENTRÓ (24 ago 2026).
 *
 * ══ QUÉ CUENTA, Y POR QUÉ ESE ORDEN ══
 *
 * Lo que la persona HIZO vale más que lo que miró, y lo hecho con esfuerzo
 * vale más que lo hecho de pasada:
 *
 *  1. **Compró** — la señal más cara de conseguir y la que menos miente.
 *     Pesa el doble.
 *  2. **Le dio corazón a un video** — un acto deliberado: se paró, le gustó
 *     lo que vio de ese comercio y lo dijo.
 *  3. **Abrió fichas de una categoría** — esa ya vive en el navegador
 *     (`catalogo/afinidad.ts`) y no necesita cuenta; no se duplica aquí.
 *
 * De ahí salen dos listas cortas: TIENDAS y CATEGORÍAS afines. No es un
 * perfil guardado: se recalcula de los hechos cada vez y se recuerda un
 * minuto por usuario.
 *
 * ══ LO QUE NO SE HACE ══
 *
 * **Las señales REORDENAN, nunca FILTRAN.** Un comercio nuevo, sin corazones
 * y sin ventas, tiene que poder salir igual — es la misma razón por la que la
 * portada va por rondas de tienda (23 ago 2026). Personalizar hasta tapar a
 * los chicos sería deshacer ese arreglo con otro nombre.
 *
 * **Y jamás pueden poner lenta una pantalla.** Todo va en try: sin señales se
 * enseña lo de siempre, que ya está bien.
 */
export type Senales = {
  /** Ids de tiendas por las que ya mostró interés, de más a menos puntos. */
  tiendas: string[];
  /** Ids de categorías de lo que compró. */
  categorias: string[];
};

export const SENALES_VACIAS: Senales = { tiendas: [], categorias: [] };

const MAXIMO_TIENDAS = 8;
const MAXIMO_CATEGORIAS = 6;

export async function senalesDe(usuarioId: string | null): Promise<Senales> {
  if (!usuarioId) return SENALES_VACIAS;
  return recordado(`senales-${usuarioId}`, 60_000, () =>
    leerSenales(usuarioId),
  );
}

async function leerSenales(usuarioId: string): Promise<Senales> {
  try {
    const db = getDb();
    const [comprados, corazones] = await Promise.all([
      /* Lo que compró: la tienda y la categoría de cada renglón, lo último
         primero. Cuarenta renglones bastan para dibujar el gusto. */
      db
        .select({
          tiendaId: itemsPedido.tiendaId,
          categoriaId: productos.categoriaId,
        })
        .from(itemsPedido)
        .innerJoin(pedidos, eq(pedidos.id, itemsPedido.pedidoId))
        .leftJoin(productos, eq(productos.id, itemsPedido.productoId))
        .where(eq(pedidos.clienteId, usuarioId))
        .orderBy(desc(pedidos.creadoEn))
        .limit(40),
      /* A qué videos les dio corazón, y de qué tienda son. */
      db
        .select({ tiendaId: videosTienda.tiendaId })
        .from(meGustaVideo)
        .innerJoin(videosTienda, eq(videosTienda.id, meGustaVideo.videoId))
        .where(eq(meGustaVideo.usuarioId, usuarioId))
        .orderBy(desc(meGustaVideo.creadoEn))
        .limit(40),
    ]);

    /* Comprar pesa el doble que un corazón: comprar cuesta dinero. */
    const puntos = new Map<string, number>();
    for (const c of comprados) {
      puntos.set(c.tiendaId, (puntos.get(c.tiendaId) ?? 0) + 2);
    }
    for (const c of corazones) {
      puntos.set(c.tiendaId, (puntos.get(c.tiendaId) ?? 0) + 1);
    }

    const tiendas = [...puntos.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAXIMO_TIENDAS)
      .map(([id]) => id);

    const categorias = [
      ...new Set(
        comprados
          .map((c) => c.categoriaId)
          .filter((x): x is string => Boolean(x)),
      ),
    ].slice(0, MAXIMO_CATEGORIAS);

    return { tiendas, categorias };
  } catch (fallo) {
    console.error("[recomendar] no se pudieron leer las señales:", fallo);
    return SENALES_VACIAS;
  }
}

/** De estos videos, ¿a cuáles les dio corazón ESTA persona? */
export async function videosQueLeGustaron(
  usuarioId: string | null,
  videoIds: string[],
): Promise<Set<string>> {
  if (!usuarioId || videoIds.length === 0) return new Set();
  try {
    const filas = await getDb()
      .select({ videoId: meGustaVideo.videoId })
      .from(meGustaVideo)
      .where(
        and(
          eq(meGustaVideo.usuarioId, usuarioId),
          inArray(meGustaVideo.videoId, videoIds),
        ),
      );
    return new Set(filas.map((f) => f.videoId));
  } catch {
    return new Set();
  }
}
