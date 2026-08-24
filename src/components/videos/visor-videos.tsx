"use client";

import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Store,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { AccionesSocial } from "@/components/videos/acciones-social";
import { Link } from "@/i18n/navigation";
import type { ComentarioPublico } from "@/lib/videos/social";
import type { VideoPublico } from "@/lib/videos/reglas";
import { cn } from "@/lib/utils";

export type VideoConSocial = VideoPublico & {
  corazones: number;
  meGusta: boolean;
  comentarios: number;
};

/**
 * EL VISOR DE SHORTS, COMO EN CUALQUIER RED DE VIDEOS.
 *
 * ══ TRES NIVELES, Y LOS TRES LOS ELIGE LA PERSONA (24 ago 2026) ══
 *
 * 1. En la hilera: se pasa el mouse y el video se mueve (eso vive en
 *    `TarjetaVideo`).
 * 2. Aquí: el reproductor **con los menús del sitio a los lados**, la columna
 *    de corazón / comentarios / compartir a la derecha, y los controles arriba
 *    del video (pausa y sonido a la izquierda, expandir a la derecha).
 * 3. Y **solo si se toca expandir**, pantalla completa de verdad (la del
 *    navegador). Abrir directo a pantalla completa era el error: obligaba a
 *    volver atrás para seguir mirando.
 *
 * En el teléfono no hay «a los lados» que valga: ahí ocupa la pantalla y se
 * pasa de video con el dedo, como en TikTok.
 *
 * Lo demás que no se toca: solo suena el que se está viendo, arranca en
 * silencio (el navegador no deja autoplay con sonido) y los de más abajo no se
 * precargan.
 */
