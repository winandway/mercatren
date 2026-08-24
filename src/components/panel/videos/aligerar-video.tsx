"use client";

import { Loader2, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  comprimirVideo,
  UMBRAL_BITS_POR_SEGUNDO,
} from "@/lib/videos/comprimir-video";

/**
 * «ALIGERAR»: encoger un video que ya está subido (24 ago 2026).
 *
 * Los primeros videos entraron TAL CUAL salieron del teléfono (61,8 MB por
 * 34 segundos, medido en producción) porque la compresión al subir no
 * existía. Este botón lo arregla sin volver a grabar: baja el video, lo
 * encoge EN EL NAVEGADOR con el mismo compresor de la subida, y lo devuelve.
 *
 * Solo se dibuja en los videos PESADOS (por encima del umbral): en uno ya
 * liviano sería un mueble, y cien botones que no hacen falta enseñan a
 * ignorar el que sí.
 */
export function AligerarVideo({
  videoId,
  url,
  pesoBytes,
  duracionSegundos,
}: {
  videoId: string;
  url: string;
  pesoBytes: number;
  duracionSegundos: number;
}) {
  const t = useTranslations("panel.videos");
  const router = useRouter();
  const [fase, setFase] = useState<null | string>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  const pesado =
    duracionSegundos > 0 &&
    (pesoBytes * 8) / duracionSegundos > UMBRAL_BITS_POR_SEGUNDO;
  if (!pesado) return null;

  async function aligerar() {
    setAviso(null);
    try {
      setFase(t("aligerando.bajando"));
      const respuesta = await fetch(url);
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const original = new File([await respuesta.blob()], "video.mp4", {
        type: respuesta.headers.get("content-type") ?? "video/mp4",
      });

      const r = await comprimirVideo(original, duracionSegundos, (p) =>
        setFase(t("aligerando.comprimiendo", { pct: Math.round(p * 100) })),
      );
      if (!r.comprimido) {
        setAviso({ ok: false, texto: t("aligerando.noSePudo") });
        return;
      }

      setFase(t("aligerando.subiendo"));
      const datos = new FormData();
      datos.set("videoId", videoId);
      datos.set("video", r.archivo);
      if (r.ancho) datos.set("anchoPx", String(r.ancho));
      if (r.alto) datos.set("altoPx", String(r.alto));
      const subida = await fetch("/upload/video", {
        method: "POST",
        body: datos,
      });
      const cuerpo = (await subida.json()) as { ok: boolean; mensaje: string };
      setAviso({ ok: cuerpo.ok, texto: cuerpo.mensaje });
      if (cuerpo.ok) router.refresh();
    } catch (fallo) {
      setAviso({
        ok: false,
        texto: fallo instanceof Error ? fallo.message : String(fallo),
      });
    } finally {
      setFase(null);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      {fase ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-tinta-suave">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          {fase}
        </span>
      ) : (
        <button
          type="button"
          onClick={aligerar}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200"
        >
          <Zap className="h-3.5 w-3.5" aria-hidden />
          {t("aligerando.boton")}
        </button>
      )}
      {aviso ? (
        <span
          role="status"
          className={
            aviso.ok ? "text-xs text-precio-600" : "text-xs text-red-700"
          }
        >
          {aviso.texto}
        </span>
      ) : null}
    </span>
  );
}
