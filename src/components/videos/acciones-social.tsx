"use client";

import {
  Check,
  Eye,
  Heart,
  Link2,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import {
  alternarCorazon,
  comentarVideo,
  ocultarComentario,
} from "@/lib/videos/social-acciones";
import type { ComentarioPublico } from "@/lib/videos/social";
import { cn } from "@/lib/utils";

/**
 * LA COLUMNA DE LA DERECHA DEL VIDEO: corazón, comentarios y compartir.
 *
 * Es lo que tiene cualquier red de videos y lo que la gente ya sabe usar sin
 * que nadie se lo explique: el corazón se llena al tocarlo, el número sube
 * ahí mismo (sin recargar la página) y el bocadillo abre los comentarios.
 *
 * ══ TRES REGLAS ══
 *
 * 1. **El número sube en la pantalla antes de que conteste el servidor**, y si
 *    el servidor dice que no, vuelve atrás. Esperar medio segundo a que viaje
 *    una petición para ver un corazón rojo se siente roto.
 * 2. **Quien no entró ve el botón igual.** Al tocarlo se le dice que entre,
 *    con el enlace: esconderlo sería esconder que la función existe.
 * 3. **Compartir usa lo del sistema** (`navigator.share`) en el teléfono, que
 *    es donde de verdad se comparte; en escritorio copia el enlace y lo dice.
 */
export function AccionesSocial({
  videoId,
  slug,
  titulo,
  corazonesIniciales,
  meGustaInicial,
  comentariosIniciales,
  comentarios,
  vertical = true,
  vistas,
}: {
  videoId: string;
  slug: string;
  titulo: string;
  corazonesIniciales: number;
  meGustaInicial: boolean;
  comentariosIniciales: number;
  comentarios: ComentarioPublico[];
  vertical?: boolean;
  /** Las vistas ya formateadas («1,2 mil»). Solo el visor las pasa. */
  vistas?: string;
}) {
  const t = useTranslations("videos.social");
  const router = useRouter();
  const [corazones, setCorazones] = useState(corazonesIniciales);
  const [meGusta, setMeGusta] = useState(meGustaInicial);
  const [abiertos, setAbiertos] = useState(false);
  const [lista, setLista] = useState(comentarios);
  const [cuantos, setCuantos] = useState(comentariosIniciales);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [hayQueEntrar, setHayQueEntrar] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function tocarCorazon() {
    /* Se pinta ya y se corrige si el servidor dice otra cosa. */
    const antes = { corazones, meGusta };
    setMeGusta(!meGusta);
    setCorazones(corazones + (meGusta ? -1 : 1));
    const r = await alternarCorazon(videoId);
    if (r.ok) {
      setCorazones(r.corazones);
      setMeGusta(r.meGusta);
      return;
    }
    setCorazones(antes.corazones);
    setMeGusta(antes.meGusta);
    setAviso(r.mensaje);
    setHayQueEntrar(Boolean(r.hayQueEntrar));
  }

  async function compartir() {
    const url = `${window.location.origin}/${document.documentElement.lang || "es"}/video/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: titulo, url }).catch(() => {
        /* Si la persona cancela el menú del sistema no pasa nada. */
      });
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limpio = texto.trim();
    if (limpio.length < 2) return;
    setTexto("");
    const r = await comentarVideo(videoId, limpio);
    if (!r.ok) {
      setAviso(r.mensaje);
      setHayQueEntrar(Boolean(r.hayQueEntrar));
      setTexto(limpio);
      return;
    }
    setLista([
      {
        id: r.id,
        texto: r.texto,
        autor: r.autor,
        creadoEn: new Date().toISOString(),
        puedeBorrar: true,
      },
      ...lista,
    ]);
    setCuantos((n) => n + 1);
  }

  /**
   * ══ EL BOTÓN NO PUEDE MOVER LA PANTALLA (24 ago 2026) ══
   *
   * En el celular, al tocar el corazón el video «se rodaba»: el navegador
   * enfoca el botón y, dentro de un contenedor con scroll-snap, eso arrastra
   * la pantalla al siguiente video. Se evita quitándole el foco al pulsar,
   * que es lo que hacen las apps de video con su columna de acciones.
   */
  const sinMoverLaPantalla = (e: React.PointerEvent) => e.preventDefault();

  const boton = "flex flex-col items-center gap-1 text-white";
  const circulo =
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur transition-colors hover:bg-black/65";

  return (
    <>
      <div
        className={cn(
          "flex gap-4",
          vertical ? "flex-col" : "flex-row items-center",
        )}
      >
        {/* El ojo con las vistas es un INDICADOR, no un botón: cuenta lo que
            ya pasó. Solo se dibuja si el visor lo pasa. */}
        {typeof vistas === "string" ? (
          <div
            className="flex flex-col items-center gap-1 text-white"
            aria-label={t("vistas")}
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur">
              <Eye className="h-6 w-6" aria-hidden />
            </span>
            <span className="text-xs font-semibold tabular-nums">{vistas}</span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={tocarCorazon}
          className={boton}
          aria-pressed={meGusta}
          aria-label={t("corazon")}
          onPointerDown={sinMoverLaPantalla}
        >
          <span
            className={cn(
              circulo,
              meGusta && "bg-carga-500/90 hover:bg-carga-500",
            )}
          >
            <Heart
              className={cn("h-5 w-5", meGusta && "fill-current")}
              aria-hidden
            />
          </span>
          <span className="text-xs font-semibold tabular-nums">
            {corazones}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbiertos((a) => !a)}
          className={boton}
          aria-expanded={abiertos}
          aria-label={t("comentarios")}
          onPointerDown={sinMoverLaPantalla}
        >
          <span className={circulo}>
            <MessageCircle className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xs font-semibold tabular-nums">{cuantos}</span>
        </button>

        <button
          type="button"
          onClick={compartir}
          className={boton}
          aria-label={t("compartir")}
          onPointerDown={sinMoverLaPantalla}
        >
          <span className={circulo}>
            {copiado ? (
              <Check className="h-5 w-5" aria-hidden />
            ) : (
              <Send className="h-5 w-5" aria-hidden />
            )}
          </span>
          <span className="text-xs font-semibold">
            {copiado ? t("copiado") : t("compartir")}
          </span>
        </button>
      </div>

      {/**
       * EL AVISO VA CENTRADO Y ENCIMA DE TODO.
       *
       * Estaba al lado de los botones, con 14rem de ancho: en el celular
       * quedaba detrás del video y el dueño tocaba el corazón y «no pasaba
       * nada». Si hace falta entrar, el botón para entrar es lo primero.
       */}
      {aviso ? (
        <div
          role="alert"
          onClick={() => setAviso(null)}
          className="fixed inset-x-0 bottom-24 z-[60] mx-auto w-[min(22rem,92vw)] rounded-xl bg-riel-900 px-4 py-3 text-center text-sm text-white shadow-2xl sm:bottom-10"
        >
          <p>{aviso}</p>
          {hayQueEntrar ? (
            <Link
              href={`/entrar?destino=${encodeURIComponent(`/video/${slug}`)}`}
              className="mt-2 inline-block rounded-lg bg-carga-500 px-4 py-2 font-bold text-riel-950"
            >
              {t("entrar")}
            </Link>
          ) : null}
        </div>
      ) : null}

      {abiertos ? (
        <div
          className="fixed inset-x-0 bottom-0 z-50 max-h-[70svh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-96 sm:rounded-none sm:rounded-l-2xl"
          role="dialog"
          aria-label={t("comentarios")}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-riel-900">
              {t("comentarios")}{" "}
              <span className="text-tinta-suave tabular-nums">({cuantos})</span>
            </h2>
            <button
              type="button"
              onClick={() => setAbiertos(false)}
              aria-label={t("cerrar")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-tinta-suave hover:bg-slate-100"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <form onSubmit={enviar} className="mt-3 flex items-start gap-2">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={500}
              placeholder={t("escribe")}
              className="h-11 w-full min-w-0 rounded-lg border border-borde px-3 text-sm outline-none focus:border-carga-500"
            />
            <button
              type="submit"
              className="boton-principal h-11 shrink-0 px-4"
              aria-label={t("enviar")}
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </form>

          <ul className="mt-4 space-y-4">
            {lista.length === 0 ? (
              <li className="text-sm text-tinta-suave">
                {t("sinComentarios")}
              </li>
            ) : (
              lista.map((c) => (
                <li key={c.id} className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-riel-900 text-xs font-bold text-white">
                    {c.autor.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-riel-900">
                      {c.autor}
                    </p>
                    <p className="text-sm leading-snug break-words text-tinta">
                      {c.texto}
                    </p>
                  </div>
                  {c.puedeBorrar ? (
                    <button
                      type="button"
                      aria-label={t("borrar")}
                      onClick={async () => {
                        await ocultarComentario(c.id);
                        setLista((l) => l.filter((x) => x.id !== c.id));
                        setCuantos((n) => Math.max(0, n - 1));
                        router.refresh();
                      }}
                      className="shrink-0 rounded p-1 text-tinta-suave hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>

          <p className="mt-6 flex items-center gap-1.5 text-xs text-tinta-suave">
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            {t("reglas")}
          </p>
        </div>
      ) : null}
    </>
  );
}
