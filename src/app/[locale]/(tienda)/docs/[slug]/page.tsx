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

  const ruta = `/docs/${slug}`;
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

/**
 * Una página de la documentación.
 *
 * OJO CON EL ORDEN DE LAS RUTAS: `/docs/modelo-de-negocio` es una página propia
 * y gana sobre esta, porque una ruta escrita a mano tiene prioridad sobre una
 * dinámica. Por eso aquel documento sigue funcionando igual.
 */
export default async function PaginaDoc({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const articulo = buscarArticulo(locale, slug);
  if (!articulo || articulo.tipo !== "documentacion") notFound();

  const t = await getTranslations("docs");

  return (
    <PaginaArticulo
      articulo={articulo}
      idioma={locale}
      volverA={{ href: "/docs", texto: t("titulo") }}
    />
  );
}
