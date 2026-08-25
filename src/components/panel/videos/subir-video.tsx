"use client";

import {
  CheckCircle2,
  Clapperboard,
  Loader2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Campo } from "@/components/ui/campo";
import { comprimirVideo } from "@/lib/videos/comprimir-video";
import { subirConAvance } from "@/lib/videos/subir-con-avance";
import {
  DURACION_MAXIMA_SEGUNDOS,
  DURACION_MINIMA_SEGUNDOS,
  duracionCorta,
  PESO_MAXIMO_BYTES,
} from "@/lib/videos/reglas";
import { cn } from "@/lib/utils";

type Elegido = {
  archivo: File;
  duracion: number;
  ancho: number;
  alto: number;
  vistaPrevia: string;
  portada: File | null;
};

/**
 * SUBIR UN SHORT, FÁCIL DE VERDAD.
 *
 * ══ LO QUE HACE EL NAVEGADOR ANTES DE SUBIR NADA ══
 *
 * 1. **Mide la duración** y rechaza en el acto lo que pase de tres minutos.
 *    Hacer esperar cinco minutos una subida para después decir «muy largo» es
 *    la forma más cara de perder a un comercio.
 * 2. **Saca la portada** del propio video (un fotograma del segundo 1) y la
 *    manda como imagen. Sin portada, una hilera de ocho videos se ve como ocho
 *    recuadros negros.
 * 3. **Enseña la vista previa** con el tiempo y el peso: la persona ve lo que
 *    va a publicar antes de publicarlo.
 *
 * La barra de avance es real (`XMLHttpRequest` contra `/upload/video` da el
 * progreso de subida; una acción de servidor no): 80 MB por la conexión de
 * Venezuela son minutos, y sin barra la gente cree que se colgó y reintenta.
 */
