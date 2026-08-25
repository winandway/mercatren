import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { recordadoEnElBorde } from "@/lib/cachecito";
import { getDb } from "@/lib/db";
import { seccionesVideo, videosDeSeccion, videosTienda } from "@/lib/db/schema";
import type { Mercado } from "@/lib/mercado/mercados";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { RUTA_MEDIA } from "@/lib/rutas";
import type { VideoPublico } from "@/lib/videos/reglas";

export type SeccionPublica = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  cuantosVideos: number;
};

/** Las secciones publicadas de este mercado, en su orden. */
export async function seccionesPublicadas(
  mercado: Mercado,
  idioma: "es" | "en",
): Promise<SeccionPublica[]> {
  return recordadoEnElBorde(
    `secciones-${mercado.codigo}-${idioma}`,
    60_000,
    async () => {
      const filas = await getDb()
        .select({
          id: seccionesVideo.id,
          slug: seccionesVideo.slug,
          nombreEs: seccionesVideo.nombreEs,
          nombreEn: seccionesVideo.nombreEn,
          descripcionEs: seccionesVideo.descripcionEs,
          descripcionEn: seccionesVideo.descripcionEn,
        })
        .from(seccionesVideo)
        .where(
          and(
            eq(seccionesVideo.estado, "publicada"),
            eq(seccionesVideo.mercado, mercado.codigo),
          ),
        )
        .orderBy(asc(seccionesVideo.orden), desc(seccionesVideo.creadoEn));

      if (filas.length === 0) return [];

      /* Cuántos videos tiene cada una, en UNA consulta: con una por sección,
         seis secciones serían seis viajes a la base en cada visita. */
      const puentes = await getDb()
        .select({
          seccionId: videosDeSeccion.seccionId,
          videoId: videosDeSeccion.videoId,
        })
        .from(videosDeSeccion)
        .innerJoin(videosTienda, eq(videosTienda.id, videosDeSeccion.videoId))
        .where(
          and(
            inArray(
              videosDeSeccion.seccionId,
              filas.map((f) => f.id),
            ),
            eq(videosTienda.estado, "publicado"),
          ),
        );

      const cuenta = new Map<string, number>();
      for (const p of puentes) {
        cuenta.set(p.seccionId, (cuenta.get(p.seccionId) ?? 0) + 1);
      }

      return filas.map((f) => ({
        id: f.id,
        slug: f.slug,
        nombre: (idioma === "en" ? f.nombreEn : null)?.trim() || f.nombreEs,
        descripcion:
          ((idioma === "en" ? f.descripcionEn : null)?.trim() ||
            f.descripcionEs?.trim()) ??
          null,
        cuantosVideos: cuenta.get(f.id) ?? 0,
      }));
    },
  );
}

/** Una sección por su dirección pública, con sus videos. */
export async function seccionPorSlug(
  slug: string,
  mercado: Mercado,
  idioma: "es" | "en",
): Promise<{ seccion: SeccionPublica; videos: VideoPublico[] } | null> {
  const db = getDb();
  const [s] = await db
    .select({
      id: seccionesVideo.id,
      slug: seccionesVideo.slug,
      nombreEs: seccionesVideo.nombreEs,
      nombreEn: seccionesVideo.nombreEn,
      descripcionEs: seccionesVideo.descripcionEs,
      descripcionEn: seccionesVideo.descripcionEn,
      estado: seccionesVideo.estado,
    })
    .from(seccionesVideo)
    .where(
      and(
        eq(seccionesVideo.slug, slug),
        eq(seccionesVideo.mercado, mercado.codigo),
      ),
    )
    .limit(1);

  if (!s || s.estado !== "publicada") return null;

  const videos = await videosDeLaSeccion(s.id, idioma);
  return {
    seccion: {
      id: s.id,
      slug: s.slug,
      nombre: (idioma === "en" ? s.nombreEn : null)?.trim() || s.nombreEs,
      descripcion:
        ((idioma === "en" ? s.descripcionEn : null)?.trim() ||
          s.descripcionEs?.trim()) ??
        null,
      cuantosVideos: videos.length,
    },
    videos,
  };
}

/**
 * Los videos de una sección, lo último primero.
 *
 * Se nombran las columnas una por una, nunca `.select()` a secas: pedir la
 * tabla entera trae las columnas que Drizzle conoce y que una base ya creada
 * puede no tener — y la pantalla revienta con un 500 en producción.
 */
export async function videosDeLaSeccion(
  seccionId: string,
  idioma: "es" | "en",
  limite = 60,
): Promise<VideoPublico[]> {
  const filas = await getDb()
    .select({
      id: videosTienda.id,
      slug: videosTienda.slug,
      tituloEs: videosTienda.tituloEs,
      tituloEn: videosTienda.tituloEn,
      descripcionEs: videosTienda.descripcionEs,
      descripcionEn: videosTienda.descripcionEn,
      clave: videosTienda.clave,
      portadaClave: videosTienda.portadaClave,
      duracionSegundos: videosTienda.duracionSegundos,
      vistas: videosTienda.vistas,
      creadoEn: videosTienda.creadoEn,
      tiendaId: videosTienda.tiendaId,
      orden: videosDeSeccion.orden,
    })
    .from(videosDeSeccion)
    .innerJoin(videosTienda, eq(videosTienda.id, videosDeSeccion.videoId))
    .where(
      and(
        eq(videosDeSeccion.seccionId, seccionId),
        eq(videosTienda.estado, "publicado"),
      ),
    )
    .orderBy(asc(videosDeSeccion.orden), desc(videosTienda.creadoEn))
    .limit(limite);

  return filas.map((f) => ({
    id: f.id,
    slug: f.slug,
    titulo: (idioma === "en" ? f.tituloEn : null)?.trim() || f.tituloEs,
    descripcion:
      ((idioma === "en" ? f.descripcionEn : null)?.trim() ||
        f.descripcionEs?.trim()) ??
      null,
    url: `${RUTA_MEDIA}/${f.clave}`,
    portadaUrl: direccionImagen({ url: null, clave: f.portadaClave }),
    duracionSegundos: f.duracionSegundos,
    /* El nombre visible de un video de sección ES la sección: nunca el de la
       tienda interna que lo contiene. */
    tiendaNombre: "",
    tiendaSlug: "",
    tiendaId: f.tiendaId,
    vistas: f.vistas,
    creadoEn: f.creadoEn ? f.creadoEn.toISOString() : null,
  }));
}

/** De estos videos, cuáles son de sección y de cuál. Para el visor. */
export async function seccionDeCadaVideo(
  videoIds: string[],
): Promise<
  Map<string, { slug: string; nombreEs: string; nombreEn: string | null }>
> {
  if (videoIds.length === 0) return new Map();
  try {
    const filas = await getDb()
      .select({
        videoId: videosDeSeccion.videoId,
        slug: seccionesVideo.slug,
        nombreEs: seccionesVideo.nombreEs,
        nombreEn: seccionesVideo.nombreEn,
      })
      .from(videosDeSeccion)
      .innerJoin(
        seccionesVideo,
        eq(seccionesVideo.id, videosDeSeccion.seccionId),
      )
      .where(inArray(videosDeSeccion.videoId, videoIds));
    return new Map(
      filas.map((f) => [
        f.videoId,
        { slug: f.slug, nombreEs: f.nombreEs, nombreEn: f.nombreEn },
      ]),
    );
  } catch {
    /* Sin esto el visor enseña el nombre de la tienda: menos preciso, nunca roto. */
    return new Map();
  }
}
