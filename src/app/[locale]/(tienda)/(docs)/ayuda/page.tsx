import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FormularioAyuda } from "@/components/ayuda/formulario-ayuda";
import { PaginaDeContenido } from "@/components/paginas/pagina-contenido";
import { AYUDA_EN, AYUDA_ES } from "@/contenido/paginas/ayuda";
import { routing } from "@/i18n/routing";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/ayuda";

function contenido(locale: string) {
  return locale === "en" ? AYUDA_EN : AYUDA_ES;
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

/** Centro de ayuda con las preguntas mas comunes. */
export default async function Pagina({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ayuda.formulario");

  return (
    <>
      <PaginaDeContenido pagina={contenido(locale)} />
      {/* EL FORMULARIO DE AYUDA (1 nov 2026): el mensaje va a la bandeja de
          soporte, sin depender del correo de Mercatren. Ver
          `lib/soporte/bandeja.ts`. */}
      <section id="escribenos" className="mx-auto max-w-5xl px-4 pb-16">
        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight">{t("titulo")}</h2>
          <p className="mt-1 mb-5 text-sm text-tinta-suave">
            {t("entradilla")}
          </p>
          <FormularioAyuda />
        </div>
      </section>
    </>
  );
}
