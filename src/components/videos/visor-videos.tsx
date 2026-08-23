"use client";

import { ArrowLeft, Store, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import type { VideoPublico } from "@/lib/videos/reglas";
import { cn } from "@/lib/utils";

/**
 * EL VISOR TIPO TIKTOK: un video por pantalla, se pasa al siguiente con el
 * scroll (o con las flechas del teclado), y encima de cada uno el nombre del
 * comercio, el título y el botón «Entra en mi tienda» — que es todo el
 * negocio: alguien ve el video, le gusta lo que vende, y entra a comprar.
 *
 * ══ TRES COSAS QUE NO SE TOCAN ══
 *
 * 1. **Solo se reproduce el que se está viendo.** Un `IntersectionObserver`
 *    pausa los demás: diez videos sonando a la vez funden la batería de un
 *    teléfono y saturan la conexión.
 * 2. **Arranca en silencio.** Un video con sonido que arranca solo es el
 *    motivo por el que la gente cierra la pestaña — y además los navegadores
 *    no dejan autoplay con sonido. El botón de sonido está siempre a la vista.
 * 3. **Los de más abajo NO se precargan enteros** (`preload="none"` salvo el
 *    siguiente): la lista puede tener veinte videos y nadie los ve todos.
 */
export function VisorVideos({
  videos,
  idioma,
}: {
  videos: VideoPublico[];
  idioma: string;
}) {
  const t = useTranslations("videos");
  const [sonido, setSonido] = useState(false);
  const [actual, setActual] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);

  const registrar = useCallback((el: HTMLVideoElement | null, i: number) => {
    refs.current[i] = el;
  }, []);

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const el = e.target as HTMLVideoElement;
          const i = Number(el.dataset.indice);
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            setActual(i);
            void el.play().catch(() => {
              /* El navegador puede negarse (batería baja, ahorro de datos):
                 no es un error que valga la pena enseñar. */
            });
            /* Cambia la dirección de la barra sin recargar: así el enlace que
               se copia es el del video que se está viendo. */
            const slug = el.dataset.slug;
            if (slug)
              window.history.replaceState(null, "", `/${idioma}/video/${slug}`);
          } else {
            el.pause();
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    for (const el of refs.current) if (el) observador.observe(el);
    return () => observador.disconnect();
  }, [idioma, videos.length]);

  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const destino = refs.current[actual + (e.key === "ArrowDown" ? 1 : -1)];
      destino?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("keydown", teclas);
    return () => window.removeEventListener("keydown", teclas);
  }, [actual]);

  return (
    <div
      ref={contenedor}
      className="h-[100svh] snap-y snap-mandatory overflow-y-auto overscroll-contain bg-black"
    >
      {videos.map((v, i) => (
        <section
          key={v.id}
          className="relative flex h-[100svh] snap-start snap-always items-center justify-center"
        >
          <video
            ref={(el) => registrar(el, i)}
            data-indice={i}
            data-slug={v.slug}
            src={v.url}
            poster={v.portadaUrl ?? undefined}
            playsInline
            loop
            muted={!sonido}
            preload={i <= actual + 1 ? "metadata" : "none"}
            className="h-full w-full object-contain"
            onClick={(e) => {
              const el = e.currentTarget;
              if (el.paused) void el.play().catch(() => {});
              else el.pause();
            }}
          />

          {/* Arriba: volver y el sonido. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4">
            <Link
              href={`/tienda/${v.tiendaSlug}`}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur hover:bg-black/70"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {v.tiendaNombre}
            </Link>
            <button
              type="button"
              onClick={() => setSonido((s) => !s)}
              aria-label={sonido ? t("visor.silenciar") : t("visor.conSonido")}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
            >
              {sonido ? (
                <Volume2 className="h-4 w-4" aria-hidden />
              ) : (
                <VolumeX className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          {/* Abajo: el título y el botón que lleva a la tienda. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8">
            <div className="mx-auto max-w-lg">
              <p className="text-base font-bold text-white">{v.titulo}</p>
              {v.descripcion ? (
                <p className="mt-1 line-clamp-2 text-sm text-white/80">
                  {v.descripcion}
                </p>
              ) : null}
              <Link
                href={`/tienda/${v.tiendaSlug}`}
                className={cn(
                  "pointer-events-auto mt-3 inline-flex items-center gap-2 rounded-full bg-carga-500 px-5 py-2.5",
                  "text-sm font-bold text-white shadow-lg transition-colors hover:bg-carga-600",
                )}
              >
                <Store className="h-4 w-4" aria-hidden />
                {t("visor.entraEnMiTienda")}
              </Link>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
