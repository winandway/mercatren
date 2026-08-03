import { ChevronRight, Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Bloques } from "@/components/docs/bloques";
import { BanderaEEUU } from "@/components/marca/bandera-eeuu";
import { MODELO_EN } from "@/contenido/docs/modelo.en";
import { MODELO_ES } from "@/contenido/docs/modelo.es";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SITIO, rutaCanonica, PDF_MODELO } from "@/lib/sitio";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RUTA = "/docs/modelo-de-negocio";

function documento(locale: string) {
  return locale === "en" ? MODELO_EN : MODELO_ES;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const doc = documento(locale);

  return {
    title: doc.titulo,
    description: doc.resumen,
    keywords:
      locale === "en"
        ? [
            "cross-border ecommerce",
            "domestic settlement",
            "collection agent",
            "not a remittance",
            "purchasing agent platform",
            "Mercatren",
          ]
        : [
            "ecommerce transfronterizo",
            "comercio electrónico transnacional",
            "liquidación doméstica",
            "agente de cobro",
            "no es una remesa",
            "agente de compras internacional",
            "Mercatren",
          ],
    alternates: rutaCanonica(RUTA, locale),
    openGraph: {
      type: "article",
      title: doc.titulo,
      description: doc.resumen,
      url: `${SITIO.url}/${locale}${RUTA}`,
      siteName: SITIO.nombre,
    },
  };
}

/**
 * El documento del modelo de negocio, en publico y sin registro.
 *
 * Esta pagina existe por dos motivos. El primero es que cualquiera —un banco,
 * un socio, un cliente— pueda entender la operacion sin pedirnos nada y sin
 * entrar con una cuenta. El segundo es posicionarnos en Google como los
 * autores de este modelo.
 *
 * QUE SE PUBLICA Y QUE NO: aqui va la parte comercial del documento (que es,
 * quien es quien, el ciclo, la evidencia, los costos y la economia). Los
 * apartados de encuadre regulatorio, controles internos y plan de crecimiento
 * NO se publican: van en el PDF completo, que se entrega bajo pedido. Son
 * analisis honestos y sin contexto se leen mal.
 */
