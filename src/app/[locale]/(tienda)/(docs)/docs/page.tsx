import { ArrowRight, ExternalLink, FileText } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BanderaEEUU } from "@/components/marca/bandera-eeuu";
import { BuscadorDocs } from "@/components/docs/buscador-docs";
import { iconoDeSeccion } from "@/components/docs/barra-docs";
import { articulosPorTipo } from "@/contenido/articulos";
import { MODELO_EN } from "@/contenido/docs/modelo.en";
import { MODELO_ES } from "@/contenido/docs/modelo.es";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { entradasDeDocs, porSeccion, SECCIONES } from "@/lib/docs/indice";
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
 * LA PORTADA DE DOCS (23 ago 2026): buscador grande arriba, y debajo cada
 * sección con su ícono, su línea de entrada y sus guías en tarjetas — título y
 * resumen, cada una con su enlace fijo para poder pasárselo a alguien como
 * soporte. Estilo Wikipedia: nada vive solo dentro de esta página; todo es su
 * propia página. El documento del modelo de negocio va destacado en «Empieza
 * aquí», que es el que se le enseña a un banco.
 */
export default async function PaginaDocs({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("docs");
  const doc = locale === "en" ? MODELO_EN : MODELO_ES;
  const entradas = entradasDeDocs(
    articulosPorTipo(locale, "documentacion"),
    (clave, campo) => t(`enlaces.${clave}.${campo}`),
  );
  const grupos = porSeccion(entradas);

  return (
    <>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-riel-900 sm:text-4xl">
          {t("titulo")}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-tinta-suave">
          {t("entradilla")}
        </p>
        <div className="mt-6">
          <BuscadorDocs entradas={entradas} grande />
        </div>
      </header>

      {/* El documento principal, destacado: es el que se enseña. */}
      <article className="mt-10 rounded-2xl border border-riel-900/15 bg-riel-900 p-5 text-white sm:p-7">
        <p className="inline-flex items-center gap-2 rounded-full bg-carga-500/20 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-carga-400 uppercase">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          {t("documentos.modelo.etiqueta")}
        </p>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
          {doc.titulo}
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-white/75">
          {doc.resumen}
        </p>
        <p className="mt-3 text-xs text-white/60">
          {t("version")} {doc.version} · {t("actualizado")} {doc.actualizado}
        </p>
        <Link
          href="/docs/modelo-de-negocio"
          className="boton-principal mt-5 gap-2"
        >
          {t("leer")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </article>

      {SECCIONES.map((s) => {
        const lista = grupos[s.id];
        if (lista.length === 0) return null;
        const Icono = iconoDeSeccion(s.icono);
        return (
          <section key={s.id} id={s.id} className="mt-12 scroll-mt-24">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-carga-500/10 text-carga-600">
                <Icono className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-riel-900">
                  {t(`secciones.${s.id}.titulo`)}
                </h2>
                <p className="mt-0.5 text-sm text-tinta-suave">
                  {t(`secciones.${s.id}.entradilla`)}
                </p>
              </div>
            </div>
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {lista.map((e) => {
                const cuerpo = (
                  <>
                    <h3 className="font-bold text-riel-900 group-hover:text-carga-600">
                      {e.titulo}
                      {e.externo ? (
                        <ExternalLink
                          className="ml-1.5 inline h-3.5 w-3.5 text-tinta-suave"
                          aria-hidden
                        />
                      ) : null}
                    </h3>
                    <p className="mt-1.5 text-sm leading-snug text-tinta-suave">
                      {e.resumen}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-carga-600">
                      {e.esGuia ? t("guias.leer") : t("abrir")}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </>
                );
                const clases =
                  "group block h-full rounded-2xl border border-borde bg-white p-5 transition-colors hover:border-carga-500";
                return (
                  <li key={e.href}>
                    {e.externo ? (
                      <a href={e.href} className={clases}>
                        {cuerpo}
                      </a>
                    ) : (
                      <Link href={e.href} className={clases}>
                        {cuerpo}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <p className="mt-12 flex items-start gap-2 text-xs leading-relaxed text-tinta-suave">
        <BanderaEEUU className="mt-0.5 h-4 w-4" />
        {t("paraBancosTexto")}
      </p>
    </>
  );
}
