"use server";

import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  comentariosVideo,
  meGustaVideo,
  tiendas,
  videosTienda,
} from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { contarCorazones } from "@/lib/videos/social";

/**
 * DAR CORAZÓN, COMENTAR Y BORRAR UN COMENTARIO.
 *
 * Todo exige sesión. Un corazón anónimo no significa nada —cualquiera lo sube
 * desde una ventana de incógnito— y un comentario anónimo en la tienda de un
 * comercio es spam. Quien no entró ve el número y el botón, y al tocarlo se le
 * dice que entre.
 */
export type ResultadoCorazon =
  | { ok: true; corazones: number; meGusta: boolean }
  | { ok: false; mensaje: string; hayQueEntrar?: boolean };

export async function alternarCorazon(
  videoId: string,
): Promise<ResultadoCorazon> {
  const t = await mensajes();
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario)
    return {
      ok: false,
      mensaje: t("videos.entraParaCorazon"),
      hayQueEntrar: true,
    };

  const db = getDb();
  try {
    const [ya] = await db
      .select({ videoId: meGustaVideo.videoId })
      .from(meGustaVideo)
      .where(
        and(
          eq(meGustaVideo.videoId, videoId),
          eq(meGustaVideo.usuarioId, usuario.id),
        ),
      )
      .limit(1);

    if (ya) {
      await db
        .delete(meGustaVideo)
        .where(
          and(
            eq(meGustaVideo.videoId, videoId),
            eq(meGustaVideo.usuarioId, usuario.id),
          ),
        );
      return {
        ok: true,
        corazones: await contarCorazones(videoId),
        meGusta: false,
      };
    }

    await db
      .insert(meGustaVideo)
      .values({ videoId, usuarioId: usuario.id, creadoEn: new Date() });
    return {
      ok: true,
      corazones: await contarCorazones(videoId),
      meGusta: true,
    };
  } catch (e) {
    console.error("[videos] no se pudo dar corazón:", e);
    return { ok: false, mensaje: t("noSePudoGuardar") };
  }
}

export type ResultadoComentario =
  | { ok: true; id: string; texto: string; autor: string }
  | { ok: false; mensaje: string; hayQueEntrar?: boolean };

const LARGO_MAXIMO = 500;

export async function comentarVideo(
  videoId: string,
  texto: string,
): Promise<ResultadoComentario> {
  const t = await mensajes();
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario)
    return {
      ok: false,
      mensaje: t("videos.entraParaComentar"),
      hayQueEntrar: true,
    };

  const limpio = texto.trim().slice(0, LARGO_MAXIMO);
  if (limpio.length < 2)
    return { ok: false, mensaje: t("videos.comentarioVacio") };

  const id = nanoid();
  try {
    await getDb().insert(comentariosVideo).values({
      id,
      videoId,
      usuarioId: usuario.id,
      texto: limpio,
      estado: "publicado",
      creadoEn: new Date(),
    });
  } catch (e) {
    console.error("[videos] no se pudo comentar:", e);
    return { ok: false, mensaje: t("noSePudoGuardar") };
  }

  revalidatePath("/[locale]/video/[slug]", "page");
  return {
    ok: true,
    id,
    texto: limpio,
    autor: (usuario.name ?? "").trim().split(/\s+/)[0] || "—",
  };
}

/**
 * OCULTAR UN COMENTARIO. Lo puede hacer quien lo escribió, el comercio dueño
 * del video y el equipo. No se borra la fila: si mañana hay una discusión
 * sobre lo que alguien escribió, el rastro tiene que existir.
 */
export async function ocultarComentario(
  id: string,
): Promise<{ ok: boolean; mensaje?: string }> {
  const t = await mensajes();
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return { ok: false, mensaje: t("sinPermiso") };

  const db = getDb();
  const [fila] = await db
    .select({
      id: comentariosVideo.id,
      usuarioId: comentariosVideo.usuarioId,
      tiendaId: videosTienda.tiendaId,
    })
    .from(comentariosVideo)
    .innerJoin(videosTienda, eq(videosTienda.id, comentariosVideo.videoId))
    .where(eq(comentariosVideo.id, id))
    .limit(1);
  if (!fila) return { ok: false, mensaje: t("sinPermiso") };

  const suyo = fila.usuarioId === usuario.id;
  const equipo = await esEquipoInterno();
  let delComercio = false;
  if (!suyo && !equipo) {
    const [tienda] = await db
      .select({ id: tiendas.id })
      .from(tiendas)
      .where(
        and(
          eq(tiendas.id, fila.tiendaId),
          eq(tiendas.propietarioId, usuario.id),
        ),
      )
      .limit(1);
    delComercio = Boolean(tienda);
  }
  if (!suyo && !equipo && !delComercio)
    return { ok: false, mensaje: t("sinPermiso") };

  await db
    .update(comentariosVideo)
    .set({ estado: "oculto" })
    .where(eq(comentariosVideo.id, id));
  revalidatePath("/[locale]/video/[slug]", "page");
  return { ok: true };
}

/**
 * UNA VISTA MÁS — contada cuando la persona lo MIRÓ, no cuando la página
 * cargó. El visor la dispara a los 2 segundos de tener el video delante, una
 * vez por video y por sesión del navegador (la guardia vive allá). Aquí solo
 * se comprueba que el video exista y esté publicado: un id inventado desde la
 * consola no infla nada. Sin sesión también cuenta — las vistas son de todos.
 */
export async function registrarVistaDeVideo(videoId: string): Promise<void> {
  try {
    const db = getDb();
    await db
      .update(videosTienda)
      .set({ vistas: sql`${videosTienda.vistas} + 1` })
      .where(
        and(eq(videosTienda.id, videoId), eq(videosTienda.estado, "publicado")),
      );
  } catch {
    /* Contar jamás puede romper nada. */
  }
}
