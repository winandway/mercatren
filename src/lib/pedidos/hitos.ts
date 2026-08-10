import "server-only";

import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import type { Db } from "@/lib/db";
import { hitosPedido } from "@/lib/db/schema";

/**
 * LA CONSTANCIA DE QUIÉN MOVIÓ UN PEDIDO.
 *
 * ══ POR QUÉ HACE FALTA ══
 *
 * `pedidos.estado` dice dónde está hoy y `actualizado_en` cuándo se movió por
 * última vez, pero no queda rastro de QUIÉN lo movió ni de por dónde pasó.
 * Cuando un comprador reclama que nunca recibió su compra —y con un
 * contracargo de por medio eso deja de ser hipotético— «entregado» a secas no
 * defiende a nadie. «Marcado como entregado por Fulano el 12 de agosto» sí.
 *
 * ══ SE GUARDA EL NOMBRE, NO SOLO EL ENLACE ══
 *
 * Si mañana esa cuenta se borra o cambia de nombre, el registro tiene que
 * seguir diciendo lo que decía. Un enlace roto en un papel que se usa para
 * defender una venta no sirve de nada.
 */
export async function anotarHito(
  db: Db,
  datos: {
    pedidoId: string;
    hito: string;
    hechoPorId?: string | null;
    hechoPorNombre?: string | null;
  },
): Promise<void> {
  /* En su propio try: anotar la constancia NUNCA puede tumbar la operación
     que la genera. Es mejor perder una línea del historial que dejar un
     pedido sin marcar como entregado. */
  try {
    await db.insert(hitosPedido).values({
      id: `hito-${nanoid(10)}`,
      pedidoId: datos.pedidoId,
      hito: datos.hito,
      hechoPorId: datos.hechoPorId ?? null,
      hechoPorNombre: datos.hechoPorNombre ?? null,
      creadoEn: new Date(),
    });
  } catch (fallo) {
    console.error("[hitos] no se pudo anotar:", fallo);
  }
}

export type HitoVista = {
  id: string;
  hito: string;
  porNombre: string | null;
  fecha: number | null;
};

/** La línea de tiempo de un pedido, del primer paso al último. */
export async function hitosDe(db: Db, pedidoId: string): Promise<HitoVista[]> {
  try {
    const filas = await db
      .select({
        id: hitosPedido.id,
        hito: hitosPedido.hito,
        porNombre: hitosPedido.hechoPorNombre,
        creadoEn: hitosPedido.creadoEn,
      })
      .from(hitosPedido)
      .where(eq(hitosPedido.pedidoId, pedidoId))
      .orderBy(asc(hitosPedido.creadoEn))
      .limit(50);

    return filas.map((f) => ({
      id: f.id,
      hito: f.hito,
      porNombre: f.porNombre,
      // Columna de tipo timestamp: Drizzle ya la devuelve como Date.
      fecha: f.creadoEn instanceof Date ? f.creadoEn.getTime() : null,
    }));
  } catch {
    /* Sin historial la ficha se dibuja igual: es información de apoyo, no
       puede dejar al comercio sin poder despachar. */
    return [];
  }
}
