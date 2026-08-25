import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import {
  VisorVideos,
  type VideoConSocial,
} from "@/components/videos/visor-videos";
import {
  esEquipoInterno,
  obtenerAlcance,
  obtenerUsuario,
} from "@/lib/autorizacion";
import { comentariosDe, resumenSocialDe } from "@/lib/videos/social";
import { comoJsonLd } from "@/lib/seo/datos-estructurados";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";
import { rutaCanonica, SITIO } from "@/lib/sitio";
import { siguientesEnElVisor, videoPorSlug } from "@/lib/videos/consultas";
import { personalizarVideos } from "@/lib/videos/personalizar";
import { duracionIso } from "@/lib/videos/reglas";

export const dynamic = "force-dynamic";

async function traer(locale: string, slug: string) {
  const idioma = locale === "en" ? "en" : "es";
  return videoPorSlug(await mercadoDeLaPeticion(), slug, idioma);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const v = await traer(locale, slug).catch(() => null);
  if (!v) return {};
  const titulo = `${v.titulo} · ${v.tiendaNombre}`;
  const descripcion =
    v.descripcion ??
    (locale === "en"
      ? `${v.tiendaNombre} shows its store on Mercatren. Watch the video and browse everything it sells.`
      : `${v.tiendaNombre} enseña su tienda en Mercatren. Mira el video y entra a ver todo lo que vende.`);
  const portada = v.portadaUrl ? `${SITIO.url}${v.portadaUrl}` : undefined;

  return {
    title: titulo,
    description: descripcion,
    alternates: rutaCanonica(`/video/${slug}`, locale),
    openGraph: {
      type: "video.other",
      title: titulo,
      description: descripcion,
      url: `${SITIO.url}/${locale}/video/${slug}`,
      siteName: SITIO.nombre,
      images: portada ? [portada] : undefined,
      videos: [{ url: `${SITIO.url}${v.url}`, type: "video/mp4" }],
    },
    twitter: {
      card: "player",
      title: titulo,
      description: descripcion,
      images: portada ? [portada] : undefined,
    },
  };
}

/**
 * LA PÁGINA DE UN SHORT: el visor a pantalla completa, con este video primero
 * y los siguientes debajo (primero los del mismo comercio). Cada video tiene
 * SU dirección — es lo que hace que Google lo indexe y que se pueda compartir.
 *
 * El `VideoObject` va aquí, con la portada, la duración en ISO y el enlace al
 * archivo: es lo que Google necesita para enseñar el video en sus resultados.
 */
export default async function PaginaVideo({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const idioma = locale === "en" ? "en" : "es";
  const v = await traer(locale, slug);
  if (!v) notFound();

  const siguientesSinOrdenar = await siguientesEnElVisor(
    await mercadoDeLaPeticion(),
    idioma,
    { id: v.id, tiendaSlug: v.tiendaSlug },
    12,
  );
  /* El «siguiente y siguiente» también sabe quién mira: los videos de sus
     comercios se adelantan. Reordena, no filtra. */
  const siguientes = await personalizarVideos(siguientesSinOrdenar);

  /* Aquí YA NO se suma la vista. Se sumaba al cargar la página y eso contaba
     recargas y robots; ahora la cuenta el visor cuando la persona lo miró de
     verdad (2 segundos delante) — y una página cargada dos veces no infla
     nada. Dejar los dos caminos era contar doble: lo destapó la propia
     prueba (+3 en una sola visita). */

  /* Lo social: corazones y comentarios. Quien no entró ve los números igual
     —son públicos—; lo que cambia es si el corazón sale marcado. */
  const usuario = await obtenerUsuario().catch(() => null);
  const alcance = await obtenerAlcance().catch(() => null);
  const [social, comentarios] = await Promise.all([
    resumenSocialDe(
      [v.id, ...siguientes.map((s) => s.id)],
      usuario?.id ?? null,
    ),
    comentariosDe(v.id, {
      id: usuario?.id ?? null,
      esEquipo: await esEquipoInterno().catch(() => false),
      tiendaId: alcance?.tipo === "tienda" ? alcance.tiendaId : null,
    }),
  ]);
  /* De qué sección es cada uno, si lo es: el visor cambia el nombre y el
     botón, que en una sección lleva a Mercatren y no a una tienda. */
  const { seccionDeCadaVideo } = await import("@/lib/secciones/consultas");
  const secciones = await seccionDeCadaVideo([
    v.id,
    ...siguientes.map((s) => s.id),
  ]).catch(() => new Map());

  const conSocial = (
    x: typeof v | (typeof siguientes)[number],
  ): VideoConSocial => {
    const sec = secciones.get(x.id);
    return {
      ...x,
      corazones: social.get(x.id)?.corazones ?? 0,
      meGusta: social.get(x.id)?.meGusta ?? false,
      comentarios: social.get(x.id)?.comentarios ?? 0,
      seccionSlug: sec?.slug ?? null,
      seccionNombre: sec
        ? (idioma === "en" ? sec.nombreEn : null)?.trim() || sec.nombreEs
        : null,
    };
  };

  const paraGoogle = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.titulo,
    description: v.descripcion ?? `${v.titulo} — ${v.tiendaNombre}`,
    thumbnailUrl: v.portadaUrl ? [`${SITIO.url}${v.portadaUrl}`] : undefined,
    uploadDate: v.creadoEn ?? undefined,
    duration:
      v.duracionSegundos > 0 ? duracionIso(v.duracionSegundos) : undefined,
    contentUrl: `${SITIO.url}${v.url}`,
    embedUrl: `${SITIO.url}/${locale}/video/${v.slug}`,
    width: v.anchoPx ?? undefined,
    height: v.altoPx ?? undefined,
    publisher: { "@type": "Organization", name: SITIO.nombre, url: SITIO.url },
    creator: {
      "@type": "Organization",
      name: v.tiendaNombre,
      url: `${SITIO.url}/${locale}/tienda/${v.tiendaSlug}`,
    },
    isFamilyFriendly: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: comoJsonLd(paraGoogle) }}
      />
      <VisorVideos
        videos={[conSocial(v), ...siguientes.map(conSocial)]}
        idioma={locale}
        comentariosDelPrimero={comentarios}
      />
    </>
  );
}
