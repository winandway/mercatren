import { ArrowRight, Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { BannerPublico } from "@/lib/banners/reglas";
import { cn } from "@/lib/utils";

/**
 * EL BANNER EN MEDIO DE LA PARRILLA. Ocupa la hilera entera (`col-span-full`)
 * y se ve como lo que es —publicidad de la casa a uno de sus comercios—, con
 * la etiqueta «Publicidad» a la vista: un anuncio disfrazado de producto hace
 * desconfiar de toda la parrilla. Con foto va la foto de fondo; sin foto, el
 * azul de la casa y el título. Sirve en componentes de servidor y en la
 * parrilla infinita (cliente): no usa nada de servidor.
 */
export function BannerPublicitario({
  banner,
  className,
}: {
  banner: BannerPublico;
  className?: string;
}) {
  const t = useTranslations("catalogo.banner");
  const interno = banner.enlace.startsWith("/");
  const contenido = (
    <span
      className={cn(
        "relative flex min-h-[120px] w-full items-center overflow-hidden rounded-2xl text-white shadow-sm transition-shadow hover:shadow-md sm:min-h-[140px]",
        !banner.imagenUrl && "bg-riel-900",
      )}
    >
      {banner.imagenUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.imagenUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-riel-900/85 via-riel-900/55 to-riel-900/20"
          />
        </>
      ) : null}
      <span className="relative flex w-full flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-7">
        <span className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase">
            <Megaphone className="h-3 w-3" aria-hidden />
            {t("publicidad")}
          </span>
          <span className="mt-1.5 block text-lg leading-tight font-bold sm:text-xl">
            {banner.titulo}
          </span>
          {banner.texto ? (
            <span className="mt-1 block max-w-2xl text-sm text-white/85">
              {banner.texto}
            </span>
          ) : null}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-carga-500 px-3.5 py-2 text-sm font-semibold text-white sm:self-center">
          {banner.boton ?? t("verTienda")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </span>
    </span>
  );
  const clases = cn("col-span-full block", className);
  return interno ? (
    <Link href={banner.enlace} className={clases} data-banner={banner.id}>
      {contenido}
    </Link>
  ) : (
    <a
      href={banner.enlace}
      className={clases}
      data-banner={banner.id}
      rel="noopener"
    >
      {contenido}
    </a>
  );
}
