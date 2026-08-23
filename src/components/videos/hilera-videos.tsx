import { ArrowRight, Clapperboard } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { FilaProductos } from "@/components/catalogo/fila-productos";
import { TarjetaVideo } from "@/components/videos/tarjeta-video";
import { Link } from "@/i18n/navigation";
import type { VideoPublico } from "@/lib/videos/reglas";

/**
 * UNA HILERA DE SHORTS entre los productos de la portada, como la de YouTube:
 * el sello de «Shorts», la fila que se arrastra a lo ancho, y nada más. No
 * estorba —ocupa el alto de una fila— y es el gancho: cada video es un
 * comercio real enseñando su tienda por dentro.
 */
export async function HileraVideos({
  videos,
  verTodos = true,
}: {
  videos: VideoPublico[];
  verTodos?: boolean;
}) {
  if (videos.length === 0) return null;
  const t = await getTranslations("videos");

  return (
    <section
      aria-label={t("hilera.titulo")}
      className="-mx-4 bg-slate-50 px-4 py-6"
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] text-carga-600 uppercase">
            <Clapperboard className="h-4 w-4" aria-hidden />
            {t("hilera.etiqueta")}
          </p>
          <h2 className="mt-1 text-lg font-bold text-riel-900">
            {t("hilera.titulo")}
          </h2>
        </div>
        {verTodos ? (
          <Link
            href="/videos"
            className="shrink-0 text-sm font-semibold text-riel-700 hover:text-carga-600"
          >
            {t("hilera.verTodos")}
            <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      <FilaProductos
        etiquetaAnterior={t("hilera.anterior")}
        etiquetaSiguiente={t("hilera.siguiente")}
      >
        {videos.map((v) => (
          <TarjetaVideo key={v.id} video={v} />
        ))}
      </FilaProductos>
    </section>
  );
}
