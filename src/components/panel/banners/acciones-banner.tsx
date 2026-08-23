"use client";

import {
  Loader2,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { borrarBanner, cambiarEstadoBanner } from "@/lib/banners/acciones";

/**
 * Las acciones de un banner en la lista. Editar y pausar/activar a la vista;
 * ELIMINAR dentro de los tres puntos y con confirmación, como manda la casa:
 * un botón de borrar suelto se toca sin querer en el celular.
 */
export function AccionesBanner({
  id,
  activo,
}: {
  id: string;
  activo: boolean;
}) {
  const t = useTranslations("panel.banners.acciones");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, empezar] = useTransition();

  return (
    <div className="relative flex items-center justify-end gap-1">
      <Link
        href={`/panel/banners/${id}`}
        className="inline-flex items-center gap-1 rounded-lg border border-borde px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        {t("editar")}
      </Link>
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          empezar(async () => {
            await cambiarEstadoBanner(id, !activo);
            router.refresh();
          })
        }
        className="inline-flex items-center gap-1 rounded-lg border border-borde px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-60"
      >
        {pendiente ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : activo ? (
          <Pause className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Play className="h-3.5 w-3.5" aria-hidden />
        )}
        {activo ? t("pausar") : t("activar")}
      </button>
      <button
        type="button"
        aria-label={t("masOpciones")}
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="rounded-lg border border-borde p-1.5 hover:bg-slate-50"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>
      {abierto ? (
        <div className="absolute top-full right-0 z-10 mt-1 w-44 rounded-lg border border-borde bg-white p-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
            onClick={() => {
              setAbierto(false);
              if (window.confirm(t("seguroBorrar"))) {
                empezar(async () => {
                  await borrarBanner(id);
                  router.refresh();
                });
              }
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {t("borrar")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
