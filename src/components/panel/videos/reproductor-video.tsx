"use client";

import { Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { duracionCorta } from "@/lib/videos/reglas";

/**
 * EL REPRODUCTOR DE LA LISTA «MIS VIDEOS PUBLICADOS».
 *
 * Antes la lista solo enseñaba la miniatura: el comercio veía tres videos
 * parecidos y no tenía forma de saber cuál era cuál — ni de oírlos. Palabras
 * del dueño: *«ahí tampoco hay un audiovisor… algo para probar los videos»*.
 *
 * Se toca la miniatura y se abre el video en grande, **con sonido y con los
 * controles del navegador** (barra de tiempo, volumen, pantalla completa). Se
 * cierra con la equis, con Escape o tocando fuera.
 *
 * `autoPlay` sin `muted` puede rechazarlo el navegador si la persona no ha
 * interactuado con la página; aquí sí lo hizo —acaba de tocar el botón—, y si
 * aun así lo rechaza, quedan los controles a la vista para darle play.
 */
export function ReproductorVideo({
  url,
  portadaUrl,
  titulo,
  duracionSegundos,
}: {
  url: string;
  portadaUrl: string | null;
  titulo: string;
  duracionSegundos: number;
}) {
  const t = useTranslations("panel.videos");
  const [abierto, setAbierto] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrarConEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", cerrarConEscape);
    /* La página de atrás no se mueve mientras el video está abierto. */
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = antes;
    };
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={t("reproducir", { titulo })}
        className="group relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-riel-900"
      >
        {portadaUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={portadaUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-riel-900">
            <Play
              className="h-4 w-4 translate-x-[1px] fill-current"
              aria-hidden
            />
          </span>
        </span>
        {duracionSegundos > 0 ? (
          <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[10px] font-semibold text-white tabular-nums">
            {duracionCorta(duracionSegundos)}
          </span>
        ) : null}
      </button>

      {abierto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div
            className="relative flex max-h-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={video}
              src={url}
              poster={portadaUrl ?? undefined}
              controls
              autoPlay
              playsInline
              className="max-h-[80svh] w-auto rounded-xl bg-black"
            />
            <p className="mt-3 max-w-md text-center text-sm font-medium text-white">
              {titulo}
            </p>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={t("cerrar")}
              className="absolute -top-3 -right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-riel-900 shadow-lg hover:bg-slate-100"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
