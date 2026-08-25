import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { TarjetaVideo } from "@/components/videos/tarjeta-video";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";
import { seccionPorSlug } from "@/lib/secciones/consultas";
import { rutaCanonica, SITIO } from "@/lib/sitio";
import { resumenSocialDe } from "@/lib/videos/social";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const idioma = locale === "en" ? "en" : "es";
  const datos = await seccionPorSlug(
    slug,
    await mercadoDeLaPeticion(),
    idioma,
  ).catch(() => null);
  if (!datos) return { title: SITIO.nombre };

  const { seccion } = datos;
  return {
    title: `${seccion.nombre} · ${SITIO.nombre}`,
    description: seccion.descripcion ?? undefined,
    alternates: rutaCanonica(`/seccion/${seccion.slug}`, locale),
    openGraph: {
      type: "website",
      title: `${seccion.nombre} · ${SITIO.nombre}`,
      description: seccion.descripcion ?? undefined,
      url: `${SITIO.url}/${locale}/seccion/${seccion.slug}`,
      siteName: SITIO.nombre,
    },
  };
}

/**
 * LA PÁGINA DE UNA SECCIÓN DE MERCATREN.
 *
 * Su propia dirección con su propio enlace, como cada guía de Docs: es lo que
 * se comparte y lo que indexa Google. «Tu Próximo Producto Ganador» es la
 * primera; vendrán más.
 */
export default async function PaginaSeccion({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("secciones");
  const idioma = locale === "en" ? "en" : "es";

  const datos = await seccionPorSlug(slug, await mercadoDeLaPeticion(), idioma);
  if (!datos) notFound();
  const { seccion, videos } = datos;

  const social = await resumenSocialDe(
    videos.map((v) => v.id),
    null,
  ).catch(() => new Map());

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8">
      <p className="text-xs font-bold tracking-wide text-carga-600 uppercase">
        {t("etiqueta")}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
        {seccion.nombre}
      </h1>
      {seccion.descripcion ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinta-suave">
          {seccion.descripcion}
        </p>
      ) : null}

      {videos.length === 0 ? (
        <p className="mt-10 text-sm text-tinta-suave">{t("todaviaVacia")}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {videos.map((v) => (
            <li key={v.id}>
              <TarjetaVideo
                video={v}
                corazones={social.get(v.id)?.corazones ?? 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
