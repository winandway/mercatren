import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  comentariosVideo,
  meGustaVideo,
  user,
  videosTienda,
} from "@/lib/db/schema";

/**
 * LO SOCIAL DE UN SHORT: corazones y comentarios.
 *
 * Las consultas viven aquí y las acciones en `social-acciones.ts`, separadas a
 * propósito: leer es público (cualquiera ve cuántos corazones tiene un video) y
 * escribir exige sesión.
 */
export type ResumenSocial = {
  corazones: number;
  comentarios: number;
  /** Si QUIEN MIRA ya le dio corazón. `false` para quien no entró. */
  meGusta: boolean;
};

/** Corazones y comentarios de varios videos de una vez (para las hileras). */
export async function resumenSocialDe(
  videoIds: string[],
  usuarioId: string | null,
): Promise<Map<string, ResumenSocial>> {
  const mapa = new Map<string, ResumenSocial>();
  if (videoIds.length === 0) return mapa;
  for (const id of videoIds)
    mapa.set(id, { corazones: 0, comentarios: 0, meGusta: false });

  try {
    const db = getDb();
    const [corazones, comentarios, mios] = await Promise.all([
      db
        .select({ videoId: meGustaVideo.videoId, n: count() })
        .from(meGustaVideo)
        .where(inArray(meGustaVideo.videoId, videoIds))
        .groupBy(meGustaVideo.videoId),
      db
        .select({ videoId: comentariosVideo.videoId, n: count() })
        .from(comentariosVideo)
        .where(
          and(
            inArray(comentariosVideo.videoId, videoIds),
            eq(comentariosVideo.estado, "publicado"),
          ),
        )
        .groupBy(comentariosVideo.videoId),
      usuarioId
        ? db
            .select({ videoId: meGustaVideo.videoId })
            .from(meGustaVideo)
            .where(
              and(
                inArray(meGustaVideo.videoId, videoIds),
                eq(meGustaVideo.usuarioId, usuarioId),
              ),
            )
        : Promise.resolve([] as { videoId: string }[]),
    ]);
    for (const c of corazones) mapa.get(c.videoId)!.corazones = Number(c.n);
    for (const c of comentarios) mapa.get(c.videoId)!.comentarios = Number(c.n);
    for (const m of mios) mapa.get(m.videoId)!.meGusta = true;
  } catch (e) {
    console.error("[videos] no se pudo leer lo social:", e);
  }
  return mapa;
}

export type ComentarioPublico = {
  id: string;
  texto: string;
  autor: string;
  creadoEn: string | null;
  /** Si quien mira puede borrarlo: lo escribió él, o es el dueño del video, o el equipo. */
  puedeBorrar: boolean;
};

/** Los comentarios publicados de un video, del más nuevo al más viejo. */
export async function comentariosDe(
  videoId: string,
  quienMira: { id: string | null; esEquipo: boolean; tiendaId: string | null },
  limite = 50,
): Promise<ComentarioPublico[]> {
  try {
    const db = getDb();
    const [dueno] = await db
      .select({ tiendaId: videosTienda.tiendaId })
      .from(videosTienda)
      .where(eq(videosTienda.id, videoId))
      .limit(1);
    const esDelComercio = Boolean(
      dueno && quienMira.tiendaId && dueno.tiendaId === quienMira.tiendaId,
    );

    const filas = await db
      .select({
        id: comentariosVideo.id,
        texto: comentariosVideo.texto,
        creadoEn: comentariosVideo.creadoEn,
        usuarioId: comentariosVideo.usuarioId,
        autor: user.name,
      })
      .from(comentariosVideo)
      .innerJoin(user, eq(user.id, comentariosVideo.usuarioId))
      .where(
        and(
          eq(comentariosVideo.videoId, videoId),
          eq(comentariosVideo.estado, "publicado"),
        ),
      )
      .orderBy(desc(comentariosVideo.creadoEn))
      .limit(limite);

    return filas.map((f) => ({
      id: f.id,
      texto: f.texto,
      /* Solo el nombre de pila: en un comentario público no hace falta el
         apellido de nadie, y el correo mucho menos. */
      autor: (f.autor ?? "").trim().split(/\s+/)[0] || "—",
      creadoEn: f.creadoEn ? f.creadoEn.toISOString() : null,
      puedeBorrar: Boolean(
        quienMira.esEquipo ||
        esDelComercio ||
        (quienMira.id && quienMira.id === f.usuarioId),
      ),
    }));
  } catch (e) {
    console.error("[videos] no se pudieron leer los comentarios:", e);
    return [];
  }
}

/** Cuántos corazones tiene un video (para volver a dibujar el número). */
export async function contarCorazones(videoId: string): Promise<number> {
  const [fila] = await getDb()
    .select({ n: count() })
    .from(meGustaVideo)
    .where(eq(meGustaVideo.videoId, videoId));
  return Number(fila?.n ?? 0);
}

/** Los videos con más corazones, para ordenar las hileras algún día. */
export async function corazonesPorVideo(
  videoIds: string[],
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (videoIds.length === 0) return mapa;
  const filas = await getDb()
    .select({ videoId: meGustaVideo.videoId, n: sql<number>`COUNT(*)` })
    .from(meGustaVideo)
    .where(inArray(meGustaVideo.videoId, videoIds))
    .groupBy(meGustaVideo.videoId);
  for (const f of filas) mapa.set(f.videoId, Number(f.n));
  return mapa;
}