export function SubirVideo({ tiendaId }: { tiendaId?: string }) {
  const t = useTranslations("panel.videos");
  const tm = useTranslations("panel.mensajes.videos");
  const router = useRouter();
  const [elegido, setElegido] = useState<Elegido | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avance, setAvance] = useState<number | null>(null);
  const [optimizando, setOptimizando] = useState<number | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const formulario = useRef<HTMLFormElement>(null);

  async function elegir(archivo: File) {
    setError(null);
    setListo(null);
    if (!archivo.type.startsWith("video/")) {
      setError(tm("noEsVideo"));
      return;
    }
    if (archivo.size > PESO_MAXIMO_BYTES) {
      setError(
        tm("muyPesado", { mb: Math.floor(PESO_MAXIMO_BYTES / 1024 / 1024) }),
      );
      return;
    }
    const url = URL.createObjectURL(archivo);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
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
      URL.revokeObjectURL(url);
      setError(tm("sinDuracion"));
      return;
    }
    if (datos.duracion > DURACION_MAXIMA_SEGUNDOS) {
      URL.revokeObjectURL(url);
      setError(
        tm("muyLargo", { minutos: Math.floor(DURACION_MAXIMA_SEGUNDOS / 60) }),
      );
      return;
    }
    if (datos.duracion < DURACION_MINIMA_SEGUNDOS) {
      URL.revokeObjectURL(url);
      setError(tm("muyCorto"));
      return;
    }

    /* La portada: el fotograma del segundo 1 (o de la mitad si dura menos). */
    let portada: File | null = null;
    try {
      video.currentTime = Math.min(1, datos.duracion / 2);
      await new Promise<void>((resolver) => {
        video.onseeked = () => resolver();
        setTimeout(resolver, 2500);
      });
      const lienzo = document.createElement("canvas");
      const lado = 720;
      const escala = Math.min(1, lado / Math.max(datos.ancho, datos.alto, 1));
      lienzo.width = Math.round(datos.ancho * escala) || lado;
      lienzo.height = Math.round(datos.alto * escala) || lado;
      lienzo
        .getContext("2d")
        ?.drawImage(video, 0, 0, lienzo.width, lienzo.height);
      const blob = await new Promise<Blob | null>((resolver) =>
        lienzo.toBlob(resolver, "image/webp", 0.8),
      );
      if (blob)
        portada = new File([blob], "portada.webp", { type: "image/webp" });
    } catch {
      /* Sin portada se publica igual: la tarjeta cae al propio video. */
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

  async function publicar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!elegido) {
      setError(tm("elige"));
      return;
    }
    const datos = new FormData(e.currentTarget);

    /* ══ PRIMERO SE ENCOGE, DESPUÉS SE SUBE (24 ago 2026) ══

       Un video de teléfono sale a 10-15 Mbps y el que lo mira con una
       conexión normal lo ve cortarse. Aquí se baja al perfil de las redes
       (720p · 30 cuadros · ~2,8 Mbps) con el índice adelante. Si comprimir
       falla, se sube el original — igual que las fotos. */
    setError(null);
    setOptimizando(0);
    const resultado = await comprimirVideo(
      elegido.archivo,
      elegido.duracion,
      (p) => setOptimizando(Math.round(p * 100)),
    );
    setOptimizando(null);

    datos.set("video", resultado.archivo);
    if (elegido.portada) datos.set("portada", elegido.portada);
    datos.set("duracionSegundos", String(Math.round(elegido.duracion)));
    datos.set("anchoPx", String(resultado.ancho ?? elegido.ancho));
    datos.set("altoPx", String(resultado.alto ?? elegido.alto));
    if (tiendaId) datos.set("tiendaId", tiendaId);

    setError(null);
    setAvance(0);
    const r = await subirConAvance(datos, setAvance, tm("sinRed")).catch(
      (fallo: unknown) => {
        setError(fallo instanceof Error ? fallo.message : String(fallo));
        return null;
      },
    );
    setAvance(null);
    if (!r) return;
    if (!r.ok) {
      setError(r.mensaje);
      return;
    }
    setListo(r.mensaje);
    URL.revokeObjectURL(elegido.vistaPrevia);
    setElegido(null);
    formulario.current?.reset();
    if (entrada.current) entrada.current.value = "";
    /* La lista de abajo la dibuja el servidor: sin este refresco, el comercio
       publica y no ve su video hasta que recarga a mano. */
    router.refresh();
  }

  return (
    <form ref={formulario} onSubmit={publicar} className="space-y-5">
      {/* LA GUÍA 1-2-3, antes del formulario: qué grabar y cómo. */}
      <ol className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <li key={n} className="rounded-xl border border-borde bg-white p-4">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-carga-500/10 text-sm font-bold text-carga-600">
              {n}
            </span>
            <p className="mt-2 text-sm font-bold text-riel-900">
              {t(`guia.paso${n}.titulo`)}
            </p>
            <p className="mt-1 text-sm leading-snug text-tinta-suave">
              {t(`guia.paso${n}.texto`)}
            </p>
          </li>
        ))}
      </ol>

      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          elegido
            ? "border-carga-500/50 bg-carga-500/5"
            : "border-borde bg-slate-50",
        )}
      >
        {elegido ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:text-left">
            <video
              src={elegido.vistaPrevia}
              playsInline
              controls
              /* CON SONIDO, a propósito (24 ago 2026). Estaba `muted` y el
                 comercio le daba play y no oía nada — justo cuando uno quiere
                 comprobar qué video eligió y qué está diciendo. Aquí no hay
                 autoplay (la persona pulsa play), así que el navegador no
                 obliga a silenciarlo. */
              className="h-56 w-auto rounded-lg bg-black"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-riel-900">
                {elegido.archivo.name}
              </p>
              <p className="mt-1 text-sm font-medium text-carga-600">
                {t("dalePlay")}
              </p>
              <p className="mt-1 text-sm text-tinta-suave">
                {t("duracion")}:{" "}
                <strong className="tabular-nums">
                  {duracionCorta(elegido.duracion)}
                </strong>{" "}
                · {(elegido.archivo.size / 1024 / 1024).toFixed(1)} MB ·{" "}
                {elegido.alto > elegido.ancho ? t("vertical") : t("horizontal")}
              </p>
              {elegido.alto <= elegido.ancho ? (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-800">
                  <TriangleAlert
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden
                  />
                  {t("mejorVertical")}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(elegido.vistaPrevia);
                  setElegido(null);
                  if (entrada.current) entrada.current.value = "";
                }}
                className="mt-3 text-sm font-semibold text-riel-700 underline underline-offset-2 hover:text-carga-600"
              >
                {t("elegirOtro")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <Clapperboard
              className="mx-auto h-8 w-8 text-tinta-suave"
              aria-hidden
            />
            <p className="mt-2 text-sm font-semibold text-riel-900">
              {t("suelta")}
            </p>
            <p className="mt-1 text-xs text-tinta-suave">
              {t("limites", {
                minutos: Math.floor(DURACION_MAXIMA_SEGUNDOS / 60),
                mb: Math.floor(PESO_MAXIMO_BYTES / 1024 / 1024),
              })}
            </p>
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="boton-principal mt-4 gap-2"
            >
              <Upload className="h-4 w-4" aria-hidden />
              {t("elegir")}
            </button>
          </>
        )}
        <input
          ref={entrada}
          type="file"
          /* `video/*` y no una lista cerrada: el iPhone graba .mov y algunos
             Android declaran tipos raros. Lo que no sirva se rechaza al leerlo. */
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const archivo = e.currentTarget.files?.[0];
            if (archivo) void elegir(archivo);
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          tipo="textoCorto"
          nombre="tituloEs"
          etiqueta={t("tituloEs")}
          ayuda={t("tituloAyuda")}
          requerido
        />
        <Campo
          tipo="textoCorto"
          nombre="tituloEn"
          etiqueta={t("tituloEn")}
          ayuda={t("tituloEnAyuda")}
        />
      </div>
      <Campo
        tipo="textoLargo"
        nombre="descripcionEs"
        etiqueta={t("descripcionEs")}
        ayuda={t("descripcionAyuda")}
        area
        filas={3}
      />

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
      {listo ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {listo}
        </p>
      ) : null}

      {optimizando !== null || avance !== null ? (
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-carga-500 transition-[width]"
              style={{ width: `${optimizando ?? avance ?? 0}%` }}
            />
          </div>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-tinta-suave">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {optimizando !== null
              ? t("optimizando", { pct: optimizando })
              : t("subiendo", { pct: avance ?? 0 })}
          </p>
        </div>
      ) : (
        <button
          type="submit"
          disabled={!elegido}
          className="boton-principal gap-2 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" aria-hidden />
          {t("publicar")}
        </button>
      )}
    </form>
  );
}
