"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { esEquipoInterno, obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { tiendas, videosTienda } from "@/lib/db/schema";
import { mercadoActual } from "@/lib/mercado/actual";
import { mensajes } from "@/lib/mensajes";
import { borrarImagen, subirImagen } from "@/lib/subidas";
import {
  DURACION_MAXIMA_SEGUNDOS,
  extensionDeVideo,
  PESO_MAXIMO_BYTES,
  revisarVideo,
  slugDeVideo,
} from "@/lib/videos/reglas";

/**
 * SUBIR, EDITAR Y BORRAR LOS VIDEOS DE UNA TIENDA.
 *
 * La tienda sale del ALCANCE de la sesión, nunca del formulario: un comercio
 * solo puede subir a la suya. El equipo puede trabajar la de un comercio
 * concreto pasando su id, como en «Mi tienda».
 *
 * El archivo va directo al bucket con `put` en streaming: un video de 150 MB
 * no cabe en memoria de un worker del borde, y `arrayBuffer()` lo cargaría
 * entero. La portada se saca en el navegador (un fotograma del propio video) y
 * llega como imagen normal.
 */
export type ResultadoVideo =
  { ok: true; mensaje: string; slug: string } | { ok: false; mensaje: string };

async function tiendaDeLaSesion(
  formulario: FormData,
): Promise<{ id: string; slug: string } | null> {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return null;
  const db = getDb();
  if (alcance.tipo === "tienda") {
    const [t] = await db
      .select({ id: tiendas.id, slug: tiendas.slug })
      .from(tiendas)
      .where(eq(tiendas.id, alcance.tiendaId))
      .limit(1);
    return t ?? null;
  }
  if (!(await esEquipoInterno())) return null;
  const id = String(formulario.get("tiendaId") ?? "").trim();
  if (!id) return null;
  const [t] = await db
    .select({ id: tiendas.id, slug: tiendas.slug })
    .from(tiendas)
    .where(eq(tiendas.id, id))
    .limit(1);
  return t ?? null;
}

