import { getTranslations, setRequestLocale } from "next-intl/server";

import { BarraDocs } from "@/components/docs/barra-docs";
import { MigasDocs } from "@/components/docs/migas-docs";
import { articulosPorTipo } from "@/contenido/articulos";
import { entradasDeDocs } from "@/lib/docs/indice";

/**
 * DOCS: LA BARRA IZQUIERDA NUNCA SE PIERDE (regla del dueño, 23 ago 2026).
 *
 * Esta carpeta es un GRUPO DE RUTAS `(docs)`: las páginas que cuelgan de Docs
 * —el índice, cada guía, el modelo, y también cómo funciona, transparencia,
 * entrega, devoluciones, ayuda, vender, términos, privacidad, quiénes somos—
 * viven aquí adentro y conservan su URL de siempre (/como-funciona sigue
 * siendo /como-funciona). Lo que cambia es que todas se dibujan con la barra
 * lateral al lado: tocas a la izquierda, cambia la derecha, la URL cambia, y
 * el menú sigue ahí con el ítem activo resaltado, como en WordPress.
 *
 * Antes la barra solo existía dentro de /docs: al tocar «Cómo funciona» la
 * persona caía en una página sin barra y sin flecha. Palabras del dueño:
 * «donde yo toco del lado izquierdo, me saca el menú, se pierde para
 * siempre». Arriba del contenido va «← Docs», para el celular.
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
      <div className="min-w-0">
        <MigasDocs entradas={entradas} />
        {children}
      </div>
    </div>
  );
}
