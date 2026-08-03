import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PaginaDeContenido } from "@/components/paginas/pagina-contenido";
import { NOSOTROS_EN, NOSOTROS_ES } from "@/contenido/paginas/nosotros";
import { routing } from "@/i18n/routing";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/nosotros";

function contenido(locale: string) {
  return locale === "en" ? NOSOTROS_EN : NOSOTROS_ES;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pagina = contenido(locale);

  return {
    title: pagina.titulo,
    description: pagina.entradilla,
    alternates: rutaCanonica(RUTA, locale),
    openGraph: {
      type: "website",
      title: `${pagina.titulo} · ${SITIO.nombre}`,
      description: pagina.entradilla,
      url: `${SITIO.url}/${locale}${RUTA}`,
      siteName: SITIO.nombre,
    },
  };
}

/** Quienes somos: la empresa y el problema que resuelve. */
export default async function Pagina({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaginaDeContenido pagina={contenido(locale)} />;
}
