"use client";

import { Heart, Play } from "lucide-react";
import { useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import { duracionCorta, type VideoPublico } from "@/lib/videos/reglas";

/**
 * LA TARJETA DE UN SHORT EN LA HILERA, COMO EN YOUTUBE.
 *
 * **Se pasa el mouse por encima y el video se mueve** —en silencio, en bucle,
 * dentro de la misma tarjeta—; se quita el mouse y vuelve la portada. Así se
 * catan seis videos en diez segundos sin salir de la página, que es justo lo
 * que pidió el dueño: *«voy a dar play uno por uno hasta que haya uno que
 * quiero ver»*.
 *
 * Al tocarla se abre la página del video (el reproductor, con los menús del
 * sitio a los lados). Ahí dentro hay un botón de expandir para la pantalla
 * completa: abrir a pantalla completa de una es lo que obliga a volver atrás.
 *
 * ══ POR QUÉ NO SE PRECARGA NADA ══
 *
 * `preload="none"` hasta que el mouse entra. Una hilera de ocho videos
 * precargando a la vez se come la conexión de un teléfono y la portada —una
 * imagen— es lo único que hace falta para decidir.
 */
export function TarjetaVideo({
  video,
  corazones = 0,
}: {
  video: VideoPublico;
  corazones?: number;
}) {
  const [mirando, setMirando] = useState(false);
  const reproductor = useRef<HTMLVideoElement>(null);

  function empezar() {
    setMirando(true);
    const v = reproductor.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => {
      /* El navegador puede negarse (ahorro de datos, batería): se queda la
         portada, que es exactamente lo de antes. */
    });
  }

  function parar() {
    setMirando(false);
    reproductor.current?.pause();
  }

  return (
    <Link
      href={`/video/${video.slug}`}
      onMouseEnter={empezar}
      onMouseLeave={parar}
      onFocus={empezar}
      onBlur={parar}
      className="group block w-40 shrink-0 snap-start sm:w-44"
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-riel-900">
        {video.portadaUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={video.portadaUrl}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition-opacity duration-200 ${mirando ? "opacity-0" : "opacity-100"}`}
          />
        ) : null}
        <video
          ref={reproductor}
          src={video.url}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${mirando ? "opacity-100" : "opacity-0"}`}
        />
        {!mirando ? (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-riel-900">
              <Play
                className="h-5 w-5 translate-x-[1px] fill-current"
                aria-hidden
              />
            </span>
          </span>
        ) : null}
        {video.duracionSegundos > 0 ? (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
            {duracionCorta(video.duracionSegundos)}
          </span>
        ) : null}
        {corazones > 0 ? (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            <Heart className="h-3 w-3 fill-current" aria-hidden />
            {corazones}
          </span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-snug font-semibold text-riel-900 group-hover:text-carga-600">
        {video.titulo}
      </p>
      <p className="mt-0.5 truncate text-xs text-tinta-suave">
        {video.tiendaNombre}
      </p>
    </Link>
  );
}
