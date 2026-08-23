import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { VisorVideos } from "@/components/videos/visor-videos";
import { comoJsonLd } from "@/lib/seo/datos-estructurados";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";
import { rutaCanonica, SITIO } from "@/lib/sitio";
import {
  siguientesEnElVisor,
  sumarVista,
  videoPorSlug,
} from "@/lib/videos/consultas";
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

  const siguientes = await siguientesEnElVisor(
    await mercadoDeLaPeticion(),
    idioma,
    { id: v.id, tiendaSlug: v.tiendaSlug },
    12,
  );

  /* Una vista más. En su propio try: contar nunca puede tumbar la página. */
  try {
    await sumarVista(v.id);
  } catch {
    /* si falla, no pasa nada */
  }

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
      <VisorVideos videos={[v, ...siguientes]} idioma={locale} />
    </>
  );
}
