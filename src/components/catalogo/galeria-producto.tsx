"use client";

import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { FotoConRespaldo } from "@/components/catalogo/foto-con-respaldo";
import { cn } from "@/lib/utils";

export type FotoProducto = {
  id: string;
  url: string;
  altEs: string | null;
  altEn: string | null;
};

/**
 * Fotos del producto: una grande, las demas en miniatura, y al tocarlas se
 * abren a pantalla completa DENTRO de la pagina (nunca en otra pestana).
 */
export function GaleriaProducto({
  fotos,
  titulo,
}: {
  fotos: FotoProducto[];
  titulo: string;
}) {
  const t = useTranslations("catalogo.producto");
  const idioma = useLocale();
  const [actual, setActual] = useState(0);
  const [ampliada, setAmpliada] = useState(false);

  const total = fotos.length;

  const mover = useCallback(
    (paso: number) => {
      if (total === 0) return;
      setActual((n) => (n + paso + total) % total);
    },
    [total],
  );

  // Con el teclado: flechas para pasar fotos, Escape para cerrar.
  useEffect(() => {
    if (!ampliada) return;

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAmpliada(false);
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    };

    document.addEventListener("keydown", alTeclear);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowPrevio;
    };
  }, [ampliada, mover]);

  if (total === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 text-tinta-suave">
        <ImageOff className="h-10 w-10" aria-hidden />
        <span className="text-sm">{t("sinFoto")}</span>
      </div>
    );
  }

  const foto = fotos[actual];
  const alt =
    (idioma === "en" ? foto.altEn : foto.altEs) ?? `${titulo} — ${actual + 1}`;

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAmpliada(true)}
          aria-label={t("verFoto")}
          className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-borde bg-white"
        >
          {}
          <FotoConRespaldo
            src={foto.url}
            alt={alt}
            loading="eager"
            textoSinFoto={t("sinFoto")}
            className="h-full w-full object-contain"
          />
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-riel-950/75 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-3.5 w-3.5" aria-hidden />
            {t("verFoto")}
          </span>
        </button>

        {total > 1 ? (
          <ul className="flex flex-wrap gap-2">
            {fotos.map((f, indice) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => setActual(indice)}
                  aria-label={t("foto", { n: indice + 1, total })}
                  aria-current={indice === actual ? "true" : undefined}
                  className={cn(
                    "h-16 w-16 overflow-hidden rounded-lg border-2 bg-white transition-colors",
                    indice === actual
                      ? "border-carga-500"
                      : "border-borde hover:border-riel-700",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {ampliada ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-8"
        >
          <button
            type="button"
            aria-label={t("cerrarFoto")}
            onClick={() => setAmpliada(false)}
            className="absolute inset-0 bg-riel-950/90 backdrop-blur-sm"
          />

          <button
            type="button"
            onClick={() => setAmpliada(false)}
            aria-label={t("cerrarFoto")}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={() => mover(-1)}
                aria-label={t("anterior")}
                className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => mover(1)}
                aria-label={t("siguiente")}
                className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            </>
          ) : null}

          <figure className="relative max-h-full animate-in duration-150 zoom-in-95 fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.url}
              alt={alt}
              className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white/80">
              {titulo}
              {total > 1 ? (
                <span className="block text-xs text-white/60">
                  {t("foto", { n: actual + 1, total })}
                </span>
              ) : null}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
