import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { PaginaDeContenido } from "@/components/paginas/pagina-contenido";
import { VENDER_EN, VENDER_ES } from "@/contenido/paginas/vender";
import {
  VENDER_ESPANA_EN,
  VENDER_ESPANA_ES,
} from "@/contenido/paginas/vender-espana";
import { mercadoActual } from "@/lib/mercado/actual";
import { routing } from "@/i18n/routing";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/vender";

/* España tiene su propia versión (27 oct 2026): la de siempre promete
   cobrar en dólares en un banco de Estados Unidos. */
async function contenido(locale: string) {
  const espana = (await mercadoActual()).codigo === "ES";
  if (espana) return locale === "en" ? VENDER_ESPANA_EN : VENDER_ESPANA_ES;
  return locale === "en" ? VENDER_EN : VENDER_ES;
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

/** La pagina para el comercio que evalua vender aqui. Va en el menu de arriba. */
export default async function Pagina({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaginaDeContenido pagina={await contenido(locale)} />;
}
