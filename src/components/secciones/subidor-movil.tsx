"use client";

import { CheckCircle2, Loader2, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { comprimirVideo } from "@/lib/videos/comprimir-video";
import { DURACION_MAXIMA_SEGUNDOS } from "@/lib/videos/reglas";
import { subirConAvance } from "@/lib/videos/subir-con-avance";

type Elegido = {
  archivo: File;
  duracion: number;
  ancho: number;
  alto: number;
  vistaPrevia: string;
  portada: File | null;
};

/**
 * EL SUBIDOR DEL ENLACE: pensado para una mano, de pie, en un almacén.
 *
 * ══ QUÉ LO HACE CÓMODO, Y POR QUÉ CADA COSA ══
 *
 * - **Un solo botón grande** que abre la cámara o el carrete. Sin formulario
 *   largo antes: primero el video, que es lo que se tiene delante.
 * - **El título es lo único obligatorio**, y sale después de elegir. Pedir
 *   cinco campos antes de dejar subir es como se abandona una herramienta.
 * - **La duración se comprueba en el navegador**, antes de gastar un byte:
 *   hacer esperar tres minutos de subida para decir «muy largo» al final es
 *   la peor forma de perder a alguien.
 * - **Se queda listo para el siguiente.** Son quince videos de una sentada: al
 *   terminar uno, el formulario se limpia solo y lleva la cuenta de los que
 *   van.
 */
export function SubidorMovil({
  llave,
  nombre,
  descripcion,
}: {
  llave: string;
  nombre: string;
  descripcion: string | null;
}) {
  const t = useTranslations("secciones");
  const [elegido, setElegido] = useState<Elegido | null>(null);
  const [titulo, setTitulo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [optimizando, setOptimizando] = useState<number | null>(null);
  const [avance, setAvance] = useState<number | null>(null);
  const [subidos, setSubidos] = useState(0);
  const [ultimo, setUltimo] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);
    setUltimo(null);

    const url = URL.createObjectURL(archivo);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;

    const datos = await new Promise<{
      duracion: number;
      ancho: number;
      alto: number;
    } | null>((resolver) => {
      video.onloadedmetadata = () =>
        resolver({
          duracion: video.duration,
          ancho: video.videoWidth,
          alto: video.videoHeight,
        });
      video.onerror = () => resolver(null);
    });

    if (!datos || !Number.isFinite(datos.duracion) || datos.duracion <= 0) {
      setError(t("noSePudoLeer"));
      URL.revokeObjectURL(url);
      return;
    }
    if (datos.duracion > DURACION_MAXIMA_SEGUNDOS) {
      setError(
        t("muyLargo", { minutos: Math.floor(DURACION_MAXIMA_SEGUNDOS / 60) }),
      );
      URL.revokeObjectURL(url);
      return;
    }

    /* La portada: un fotograma del segundo 1. Sin ella, la hilera de la
       sección son recuadros negros. */
    let portada: File | null = null;
    try {
      video.currentTime = Math.min(1, datos.duracion / 2);
      await new Promise((r) => {
        video.onseeked = r;
        setTimeout(r, 1500);
      });
      const lienzo = document.createElement("canvas");
      lienzo.width = datos.ancho;
      lienzo.height = datos.alto;
      lienzo.getContext("2d")?.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((r) =>
        lienzo.toBlob(r, "image/webp", 0.8),
      );
      if (blob)
        portada = new File([blob], "portada.webp", { type: "image/webp" });
    } catch {
      /* Sin portada se sube igual: es un adorno, no un requisito. */
    }

    setElegido({
      archivo,
      duracion: datos.duracion,
      ancho: datos.ancho,
      alto: datos.alto,
      vistaPrevia: url,
      portada,
    });
  }

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (!elegido) return;
    if (titulo.trim().length < 3) {
      setError(t("faltaTitulo"));
      return;
    }
    setError(null);

    setOptimizando(0);
    const r = await comprimirVideo(elegido.archivo, elegido.duracion, (p) =>
      setOptimizando(Math.round(p * 100)),
    );
    setOptimizando(null);

    const datos = new FormData();
    datos.set("llave", llave);
    datos.set("video", r.archivo);
    if (elegido.portada) datos.set("portada", elegido.portada);
    datos.set("tituloEs", titulo.trim());
    datos.set("duracionSegundos", String(Math.round(elegido.duracion)));
    datos.set("anchoPx", String(r.ancho ?? elegido.ancho));
    datos.set("altoPx", String(r.alto ?? elegido.alto));

    setAvance(0);
    const respuesta = await subirConAvance(datos, setAvance, t("sinRed")).catch(
      (fallo: unknown) => {
        setError(fallo instanceof Error ? fallo.message : String(fallo));
        return null;
      },
    );
    setAvance(null);
    if (!respuesta) return;
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }

    /* Listo y a por el siguiente: son quince de una sentada. */
    URL.revokeObjectURL(elegido.vistaPrevia);
    setElegido(null);
    setTitulo("");
    setSubidos((n) => n + 1);
    setUltimo(respuesta.mensaje);
    if (entrada.current) entrada.current.value = "";
  }

  const trabajando = optimizando !== null || avance !== null;

  return (
    <div className="mx-auto w-full max-w-md px-5 py-8">
      <p className="text-xs font-bold tracking-wide text-carga-600 uppercase">
        {t("etiqueta")}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-riel-900">{nombre}</h1>
      {descripcion ? (
        <p className="mt-2 text-sm leading-snug text-tinta-suave">
          {descripcion}
        </p>
      ) : null}

      {subidos > 0 ? (
        <p className="bg-precio-50 text-precio-700 mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {t("llevasSubidos", { n: subidos })}
        </p>
      ) : null}

      <form onSubmit={publicar} className="mt-6 space-y-4">
        {/* El botón grande: abre la cámara o el carrete del teléfono. */}
        <label
          className={`flex min-h-[9rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center ${
            elegido
              ? "border-precio-300 bg-precio-50"
              : "border-borde bg-slate-50"
          }`}
        >
          <input
            ref={entrada}
            type="file"
            accept="video/*"
            /* ══ SIN EL ATRIBUTO `capture`, Y ES LO QUE ARREGLA EL CASO REAL ══

               Con `capture` puesto, el teléfono abre la cámara DIRECTO y
               esconde el carrete: el dueño tenía quince videos ya grabados y
               la herramienta solo le dejaba grabar uno nuevo. Sin el
               atributo, iOS y Android enseñan el menú completo —«Fototeca»,
               «Grabar video», «Elegir archivo»— y las dos cosas caben. El
               botón ya decía «Grabar o elegir un video»; ahora es verdad. */
            onChange={alElegir}
            disabled={trabajando}
            className="sr-only"
          />
          {elegido ? (
            <>
              <video
                src={elegido.vistaPrevia}
                controls
                playsInline
                className="max-h-64 w-auto rounded-xl"
              />
              <span className="text-precio-700 text-sm font-semibold">
                {t("cambiarVideo")}
              </span>
            </>
          ) : (
            <>
              <Video className="h-9 w-9 text-carga-500" aria-hidden />
              <span className="text-base font-bold text-riel-900">
                {t("elegirVideo")}
              </span>
              <span className="text-sm text-tinta-suave">
                {t("duracionesSugeridas")}
              </span>
            </>
          )}
        </label>

        {elegido ? (
          <div>
            <label
              htmlFor="titulo-seccion"
              className="block text-sm font-medium"
            >
              {t("tituloDelVideo")}
            </label>
            <input
              id="titulo-seccion"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
              placeholder={t("tituloEjemplo")}
              disabled={trabajando}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-carga-500"
            />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        {ultimo ? (
          <p
            role="status"
            className="bg-precio-50 text-precio-700 rounded-lg px-3 py-2 text-sm font-medium"
          >
            {ultimo}
          </p>
        ) : null}

        {trabajando ? (
          <div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-carga-500 transition-[width]"
                style={{ width: `${optimizando ?? avance ?? 0}%` }}
              />
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-tinta-suave">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {/* Los textos son propios y no del panel: los de `panel.*` no
                  viajan al navegador fuera del panel — hay un candado que lo
                  exige, y con razón: mandarlos todos engorda cada página. */}
              {optimizando !== null
                ? t("optimizando", { pct: optimizando })
                : t("subiendo", { pct: avance ?? 0 })}
            </p>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!elegido}
            className="boton-principal w-full py-3.5 text-base disabled:opacity-50"
          >
            {t("publicarVideo")}
          </button>
        )}
      </form>
    </div>
  );
}
