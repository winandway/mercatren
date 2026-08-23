"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { Link } from "@/i18n/navigation";
import type { EntradaDocs } from "@/lib/docs/indice";

/**
 * «← Docs › Página actual», arriba del contenido. En escritorio la barra ya
 * dice dónde estás; en el celular la barra va plegada, y sin esto la persona
 * que tocó un enlace se queda sin camino de vuelta — que es justo lo que el
 * dueño lleva tiempo pidiendo que no pase. En la portada de Docs no se dibuja.
 */
export function MigasDocs({ entradas }: { entradas: EntradaDocs[] }) {
  const t = useTranslations("docs");
  const ruta = usePathname() ?? "";
  const sinIdioma = ruta.replace(/^\/(es|en)(?=\/|$)/, "") || "/";
  if (sinIdioma === "/docs") return null;
  const actual = entradas.find((e) => e.href === sinIdioma);
  return (
    <nav
      aria-label={t("barra.etiqueta")}
      className="mb-5 flex flex-wrap items-center gap-2 text-sm"
    >
      <Link
        href="/docs"
        className="inline-flex items-center gap-1.5 rounded-md border border-borde bg-white px-2.5 py-1 font-semibold text-riel-900 hover:border-carga-500 hover:text-carga-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("titulo")}
      </Link>
      {actual ? (
        <>
          <span className="text-tinta-suave" aria-hidden>
            ›
          </span>
          <span className="text-tinta-suave">{actual.titulo}</span>
        </>
      ) : null}
    </nav>
  );
}
