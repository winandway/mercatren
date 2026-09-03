import { and, desc, eq, sql } from "drizzle-orm";

import { recordadoEnElBorde } from "@/lib/cachecito";
import { repartirEntreTiendas, VIDEOS_POR_RONDA } from "@/lib/videos/reglas";
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
  vistas: videosTienda.vistas,
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
  vistas: number;
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
    vistas: f.vistas,
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
        sql`((ROW_NUMBER() OVER (PARTITION BY ${videosTienda.tiendaId} ORDER BY ${videosTienda.creadoEn} DESC) - 1) / ${sql.raw(String(VIDEOS_POR_RONDA))})`,
        sql`(tiendas.rowid * ${sql.raw(String(semillaDelDia()))}) % 104729`,
        desc(videosTienda.creadoEn),
      )
      .limit(limite)) as Fila[];
    return repartirEntreTiendas(
      filas.map((f) => aPublico(f, idioma)),
      (v) => v.tiendaId,
      semillaDelDia(),
    );
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
      /* ══ EL «SIGUIENTE Y SIGUIENTE» ERA DE UNA SOLA TIENDA (25 ago 2026) ══

         Antes esto ordenaba `CASE WHEN tienda = la del actual THEN 0`, o sea
         que ponía TODOS los videos de ese comercio primero: abrías uno de la
         ferretería y los diez siguientes eran de la ferretería. Con dos
         comercios no se nota; con veinte, quien entra a mirar ve siempre a la
         misma persona y se va.

         Ahora se reparte por rondas —los más nuevos de CADA tienda primero—,
         igual que el catálogo, y las tiendas se barajan con la semilla del
         día para que no mande siempre la misma. */
      .orderBy(
        sql`((ROW_NUMBER() OVER (PARTITION BY ${videosTienda.tiendaId} ORDER BY ${videosTienda.creadoEn} DESC) - 1) / ${sql.raw(String(VIDEOS_POR_RONDA))})`,
        sql`(tiendas.rowid * ${sql.raw(String(semillaDelDia()))}) % 104729`,
        desc(videosTienda.creadoEn),
      )
      .limit(limite)) as Fila[];
    /* Y se intercala DESPUÉS de consultar: el SQL reparte por rondas, pero
       dentro de una ronda pueden quedar dos del mismo comercio pegados al
       corte. Esto lo cose sin rehacer el orden. */
    return repartirEntreTiendas(
      filas.map((f) => aPublico(f, idioma)),
      (v) => v.tiendaId,
      semillaDelDia(),
    );
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

/**
 * Los videos para el MAPA DE VIDEOS de Google (3 sep 2026): portada,
 * título, descripción, archivo, duración, vistas y fecha. `videosParaMapa`
 * solo daba la dirección, y así Google no sabía que había un video detrás.
 * Las direcciones salen relativas (`/media/...`): la ruta les pone el dominio
 * de la petición, que es el que corresponde a cada país.
 */
export async function videosParaMapaCompleto(mercadoCodigo: string) {
  const filas = await getDb()
    .select({
      slug: videosTienda.slug,
      tituloEs: videosTienda.tituloEs,
      descripcionEs: videosTienda.descripcionEs,
      clave: videosTienda.clave,
      portadaClave: videosTienda.portadaClave,
      duracionSegundos: videosTienda.duracionSegundos,
      vistas: videosTienda.vistas,
      creadoEn: videosTienda.creadoEn,
      actualizadoEn: videosTienda.actualizadoEn,
      tiendaNombre: tiendas.nombre,
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
  return filas.map((f) => ({
    slug: f.slug,
    titulo: f.tituloEs,
    descripcion: f.descripcionEs?.trim() || `${f.tituloEs} — ${f.tiendaNombre}`,
    archivo: `${RUTA_MEDIA}/${f.clave}`,
    portada: direccionImagen({ url: null, clave: f.portadaClave }),
    duracionSegundos: Number(f.duracionSegundos ?? 0),
    vistas: Number(f.vistas ?? 0),
    creadoEn: f.creadoEn,
    actualizadoEn: f.actualizadoEn,
  }));
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

/** La semilla del día: estable, para que la lista se pueda recordar. */
function semillaDelDia(): number {
  return (Math.floor(Date.now() / 86_400_000) % 99_999) + 1;
}
