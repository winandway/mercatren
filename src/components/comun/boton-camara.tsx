"use client";

import { Camera, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import {
  entregarAlInput,
  esCelular,
  fotoDelVideo,
  motivoDelFallo,
  type FalloCamara,
} from "@/lib/camara";
import { cn } from "@/lib/utils";

/**
 * «TOMAR FOTO», al lado de toda casilla de imagen (regla global, 9 nov 2026).
 *
 * - En el celular abre la cámara trasera del aparato.
 * - En la computadora abre la cámara web en una ventanita con su botón.
 * - Sin cámara o sin permiso lo dice en palabras; la casilla de archivos sigue
 *   ahí para subirla desde el aparato.
 *
 * La foto entra en la casilla de siempre, así pasa por la misma validación y
 * compresión que un archivo elegido a mano. Esa casilla es la del `id` que
 * llega en `para`; sin `para`, la casilla de imagen más cercana al botón
 * (por eso el botón va justo al lado de su casilla).
 */
export function BotonCamara({
  para,
  className,
  deshabilitado = false,
}: {
  /** El `id` del `<input type="file">` que recibe la foto (opcional). */
  para?: string;
  className?: string;
  deshabilitado?: boolean;
}) {
  const t = useTranslations("camara");
  const [abierta, setAbierta] = useState(false);
  const [fallo, setFallo] = useState<FalloCamara | null>(null);
  const [lista, setLista] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const boton = useRef<HTMLButtonElement>(null);

  const apagar = () => {
    flujo.current?.getTracks().forEach((pista) => pista.stop());
    flujo.current = null;
    setLista(false);
  };

  useEffect(() => apagar, []);

  const entregar = (archivo: File | null | undefined) => {
    if (!archivo) return;
    const input = para
      ? (document.getElementById(para) as HTMLInputElement | null)
      : casillaCercana(boton.current);
    if (!entregarAlInput(input, archivo)) setFallo("sinCamara");
  };

  const abrir = async () => {
    setFallo(null);
    if (esCelular()) {
      /* El celular trae su propia cámara: una casilla temporal con
         `capture` la abre directo, y la foto se pasa a la casilla real. */
      const temporal = document.createElement("input");
      temporal.type = "file";
      temporal.accept = "image/*";
      temporal.setAttribute("capture", "environment");
      temporal.onchange = () => entregar(temporal.files?.[0]);
      temporal.click();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setFallo("sinCamara");
      return;
    }
    setAbierta(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      flujo.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play().catch(() => undefined);
      }
      setLista(true);
    } catch (error) {
      setAbierta(false);
      setFallo(motivoDelFallo(error));
    }
  };

  const cerrar = () => {
    apagar();
    setAbierta(false);
  };

  const capturar = async () => {
    if (!video.current) return;
    const foto = await fotoDelVideo(video.current);
    cerrar();
    entregar(foto);
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        onClick={() => void abrir()}
        disabled={deshabilitado}
        data-boton-camara
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm font-semibold transition-colors hover:border-carga-500 disabled:opacity-50",
          className,
        )}
      >
        <Camera className="h-4 w-4" aria-hidden />
        {t("tomarFoto")}
      </button>
      {fallo ? (
        <p role="status" className="mt-1 text-xs text-tinta-suave">
          {t(fallo)}
        </p>
      ) : null}

      {abierta ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("titulo")}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onKeyDown={(e) => {
            if (e.key === "Escape") cerrar();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{t("titulo")}</p>
              <button
                type="button"
                onClick={cerrar}
                aria-label={t("cancelar")}
                className="rounded p-1 text-tinta-suave hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <video
              ref={video}
              playsInline
              muted
              className="aspect-[4/3] w-full rounded-lg bg-black object-cover"
            />
            {!lista ? (
              <p className="mt-2 text-xs text-tinta-suave">{t("abriendo")}</p>
            ) : null}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrar}
                className="rounded-lg border border-borde px-4 py-2 text-sm font-semibold"
              >
                {t("cancelar")}
              </button>
              <button
                type="button"
                onClick={() => void capturar()}
                disabled={!lista}
                className="rounded-lg bg-riel-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t("capturar")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * La casilla de imagen más cercana: se sube desde el botón, de padre en padre,
 * hasta encontrar un `<input type="file">` que acepte imágenes.
 */
export function casillaCercana(
  desde: HTMLElement | null,
  niveles = 5,
): HTMLInputElement | null {
  let nodo: HTMLElement | null = desde?.parentElement ?? null;
  for (let i = 0; nodo && i < niveles; i++) {
    const casillas = Array.from(
      nodo.querySelectorAll<HTMLInputElement>('input[type="file"]'),
    ).filter((c) => !c.accept || /image/i.test(c.accept));
    if (casillas.length > 0) return casillas[0] ?? null;
    nodo = nodo.parentElement;
  }
  return null;
}