export function VisorVideos({
  videos,
  idioma,
  comentariosDelPrimero = [],
}: {
  videos: VideoConSocial[];
  idioma: string;
  comentariosDelPrimero?: ComentarioPublico[];
}) {
  const t = useTranslations("videos");
  const [sonido, setSonido] = useState(false);
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const escenario = useRef<HTMLDivElement>(null);
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
            setPausado(false);
            void el.play().catch(() => {});
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

  const irA = useCallback((i: number) => {
    refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    const teclas = (e: KeyboardEvent) => {
      /* ══ SI LA PERSONA ESTÁ ESCRIBIENDO, LAS TECLAS SON SUYAS (24 ago 2026) ══

         El espacio pausa el video, como en YouTube — pero YouTube lo apaga
         cuando el foco está en una casilla. Aquí no se apagaba: quien escribía
         un comentario pulsaba espacio y el `preventDefault` se lo comía. El
         dueño lo vivió tal cual: «no funciona el espaciador». */
      const destino = e.target as HTMLElement | null;
      if (
        destino &&
        (destino.tagName === "INPUT" ||
          destino.tagName === "TEXTAREA" ||
          destino.isContentEditable ||
          destino.closest('[role="dialog"]'))
      ) {
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        irA(actual + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        irA(actual - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        alternarPausa();
      }
    };
    window.addEventListener("keydown", teclas);
    return () => window.removeEventListener("keydown", teclas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual, irA]);

  /* La pantalla completa es la del navegador, no un CSS que la imite: así el
     teléfono esconde su propia barra y el botón de volver funciona. */
  useEffect(() => {
    const alCambiar = () => setExpandido(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  async function alternarExpandido() {
    const nodo = escenario.current;
    if (!nodo) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await nodo.requestFullscreen();
    } catch {
      /* Un navegador que no la permita se queda como está: no se rompe nada. */
    }
  }

  function alternarPausa() {
    const el = refs.current[actual];
    if (!el) return;
    if (el.paused) {
      void el.play().catch(() => {});
      setPausado(false);
    } else {
      el.pause();
      setPausado(true);
    }
  }

  const video = videos[actual];

  return (
    <div
      ref={escenario}
      className={cn(
        "relative mx-auto flex w-full justify-center gap-4 bg-black sm:bg-transparent",
        expandido ? "h-screen max-w-none bg-black" : "max-w-4xl sm:py-6",
      )}
    >
      {/* La pila de videos: uno por pantalla, se pasa con el scroll. */}
      <div
        className={cn(
          "snap-y snap-mandatory overflow-y-auto overscroll-contain",
          expandido
            ? "h-screen w-full"
            : "h-[100svh] w-full sm:h-[min(80svh,720px)] sm:w-auto sm:max-w-[420px] sm:rounded-2xl",
        )}
      >
        {videos.map((v, i) => (
          <section
            key={v.id}
            className={cn(
              "relative flex snap-start snap-always items-center justify-center bg-black",
              expandido
                ? "h-screen"
                : "h-[100svh] sm:h-[min(80svh,720px)] sm:rounded-2xl",
            )}
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
              onClick={alternarPausa}
              className={cn(
                "h-full w-full object-contain",
                !expandido && "sm:rounded-2xl",
              )}
            />

            {/* Arriba: pausa y sonido a la izquierda; expandir a la derecha —
                igual que en YouTube Shorts. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={alternarPausa}
                  aria-label={pausado ? t("visor.reanudar") : t("visor.pausar")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                >
                  {pausado ? (
                    <Play
                      className="h-4 w-4 translate-x-[1px] fill-current"
                      aria-hidden
                    />
                  ) : (
                    <Pause className="h-4 w-4 fill-current" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSonido((s) => !s)}
                  aria-label={
                    sonido ? t("visor.silenciar") : t("visor.conSonido")
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                >
                  {sonido ? (
                    <Volume2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <VolumeX className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={alternarExpandido}
                aria-label={
                  expandido ? t("visor.reducir") : t("visor.expandir")
                }
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
              >
                {expandido ? (
                  <Minimize2 className="h-4 w-4" aria-hidden />
                ) : (
                  <Maximize2 className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>

            {/* Abajo: quién lo subió, el título y el botón que lleva a su tienda. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pb-6">
              <div className="mx-auto max-w-lg">
                <Link
                  href={`/tienda/${v.tiendaSlug}`}
                  className="pointer-events-auto text-sm font-semibold text-white/85 hover:text-white"
                >
                  {v.tiendaNombre}
                </Link>
                <p className="mt-1 text-base font-bold text-white">
                  {v.titulo}
                </p>
                {v.descripcion ? (
                  <p className="mt-1 line-clamp-2 text-sm text-white/80">
                    {v.descripcion}
                  </p>
                ) : null}
                <Link
                  href={`/tienda/${v.tiendaSlug}`}
                  className="pointer-events-auto mt-3 inline-flex items-center gap-2 rounded-full bg-carga-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-carga-600"
                >
                  <Store className="h-4 w-4" aria-hidden />
                  {t("visor.entraEnMiTienda")}
                </Link>
              </div>
            </div>

            {/* En el teléfono la columna social va ENCIMA del video, a la
                derecha, como en TikTok. En escritorio va fuera, al lado. */}
            <div className="absolute right-3 bottom-28 sm:hidden">
              <AccionesSocial
                videoId={v.id}
                slug={v.slug}
                titulo={v.titulo}
                corazonesIniciales={v.corazones}
                meGustaInicial={v.meGusta}
                comentariosIniciales={v.comentarios}
                comentarios={i === 0 ? comentariosDelPrimero : []}
              />
            </div>
          </section>
        ))}
      </div>

      {/* ESCRITORIO: la columna de acciones al lado del video, y las flechas de
          subir y bajar — como los Shorts de YouTube. */}
      {video ? (
        <div className="hidden shrink-0 flex-col items-center justify-end gap-4 pb-10 sm:flex">
          <div className="rounded-2xl bg-riel-900/90 p-2">
            <AccionesSocial
              videoId={video.id}
              slug={video.slug}
              titulo={video.titulo}
              corazonesIniciales={video.corazones}
              meGustaInicial={video.meGusta}
              comentariosIniciales={video.comentarios}
              comentarios={actual === 0 ? comentariosDelPrimero : []}
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => irA(actual - 1)}
              disabled={actual === 0}
              aria-label={t("visor.anterior")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-riel-900 hover:bg-slate-300 disabled:opacity-40"
            >
              <ChevronUp className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => irA(actual + 1)}
              disabled={actual >= videos.length - 1}
              aria-label={t("visor.siguiente")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-riel-900 hover:bg-slate-300 disabled:opacity-40"
            >
              <ChevronDown className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
