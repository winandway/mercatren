import {
  ArrowRight,
  BookOpen,
  FileText,
  Route,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BanderaEEUU } from "@/components/marca/bandera-eeuu";
import { articulosPorTipo } from "@/contenido/articulos";
import { MODELO_EN } from "@/contenido/docs/modelo.en";
import { MODELO_ES } from "@/contenido/docs/modelo.es";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { rutaCanonica, SITIO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/docs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "docs" });

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
 * El indice de la documentacion publica.
 *
 * Es la puerta que se abre de un clic cuando alguien pide "ensename como
 * funciona esto": sin cuenta, sin registro y sin buscar dentro del panel.
 */
export default async function PaginaDocs({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("docs");
  /* Las guías: los artículos de documentación, que se listan solos. Antes el
     índice era una lista a mano y el tutorial del W-8BEN-E —y el de crédito,
     que ya existía— no salían en ningún lado salvo por enlace directo. */
  const guias = articulosPorTipo(locale, "documentacion");
  const doc = locale === "en" ? MODELO_EN : MODELO_ES;

  const otros = [
    {
      href: "/como-funciona" as const,
      icono: Route,
      nombre: t("documentos.comoFunciona.nombre"),
      resumen: t("documentos.comoFunciona.resumen"),
      etiqueta: t("documentos.comoFunciona.etiqueta"),
    },
    {
      href: "/transparencia" as const,
      icono: ShieldCheck,
      nombre: t("documentos.transparencia.nombre"),
      resumen: t("documentos.transparencia.resumen"),
      etiqueta: t("documentos.transparencia.etiqueta"),
    },
  ];

  return (
    <>
      <header className="bg-riel-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("titulo")}
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/70">
            {t("entradilla")}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* El documento principal, destacado: es el que se ensena. */}
        <article className="rounded-2xl border border-borde p-5 sm:p-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-carga-500/10 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-carga-600 uppercase">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {t("documentos.modelo.etiqueta")}
          </p>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
            {doc.titulo}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-tinta-suave">
            {doc.resumen}
          </p>

          <p className="mt-4 text-xs text-tinta-suave">
            {t("version")} {doc.version} · {t("actualizado")} {doc.actualizado}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/docs/modelo-de-negocio"
              className="boton-principal gap-2"
            >
              {t("leer")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {/* La descarga del PDF está retirada: ese archivo dice «Windoce,
                LLC» 54 veces y nombra a otra empresa como operadora de la
                tienda. Se generó antes del cambio de sociedad y regenerarlo
                pasa por el abogado. Ver la nota en `docs/modelo-de-negocio`. */}
          </div>

          {/* Lo que el documento contesta. Sirve de resumen y le da a Google
              las preguntas con sus respuestas. */}
          <dl className="mt-7 grid gap-4 border-t border-borde pt-6 md:grid-cols-3">
            {doc.preguntas.map((p) => (
              <div key={p.pregunta}>
                <dt className="text-sm font-bold">{p.pregunta}</dt>
                <dd className="mt-1 text-sm leading-snug text-tinta-suave">
                  {p.respuesta}
                </dd>
              </div>
            ))}
          </dl>
        </article>

        {/* Los demas documentos publicos. */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {otros.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="group rounded-2xl border border-borde p-5 transition-colors hover:border-carga-500"
            >
              <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] text-tinta-suave uppercase">
                <d.icono className="h-3.5 w-3.5" aria-hidden />
                {d.etiqueta}
              </p>
              <h2 className="mt-3 font-bold group-hover:text-carga-600">
                {d.nombre}
              </h2>
              <p className="mt-1.5 text-sm leading-snug text-tinta-suave">
                {d.resumen}
              </p>
            </Link>
          ))}
        </div>

        {/**
         * LAS GUÍAS PARA COMERCIOS.
         *
         * Salen de `articulosPorTipo`, no de una lista escrita aquí: la
         * próxima guía que se publique aparece sola. El dueño manda estos
         * enlaces a los comercios, y un tutorial que solo existe por enlace
         * directo no lo encuentra quien lo necesita después.
         */}
        {guias.length > 0 ? (
          <section className="mt-10">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] text-carga-600 uppercase">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {t("guias.etiqueta")}
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">
              {t("guias.titulo")}
            </h2>
            <p className="mt-1 text-sm text-tinta-suave">
              {t("guias.entradilla")}
            </p>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {guias.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/docs/${g.slug}`}
                    className="group block h-full rounded-2xl border border-borde p-5 transition-colors hover:border-carga-500"
                  >
                    <h3 className="font-bold group-hover:text-carga-600">
                      {g.titulo}
                    </h3>
                    <p className="mt-1.5 text-sm leading-snug text-tinta-suave">
                      {g.resumen}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-carga-600">
                      {t("guias.leer")}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-tinta-suave">
          <BanderaEEUU className="mt-0.5 h-4 w-4" />
          {t("paraBancosTexto")}
        </p>
      </div>
    </>
  );
}
