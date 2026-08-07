import { ArrowLeft, CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CuerpoArticulo } from "@/components/articulos/cuerpo-articulo";
import type { Articulo } from "@/contenido/articulos/tipos";
import { Link } from "@/i18n/navigation";
import { fechaCorta } from "@/lib/fechas";
import { comoJsonLd } from "@/lib/seo/datos-estructurados";
import { SITIO } from "@/lib/sitio";

/**
 * Un artículo, pintado.
 *
 * Vale para el blog y para la documentación: son lo mismo con distinta portada.
 * Tener dos plantillas casi iguales termina en que una se queda vieja.
 *
 * LLEVA SU DATO ESTRUCTURADO. Sin él, Google ve texto suelto; con él, entiende
 * que es un artículo, de qué fecha y de quién — y eso es lo que hace que salga
 * en los resultados con su ficha.
 */
export async function PaginaArticulo({
  articulo,
  idioma,
  volverA,
}: {
  articulo: Articulo;
  idioma: string;
  volverA: { href: string; texto: string };
}) {
  const t = await getTranslations("blog");

  const ficha = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articulo.titulo,
    description: articulo.resumen,
    datePublished: articulo.fecha,
    dateModified: articulo.fecha,
    inLanguage: idioma,
    keywords: articulo.temas.join(", "),
    author: { "@type": "Organization", name: SITIO.sociedad },
    publisher: {
      "@type": "Organization",
      name: SITIO.nombre,
      url: SITIO.url,
    },
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        // El contenido lo escribimos nosotros, pero se escapa igual: es la
        // regla del proyecto y cuesta cero.
        dangerouslySetInnerHTML={{ __html: comoJsonLd(ficha) }}
      />

      <Link
        href={volverA.href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta-suave hover:text-carga-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {volverA.texto}
      </Link>

      <header className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight">{articulo.titulo}</h1>
        <p className="mt-2 text-lg text-tinta-suave">{articulo.resumen}</p>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-tinta-suave">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          <time dateTime={articulo.fecha}>
            {t("publicado", {
              fecha: fechaCorta(articulo.fecha, idioma) ?? articulo.fecha,
            })}
          </time>
        </p>
      </header>

      <div className="mt-9">
        <CuerpoArticulo bloques={articulo.cuerpo} />
      </div>

      {articulo.enlaces?.length ? (
        <footer className="mt-10 border-t border-borde pt-6">
          <p className="text-sm font-semibold">{t("verTambien")}</p>
          <ul className="mt-2 space-y-1.5">
            {articulo.enlaces.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="text-sm font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  );
}
