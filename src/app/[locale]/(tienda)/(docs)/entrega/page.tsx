import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PaginaDeContenido } from "@/components/paginas/pagina-contenido";
import { ENTREGA_EN, ENTREGA_ES } from "@/contenido/paginas/entrega";
import { ENTREGA_US_EN, ENTREGA_US_ES } from "@/contenido/paginas/entrega-us";
import { routing } from "@/i18n/routing";
import { mercadoActual } from "@/lib/mercado/actual";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/entrega";

/**
 * CADA DOMINIO CUENTA SU ENTREGA (20 sep 2026). mercatren.com enseñaba la de
 * Venezuela —retiro en el depósito y «No enviamos a Estados Unidos»— siendo la
 * tienda que vende y envía solo en Estados Unidos. Ver `entrega-us.ts`.
 */
async function contenido(locale: string) {
  const mercado = await mercadoActual();
  if (mercado.codigo === "US") {
    return locale === "en" ? ENTREGA_US_EN : ENTREGA_US_ES;
  }
  return locale === "en" ? ENTREGA_EN : ENTREGA_ES;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pagina = await contenido(locale);

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

export default async function Pagina({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaginaDeContenido pagina={await contenido(locale)} />;
}
