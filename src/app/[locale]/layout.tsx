import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";

import { Proveedores } from "@/components/proveedores";
import { RegistroAppInstalable } from "@/components/registro-app-instalable";
import { ESPACIOS_QUE_NO_VIAJAN } from "@/i18n/espacios";
import { comoJsonLd } from "@/lib/seo/datos-estructurados";
import { mercadoActual } from "@/lib/mercado/actual";
import { esMercadoPrincipal, marcaDelMercado } from "@/lib/mercado/mercados";
import { routing } from "@/i18n/routing";
import { SITIO } from "@/lib/sitio";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "marca" });

  /**
   * LA MINIATURA HABLA EL IDIOMA DEL DOMINIO (17 ago 2026).
   *
   * Al compartir mercatren.cl por WhatsApp, la tarjeta decía «Compra en
   * Estados Unidos» — el lema del mercado principal en el enlace chileno.
   * Fuera del principal, la marca es el dominio («Mercatren.cl») y el lema
   * no menciona ningún otro país.
   *
   * OJO: esto solo alcanza a las páginas DINÁMICAS (la portada lo es). Las
   * prerenderizadas se hornean con el mercado principal y se sirven iguales
   * en los dos dominios — está anotado en la fase 3 de PLAN-PAISES.md.
   */
  const mercado = await mercadoActual();
  const principal = esMercadoPrincipal(mercado);
  const marca = principal ? t("nombre") : marcaDelMercado(mercado);
  const lema = principal
    ? t("lema")
    : t("lemaMercadoNuevo", { pais: mercado.nombre });
  const titulo = `${marca} — ${lema}`;
  /* La IMAGEN de la tarjeta también es del mercado: el principal conserva su
     logotipo con «.com» dibujado; los demás llevan el logo oficial sin
     dominio y el suyo escrito debajo (ver scripts/generar-iconos.mjs). */
  const tarjeta = principal
    ? "/og.png"
    : `/og-${mercado.codigo.toLowerCase()}.png`;

  return {
    metadataBase: new URL(principal ? SITIO.url : `https://${mercado.dominio}`),
    title: {
      default: titulo,
      template: `%s | ${marca}`,
    },
    description: lema,
    applicationName: marca,
    manifest: "/manifest.webmanifest",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: "/es",
        en: "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: marca,
      title: titulo,
      description: lema,
      url: `/${locale}`,
      locale:
        locale === "es" ? `es_${principal ? "US" : mercado.codigo}` : "en_US",
      images: [
        {
          url: tarjeta,
          width: 1200,
          height: 630,
          alt: marca,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: lema,
      images: [tarjeta],
    },
    appleWebApp: {
      capable: true,
      title: marca,
      statusBarStyle: "black-translucent",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b1c2c",
  width: "device-width",
  initialScale: 1,
};

export default async function LayoutIdioma({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  /**
   * AL NAVEGADOR VIAJA SOLO LO QUE EL NAVEGADOR USA. El paquete completo de
   * textos pesa 65 KB por idioma y la mitad es el panel de administración:
   * embeberlo en cada página pública era peso muerto en cada visita. Los
   * espacios de la lista se quedan en el servidor; el layout del panel
   * re-provee los mensajes completos para sus propias pantallas.
   */
  const mensajes = await getMessages();
  const excluidos: readonly string[] = ESPACIOS_QUE_NO_VIAJAN;
  const mensajesPublicos = Object.fromEntries(
    Object.entries(mensajes).filter(
      ([espacio]) => !excluidos.includes(espacio),
    ),
  ) as typeof mensajes;

  /**
   * La ficha de la organizacion para Google: Mercatren es la marca y la
   * sociedad la que la opera. Una sola vez, en el layout.
   *
   * LA DIRECCION ES LA DEL DOMINIO POR EL QUE SE ENTRO. Declarar
   * `mercatren.com` desde mercatren.cl le dice a Google que la pagina chilena
   * pertenece al sitio estadounidense — justo la señal que hace que un dominio
   * nuevo no arranque nunca.
   */
  const mercado = await mercadoActual();
  const base = esMercadoPrincipal(mercado)
    ? SITIO.url
    : `https://${mercado.dominio}`;
  const fichaOrganizacion = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: esMercadoPrincipal(mercado) ? SITIO.nombre : marcaDelMercado(mercado),
    legalName: SITIO.sociedad,
    url: base,
    logo: `${base}/icon-512.png`,
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* ARD: el manifiesto de capacidades para agentes. React lo sube al <head>. */}
        <link rel="ai-catalog" href="/.well-known/ai-catalog.json" />
        <script
          type="application/ld+json"
          // Todo el JSON-LD del sitio pasa por `comoJsonLd`, que lo escapa
          // para que ningún texto pueda cerrar esta etiqueta antes de tiempo.
          dangerouslySetInnerHTML={{ __html: comoJsonLd(fichaOrganizacion) }}
        />
        <NextIntlClientProvider messages={mensajesPublicos}>
          <Proveedores>
            {children}
            <RegistroAppInstalable />
          </Proveedores>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
