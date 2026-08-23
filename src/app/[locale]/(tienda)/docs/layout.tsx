import { getTranslations, setRequestLocale } from "next-intl/server";

import { BarraDocs } from "@/components/docs/barra-docs";
import { articulosPorTipo } from "@/contenido/articulos";
import { entradasDeDocs } from "@/lib/docs/indice";

/**
 * DOCS: la barra lateral a la izquierda y el contenido a la derecha, en todas
 * las páginas de /docs (el índice, cada guía y el modelo de negocio). Como la
 * de YaDominios, con los colores de la casa. Así desde cualquier guía se ve
 * el resto y se puede buscar sin volver al índice.
 */
export default async function LayoutDocs({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("docs");
  const entradas = entradasDeDocs(
    articulosPorTipo(locale, "documentacion"),
    (clave, campo) => t(`enlaces.${clave}.${campo}`),
  );

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:py-10">
      <BarraDocs entradas={entradas} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
