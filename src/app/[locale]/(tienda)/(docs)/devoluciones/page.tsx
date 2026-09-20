import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PaginaDeContenido } from "@/components/paginas/pagina-contenido";
import {
  DEVOLUCIONES_EN,
  DEVOLUCIONES_ES,
} from "@/contenido/paginas/devoluciones";
import { paraElMercado } from "@/contenido/paginas/por-mercado";
import { routing } from "@/i18n/routing";
import { mercadoActual } from "@/lib/mercado/actual";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/devoluciones";

/** Cada dominio enseña las secciones de su país: ver `por-mercado.ts`. */
async function contenido(locale: string) {
  const mercado = await mercadoActual();
  return paraElMercado(
    locale === "en" ? DEVOLUCIONES_EN : DEVOLUCIONES_ES,
    mercado.codigo,
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

export default async function Pagina({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaginaDeContenido pagina={await contenido(locale)} />;
}
