import { and, desc, eq, sql } from "drizzle-orm";

import { recordado, recordadoEnElBorde } from "@/lib/cachecito";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { getDb } from "@/lib/db";
import { tiendas, videosTienda } from "@/lib/db/schema";
import type { Mercado } from "@/lib/mercado/mercados";
import { RUTA_MEDIA } from "@/lib/rutas";
import type { VideoPublico } from "@/lib/videos/reglas";

/**
 * LOS VIDEOS QUE VE EL PÚBLICO.
 *
 * Mismas reglas que el catálogo: solo lo publicado, solo de comercios activos
 * y solo del mercado que corresponde (un video de mercatren.com no sale en
 * mercatren.cl). Si la base falla, no hay videos: una portada sin hilera es
 * una portada; una portada caída por una hilera, no.
 */
const COLUMNAS = {
  id: videosTienda.id,
  slug: videosTienda.slug,
  tituloEs: videosTienda.tituloEs,
  tituloEn: videosTienda.tituloEn,
  descripcionEs: videosTienda.descripcionEs,
  descripcionEn: videosTienda.descripcionEn,
  clave: videosTienda.clave,
  portadaClave: videosTienda.portadaClave,
  duracionSegundos: videosTienda.duracionSegundos,
  creadoEn: videosTienda.creadoEn,
  tiendaNombre: tiendas.nombre,
  tiendaSlug: tiendas.slug,
  tiendaId: videosTienda.tiendaId,
};

type Fila = {
  id: string;
  slug: string;
  tituloEs: string;
  tituloEn: string | null;
  descripcionEs: string | null;
  descripcionEn: string | null;
  clave: string;
  portadaClave: string | null;
  duracionSegundos: number;
  creadoEn: Date | null;
  tiendaNombre: string;
  tiendaSlug: string;
  tiendaId: string;
};

function aPublico(f: Fila, idioma: "es" | "en"): VideoPublico {
  return {
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
    tiendaNombre: f.tiendaNombre,
    tiendaSlug: f.tiendaSlug,
    tiendaId: f.tiendaId,
    creadoEn: f.creadoEn ? f.creadoEn.toISOString() : null,
  };
}

function visibles(mercado: Mercado) {
  return and(
    eq(videosTienda.estado, "publicado"),
    eq(videosTienda.mercado, mercado.codigo),
    eq(tiendas.estado, "activa"),
  );
}

/**
 * Los videos para las hileras de la portada, BARAJADOS con la semilla de la
 * visita y con un tope de dos seguidos por tienda: si un comercio sube diez y
 * otro uno, la hilera no puede ser del primero entera.
 */
export async function videosParaHileras(
  mercado: Mercado,
  idioma: "es" | "en",
  semilla: number,
  limite = 24,
): Promise<VideoPublico[]> {
  /* Se recuerdan un minuto: la lista es la misma para todo el que entre en ese
     rato y la portada la pedía en cada visita. La llave lleva el MERCADO
     (regla del proyecto) y el idioma; la semilla no, porque cambia por visita
     — el orden se mueve rotando la lista ya traída. */
  const lista = await recordadoEnElBorde(
    `videos-hilera-${mercado.codigo}-${idioma}-${limite}`,
    60_000,
    () => videosSinCache(mercado, idioma, limite),
  );
  if (lista.length < 2) return lista;
  const giro = Math.abs(Math.trunc(semilla)) % lista.length;
  return [...lista.slice(giro), ...lista.slice(0, giro)];
}

async function videosSinCache(
  mercado: Mercado,
  idioma: "es" | "en",
  limite: number,
): Promise<VideoPublico[]> {
  try {
    const filas = (await getDb()
      .select(COLUMNAS)
      .from(videosTienda)
      .innerJoin(tiendas, eq(tiendas.id, videosTienda.tiendaId))
      .where(visibles(mercado))
      /* Los dos más nuevos de cada tienda primero (misma idea que las rondas
         del catálogo). El orden de las tiendas se decide con la semilla DEL
         DÍA para que la lista se pueda recordar; lo que cambia entre visitas
         es por dónde empieza, y eso se hace rotando la lista ya traída. */
      .orderBy(
        sql`((ROW_NUMBER() OVER (PARTITION BY ${videosTienda.tiendaId} ORDER BY ${videosTienda.creadoEn} DESC) - 1) / 2)`,
        sql`(tiendas.rowid * ${sql.raw(String(semillaDelDia()))}) % 104729`,
        desc(videosTienda.creadoEn),
      )
      .limit(limite)) as Fila[];
    return filas.map((f) => aPublico(f, idioma));
  } catch (e) {
    console.error("[videos] no se pudieron leer para la portada:", e);
    return [];
  }
}

