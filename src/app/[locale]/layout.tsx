import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Encabezado } from "@/components/layout/encabezado";
import { PiePagina } from "@/components/layout/pie-pagina";
import { Proveedores } from "@/components/proveedores";
import { RegistroAppInstalable } from "@/components/registro-app-instalable";
import { routing } from "@/i18n/routing";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITIO_URL = process.env.NEXT_PUBLIC_SITIO_URL ?? "https://mercatren.com";

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
  const titulo = `${t("nombre")} — ${t("lema")}`;

  return {
    metadataBase: new URL(SITIO_URL),
    title: {
      default: titulo,
      template: `%s | ${t("nombre")}`,
    },
    description: t("lema"),
    applicationName: t("nombre"),
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
      siteName: t("nombre"),
      title: titulo,
      description: t("lema"),
      url: `/${locale}`,
      locale: locale === "es" ? "es_US" : "en_US",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: t("nombre"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: t("lema"),
      images: ["/og.png"],
    },
    appleWebApp: {
      capable: true,
      title: t("nombre"),
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

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <Proveedores>
            <Encabezado />
            <main className="flex-1">{children}</main>
            <PiePagina />
            <RegistroAppInstalable />
          </Proveedores>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
