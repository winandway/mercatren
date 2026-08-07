import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PaginaArticulo } from "@/components/articulos/pagina-articulo";
import { buscarArticulo, todosLosSlugs } from "@/contenido/articulos";
import { routing } from "@/i18n/routing";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    todosLosSlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const articulo = buscarArticulo(locale, slug);
  if (!articulo) return {};

  const ruta = `/blog/${slug}`;
  return {
    title: articulo.titulo,
    description: articulo.resumen,
    keywords: articulo.temas,
    alternates: rutaCanonica(ruta, locale),
    openGraph: {
      type: "article",
      title: `${articulo.titulo} · ${SITIO.nombre}`,
      description: articulo.resumen,
      url: `${SITIO.url}/${locale}${ruta}`,
      siteName: SITIO.nombre,
      publishedTime: articulo.fecha,
    },
  };
}

/** Una nota del blog. */
export default async function PaginaNota({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const articulo = buscarArticulo(locale, slug);
  /* Solo se sirven aquí las novedades: la documentación vive en /docs, y una
     misma página en dos direcciones le dice a Google que hay contenido
     duplicado. */
  if (!articulo || articulo.tipo !== "novedad") notFound();

  const t = await getTranslations("blog");

  return (
    <PaginaArticulo
      articulo={articulo}
      idioma={locale}
      volverA={{ href: "/blog", texto: t("volver") }}
    />
  );
}
