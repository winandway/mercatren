"use client";

import { Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { borrarVideo } from "@/lib/videos/acciones";

/**
 * El menú de tres puntos de un video. Borrar SIEMPRE va aquí dentro y con
 * confirmación aparte: es regla de la casa y aquí se borra un archivo que la
 * persona grabó y subió — no hay deshacer.
 */
export function AccionesVideo({ id, titulo }: { id: string; titulo: string }) {
  const t = useTranslations("panel.videos");
  const [abierto, setAbierto] = useState(false);
  const [borrando, setBorrando] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-label={t("masOpciones")}
        aria-expanded={abierto}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-tinta-suave hover:bg-slate-100 hover:text-riel-900"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>
      {abierto ? (
        <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-borde bg-white shadow-lg">
          <button
            type="button"
            disabled={borrando}
            onClick={async () => {
              if (!window.confirm(t("seguroBorrar", { titulo }))) return;
              setBorrando(true);
              await borrarVideo(id);
              setBorrando(false);
              setAbierto(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {borrando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            {t("borrar")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
