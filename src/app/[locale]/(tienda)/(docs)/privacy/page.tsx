import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PaginaDeContenido } from "@/components/paginas/pagina-contenido";
import { PRIVACIDAD_EN, PRIVACIDAD_ES } from "@/contenido/paginas/privacidad";
import { conLegalesDelPais } from "@/contenido/paginas/legales-por-pais";
import { paraElMercado } from "@/contenido/paginas/por-mercado";
import { routing } from "@/i18n/routing";
import { mercadoActual } from "@/lib/mercado/actual";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/privacy";

/** Cada país enseña sus secciones (España, Venezuela): ver `por-mercado.ts`. */
async function contenido(locale: string) {
  const mercado = await mercadoActual();
  /* Y, al final, las secciones legales propias del país (España,
     Venezuela) cuando estén listas: ver `legales-por-pais.ts`. */
  return conLegalesDelPais(
    paraElMercado(
      locale === "en" ? PRIVACIDAD_EN : PRIVACIDAD_ES,
      mercado.codigo,
    ),
    "privacidad",
    mercado.codigo,
    locale === "en" ? "en" : "es",
  );
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

/** La politica de privacidad. */
export default async function Pagina({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaginaDeContenido pagina={await contenido(locale)} />;
}