export async function subirVideoDeTienda(
  formulario: FormData,
): Promise<ResultadoVideo> {
  const t = await mensajes();
  const tienda = await tiendaDeLaSesion(formulario);
  if (!tienda) return { ok: false, mensaje: t("cuentaSinComercio") };

  const archivo = formulario.get("video");
  const titulo = String(formulario.get("tituloEs") ?? "").trim();
  const duracion = Math.round(Number(formulario.get("duracionSegundos")) || 0);

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, mensaje: t("videos.elige") };
  }
  /* La duración la mide el navegador antes de subir; si no llegó, no se acepta
     a ciegas: se pide volver a elegir el archivo. Aceptar un 0 sería dejar
     entrar videos de media hora. */
  if (duracion <= 0) return { ok: false, mensaje: t("videos.sinDuracion") };

  const revision = revisarVideo({
    tipo: archivo.type,
    bytes: archivo.size,
    duracionSegundos: duracion,
    titulo,
  });
  if (!revision.ok) {
    const motivos: Record<string, string> = {
      no_es_video: t("videos.noEsVideo"),
      muy_largo: t("videos.muyLargo", {
        minutos: Math.floor(DURACION_MAXIMA_SEGUNDOS / 60),
      }),
      muy_corto: t("videos.muyCorto"),
      muy_pesado: t("videos.muyPesado", {
        mb: Math.floor(PESO_MAXIMO_BYTES / 1024 / 1024),
      }),
      sin_titulo: t("videos.sinTitulo"),
    };
    return {
      ok: false,
      mensaje: motivos[revision.motivo] ?? t("revisaLosDatos"),
    };
  }

  const id = nanoid();
  const clave = `videos/${tienda.id}/${id}.${extensionDeVideo(archivo.type)}`;

  try {
    const { env } = getCloudflareContext();
    /**
     * EL ARCHIVO SE LE PASA TAL CUAL (es un `Blob`), NO como flujo.
     *
     * R2 acepta un Blob y sabe su tamaño, así que no hay que cargar los
     * megabytes en memoria ni declarar la longitud a mano. Los dos intentos
     * anteriores fallaron el 23 ago 2026: `archivo.stream()` a secas da
     * «Provided readable stream must have a known length», y `FixedLengthStream`
     * no existe en el runtime donde corre `next dev` («is not defined»).
     */
    await env.BUCKET.put(clave, archivo, {
      httpMetadata: {
        contentType: archivo.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("[videos] no se pudo guardar el archivo:", e);
    return {
      ok: false,
      mensaje: `${t("noSePudoGuardar")}: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  /* La portada: un fotograma que sacó el navegador. Si falta, la tarjeta se
     dibuja con el propio video como fondo (más lento, pero no se rompe). */
  let portadaClave: string | null = null;
  const portada = formulario.get("portada");
  if (portada instanceof File && portada.size > 0) {
    const subida = await subirImagen(portada, `videos/${tienda.id}/portadas`);
    if (subida.ok) portadaClave = subida.clave;
  }

  const slug = slugDeVideo(titulo, nanoid(6).toLowerCase());
  const mercado = await mercadoActual();

  try {
    await getDb()
      .insert(videosTienda)
      .values({
        id,
        tiendaId: tienda.id,
        slug,
        tituloEs: titulo.slice(0, 120),
        tituloEn:
          String(formulario.get("tituloEn") ?? "")
            .trim()
            .slice(0, 120) || null,
        descripcionEs:
          String(formulario.get("descripcionEs") ?? "")
            .trim()
            .slice(0, 600) || null,
        descripcionEn:
          String(formulario.get("descripcionEn") ?? "")
            .trim()
            .slice(0, 600) || null,
        clave,
        portadaClave,
        duracionSegundos: duracion,
        anchoPx: Math.round(Number(formulario.get("anchoPx")) || 0) || null,
        altoPx: Math.round(Number(formulario.get("altoPx")) || 0) || null,
        pesoBytes: archivo.size,
        productoId: String(formulario.get("productoId") ?? "").trim() || null,
        estado: "publicado",
        mercado: mercado.codigo,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      });
  } catch (e) {
    console.error("[videos] no se pudo guardar en la base:", e);
    return {
      ok: false,
      mensaje: `${t("noSePudoGuardar")}: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  revalidatePath("/[locale]/panel/videos", "page");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/tienda/[slug]", "page");
  return { ok: true, mensaje: t("videos.publicado"), slug };
}

export async function editarVideo(
  formulario: FormData,
): Promise<ResultadoVideo> {
  const t = await mensajes();
  const tienda = await tiendaDeLaSesion(formulario);
  if (!tienda) return { ok: false, mensaje: t("cuentaSinComercio") };
  const id = String(formulario.get("id") ?? "").trim();
  const titulo = String(formulario.get("tituloEs") ?? "").trim();
  if (!id || titulo.length < 3)
    return { ok: false, mensaje: t("videos.sinTitulo") };

  const db = getDb();
  const [actual] = await db
    .select({
      id: videosTienda.id,
      tiendaId: videosTienda.tiendaId,
      slug: videosTienda.slug,
    })
    .from(videosTienda)
    .where(eq(videosTienda.id, id))
    .limit(1);
  if (!actual || actual.tiendaId !== tienda.id)
    return { ok: false, mensaje: t("sinPermiso") };

  await db
    .update(videosTienda)
    .set({
      tituloEs: titulo.slice(0, 120),
      tituloEn:
        String(formulario.get("tituloEn") ?? "")
          .trim()
          .slice(0, 120) || null,
      descripcionEs:
        String(formulario.get("descripcionEs") ?? "")
          .trim()
          .slice(0, 600) || null,
      descripcionEn:
        String(formulario.get("descripcionEn") ?? "")
          .trim()
          .slice(0, 600) || null,
      estado: formulario.get("estado") === "oculto" ? "oculto" : "publicado",
      actualizadoEn: new Date(),
    })
    .where(eq(videosTienda.id, id));

  revalidatePath("/[locale]/panel/videos", "page");
  revalidatePath("/[locale]/video/[slug]", "page");
  revalidatePath("/[locale]/tienda/[slug]", "page");
  return { ok: true, mensaje: t("guardadoCorto"), slug: actual.slug };
}

export async function borrarVideo(id: string): Promise<ResultadoVideo> {
  const t = await mensajes();
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("cuentaSinComercio") };

  const db = getDb();
  const [actual] = await db
    .select({
      id: videosTienda.id,
      tiendaId: videosTienda.tiendaId,
      slug: videosTienda.slug,
      clave: videosTienda.clave,
      portadaClave: videosTienda.portadaClave,
    })
    .from(videosTienda)
    .where(eq(videosTienda.id, id))
    .limit(1);
  if (!actual) return { ok: false, mensaje: t("sinPermiso") };
  const suyo =
    alcance.tipo === "tienda"
      ? alcance.tiendaId === actual.tiendaId
      : await esEquipoInterno();
  if (!suyo) return { ok: false, mensaje: t("sinPermiso") };

  await db.delete(videosTienda).where(eq(videosTienda.id, id));
  /* El archivo se borra DESPUÉS de la fila: si falla el borrado del bucket,
     queda un archivo huérfano —molesto— pero nunca una ficha sin video. */
  try {
    const { env } = getCloudflareContext();
    await env.BUCKET.delete(actual.clave);
  } catch (e) {
    console.error("[videos] no se pudo borrar el archivo del bucket:", e);
  }
  await borrarImagen(actual.portadaClave);

  revalidatePath("/[locale]/panel/videos", "page");
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/tienda/[slug]", "page");
  return { ok: true, mensaje: t("videos.borrado"), slug: actual.slug };
}