/** Los videos de UNA tienda, para su ficha y para el visor. */
export async function videosDeTienda(
  mercado: Mercado,
  tiendaSlug: string,
  idioma: "es" | "en",
  limite = 24,
): Promise<VideoPublico[]> {
  try {
    const filas = (await getDb()
      .select(COLUMNAS)
      .from(videosTienda)
      .innerJoin(tiendas, eq(tiendas.id, videosTienda.tiendaId))
      .where(and(visibles(mercado), eq(tiendas.slug, tiendaSlug)))
      .orderBy(desc(videosTienda.creadoEn))
      .limit(limite)) as Fila[];
    return filas.map((f) => aPublico(f, idioma));
  } catch (e) {
    console.error("[videos] no se pudieron leer los de la tienda:", e);
    return [];
  }
}

/** Un video por su dirección pública. */
export async function videoPorSlug(
  mercado: Mercado,
  slug: string,
  idioma: "es" | "en",
) {
  const [fila] = (await getDb()
    .select({
      ...COLUMNAS,
      anchoPx: videosTienda.anchoPx,
      altoPx: videosTienda.altoPx,
    })
    .from(videosTienda)
    .innerJoin(tiendas, eq(tiendas.id, videosTienda.tiendaId))
    .where(and(visibles(mercado), eq(videosTienda.slug, slug)))
    .limit(1)) as (Fila & { anchoPx: number | null; altoPx: number | null })[];
  if (!fila) return null;
  return {
    ...aPublico(fila, idioma),
    anchoPx: fila.anchoPx,
    altoPx: fila.altoPx,
  };
}

/** Los siguientes del visor: primero los de la misma tienda, después el resto. */
export async function siguientesEnElVisor(
  mercado: Mercado,
  idioma: "es" | "en",
  actual: { id: string; tiendaSlug: string },
  limite = 12,
): Promise<VideoPublico[]> {
  try {
    const filas = (await getDb()
      .select(COLUMNAS)
      .from(videosTienda)
      .innerJoin(tiendas, eq(tiendas.id, videosTienda.tiendaId))
      .where(and(visibles(mercado), sql`${videosTienda.id} <> ${actual.id}`))
      .orderBy(
        sql`CASE WHEN ${tiendas.slug} = ${actual.tiendaSlug} THEN 0 ELSE 1 END`,
        desc(videosTienda.creadoEn),
      )
      .limit(limite)) as Fila[];
    return filas.map((f) => aPublico(f, idioma));
  } catch (e) {
    console.error("[videos] no se pudieron leer los siguientes:", e);
    return [];
  }
}

/** Para el mapa del sitio: todos los publicados, con su fecha. */
export async function videosParaMapa(mercadoCodigo: string) {
  return getDb()
    .select({
      slug: videosTienda.slug,
      actualizadoEn: videosTienda.actualizadoEn,
    })
    .from(videosTienda)
    .innerJoin(tiendas, eq(tiendas.id, videosTienda.tiendaId))
    .where(
      and(
        eq(videosTienda.estado, "publicado"),
        eq(videosTienda.mercado, mercadoCodigo),
        eq(tiendas.estado, "activa"),
      ),
    );
}

/** Los de un comercio, para su panel (incluye borradores y ocultos). */
export async function videosDelPanel(tiendaId: string) {
  return getDb()
    .select({
      id: videosTienda.id,
      slug: videosTienda.slug,
      tituloEs: videosTienda.tituloEs,
      tituloEn: videosTienda.tituloEn,
      descripcionEs: videosTienda.descripcionEs,
      clave: videosTienda.clave,
      portadaClave: videosTienda.portadaClave,
      duracionSegundos: videosTienda.duracionSegundos,
      pesoBytes: videosTienda.pesoBytes,
      estado: videosTienda.estado,
      vistas: videosTienda.vistas,
      creadoEn: videosTienda.creadoEn,
    })
    .from(videosTienda)
    .where(eq(videosTienda.tiendaId, tiendaId))
    .orderBy(desc(videosTienda.creadoEn));
}

/** Una vista más. Nunca tumba la página: va en su propio try donde se llama. */
export async function sumarVista(id: string) {
  await getDb()
    .update(videosTienda)
    .set({ vistas: sql`${videosTienda.vistas} + 1` })
    .where(eq(videosTienda.id, id));
}

/** La semilla del día: estable, para que la lista se pueda recordar. */
function semillaDelDia(): number {
  return (Math.floor(Date.now() / 86_400_000) % 99_999) + 1;
}
