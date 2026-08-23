import { Play } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { duracionCorta, type VideoPublico } from "@/lib/videos/reglas";

/**
 * LA TARJETA DE UN SHORT: la portada vertical, el tiempo abajo a la derecha,
 * el título y el nombre del comercio. Es un enlace a la página del video —cada
 * video es su propia dirección, para que Google la indexe y para poder
 * pasársela a alguien.
 *
 * La portada es una imagen normal (`<img>`, no el video): una hilera de ocho
 * videos cargando a la vez se come la conexión de un teléfono y la portada de
 * los que nadie va a abrir no hace falta.
 */
export function TarjetaVideo({ video }: { video: VideoPublico }) {
  return (
    <Link
      href={`/video/${video.slug}`}
      className="group block w-40 shrink-0 snap-start sm:w-44"
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-riel-900">
        {video.portadaUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={video.portadaUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <video
            src={video.url}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-riel-900">
            <Play
              className="h-5 w-5 translate-x-[1px] fill-current"
              aria-hidden
            />
          </span>
        </span>
        {video.duracionSegundos > 0 ? (
          <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
            {duracionCorta(video.duracionSegundos)}
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