export default async function PaginaModeloDeNegocio({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("docs");
  const doc = documento(locale);

  // Datos estructurados: es como Google entiende que esto es un documento con
  // autor y fecha, y como puede mostrar las preguntas en los resultados.
  const datosEstructurados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: doc.titulo,
        description: doc.resumen,
        inLanguage: locale,
        datePublished: "2026-08-03",
        dateModified: "2026-08-03",
        author: { "@type": "Organization", name: SITIO.sociedad },
        publisher: {
          "@type": "Organization",
          name: SITIO.nombre,
          url: SITIO.url,
        },
        mainEntityOfPage: `${SITIO.url}/${locale}${RUTA}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: doc.preguntas.map((p) => ({
          "@type": "Question",
          name: p.pregunta,
          acceptedAnswer: { "@type": "Answer", text: p.respuesta },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // El contenido lo generamos nosotros aqui mismo; no viene de fuera.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />

      {/* Portada del documento. */}
      <header className="bg-riel-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-white/60">
            <Link href="/docs" className="hover:text-white">
              {t("volver")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="text-white/90">{doc.version}</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase">
              <BanderaEEUU className="h-3.5 w-3.5" />
              {SITIO.sociedad}
            </p>

            <h1 className="mt-5 text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {doc.titulo}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
              {doc.subtitulo}
            </p>

            <p className="mt-6 text-xs text-white/50">
              {t("version")} {doc.version} · {t("actualizado")}{" "}
              {doc.actualizado}
            </p>

            <a
              href={PDF_MODELO}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-carga-500 px-5 py-2.5 text-sm font-semibold text-riel-950 transition-colors hover:bg-carga-600"
            >
              <Download className="h-4 w-4" aria-hidden />
              {t("descargar")}
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-12">
          {/* Indice lateral: en el telefono va arriba, plegado. */}
          <nav
            aria-label={t("indice")}
            className="lg:sticky lg:top-6 lg:self-start"
          >
            <p className="text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase">
              {t("indice")}
            </p>
            <ol className="mt-3 space-y-1.5 border-l border-borde">
              {doc.secciones.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px flex gap-2 border-l-2 border-transparent py-1 pl-3 text-sm text-tinta-suave transition-colors hover:border-carga-500 hover:text-tinta"
                  >
                    <span className="font-bold text-carga-500">{s.numero}</span>
                    <span className="leading-snug">{s.titulo}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="mt-10 min-w-0 lg:mt-0">
            {/* Resumen ejecutivo. */}
            <section>
              {doc.entradilla.map((p) => (
                <p key={p} className="text-lg leading-relaxed">
                  {p}
                </p>
              ))}

              <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {doc.cifras.map((c) => (
                  <div
                    key={c.texto}
                    className="border-l-2 border-carga-500 pl-3"
                  >
                    <dt className="text-2xl font-extrabold">{c.valor}</dt>
                    <dd className="mt-1 text-xs leading-snug text-tinta-suave">
                      {c.texto}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 rounded-xl bg-slate-50 p-5 sm:p-6">
                <p className="text-xs font-bold tracking-[0.08em] text-carga-600 uppercase">
                  {locale === "en"
                    ? "The three things to remember"
                    : "Las tres ideas que hay que retener"}
                </p>
                <div className="mt-3 space-y-3">
                  {doc.ideasClave.map((idea) => (
                    <p key={idea.titulo} className="text-sm leading-relaxed">
                      <strong className="font-bold">{idea.titulo}.</strong>{" "}
                      {idea.texto}
                    </p>
                  ))}
                </div>
              </div>
            </section>

            {/* Los apartados. */}
            {doc.secciones.map((seccion) => (
              <section
                key={seccion.id}
                id={seccion.id}
                className="mt-14 scroll-mt-6 border-t border-borde pt-8"
              >
                <h2 className="flex gap-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  <span className="text-carga-500">{seccion.numero}</span>
                  <span className="text-balance">{seccion.titulo}</span>
                </h2>
                <Bloques bloques={seccion.bloques} figuras={doc.figuras} />
              </section>
            ))}

            {/* Las tres preguntas. Son las mismas que van a los datos
                estructurados, para que Google pueda mostrarlas. */}
            <section className="mt-14 border-t border-borde pt-8">
              <h2 className="text-xl font-extrabold tracking-tight">
                {doc.preguntasTitulo}
              </h2>
              <dl className="mt-5 divide-y divide-borde rounded-xl border border-borde">
                {doc.preguntas.map((p) => (
                  <div key={p.pregunta} className="p-4 sm:p-5">
                    <dt className="font-bold">{p.pregunta}</dt>
                    <dd className="mt-1.5 leading-relaxed text-tinta-suave">
                      {p.respuesta}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Cierre: el PDF completo, para quien necesita los apartados que
                no se publican. */}
            <section className="mt-10 rounded-xl border border-borde bg-slate-50 p-5 sm:p-6">
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-carga-600 uppercase">
                <FileText className="h-4 w-4" aria-hidden />
                {t("paraBancos")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
                {t("paraBancosTexto")}
              </p>
              <a
                href={PDF_MODELO}
                className="boton-principal mt-4 gap-2"
                data-descarga="modelo-de-negocio"
              >
                <Download className="h-4 w-4" aria-hidden />
                {t("descargar")}
              </a>
              <p className="mt-2 text-xs text-tinta-suave">
                {t("descargarNota")}
              </p>
            </section>

            <p className="mt-8 text-xs leading-relaxed text-tinta-suave">
              {doc.aviso}
            </p>
          </article>
        </div>
      </div>
    </>
  );
}
