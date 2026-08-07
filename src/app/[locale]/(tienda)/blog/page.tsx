import { ArrowRight, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { articulosPorTipo } from "@/contenido/articulos";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { fechaCorta } from "@/lib/fechas";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return {
    title: t("titulo"),
    description: t("entradilla"),
    alternates: rutaCanonica(RUTA, locale),
    openGraph: {
      type: "website",
      title: `${t("titulo")} · ${SITIO.nombre}`,
      description: t("entradilla"),
      url: `${SITIO.url}/${locale}${RUTA}`,
      siteName: SITIO.nombre,
    },
  };
}

/**
 * Las novedades de Mercatren.
 *
 * Cada nota es su propia página con su dirección y sus dos idiomas, y entra
 * sola al mapa del sitio. Publicar aquí suma para Google; escribirlo todo
 * dentro de una sola página larga no suma nada.
 */
export default async function PaginaBlog({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("blog");
  const notas = articulosPorTipo(locale, "novedad");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-2 text-lg text-tinta-suave">{t("entradilla")}</p>
      </header>

      {notas.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-borde px-6 py-16 text-center">
          <Newspaper
            className="mx-auto h-10 w-10 text-tinta-suave"
            aria-hidden
          />
          <p className="mt-3 text-sm text-tinta-suave">{t("vacio")}</p>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {notas.map((n) => (
            <li key={n.slug}>
              <Link
                href={`/blog/${n.slug}`}
                className="block rounded-xl border border-borde p-5 transition-colors hover:border-carga-500"
              >
                <time
                  dateTime={n.fecha}
                  className="text-xs font-semibold text-carga-600 uppercase"
                >
                  {fechaCorta(n.fecha, locale)}
                </time>
                <h2 className="mt-1.5 text-xl font-bold tracking-tight">
                  {n.titulo}
                </h2>
                <p className="mt-1.5 text-sm text-tinta-suave">{n.resumen}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-riel-700">
                  {t("leer")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
