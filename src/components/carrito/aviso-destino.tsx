"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Destino } from "@/lib/destino/reglas";

/**
 * EL AVISO DE QUE NO SE PUEDEN MEZCLAR DESTINOS, con la salida a mano.
 *
 * Sale cuando alguien intenta meter en el carrito algo que se entrega en el
 * otro país. Decirle «no se puede» y dejarlo ahí sería mandarlo a vaciar el
 * carrito a mano; aquí tiene el botón: **vaciar y llevarse este**.
 */
export function AvisoDestino({
  hay,
  entra,
  onVaciarYAgregar,
  onCancelar,
}: {
  hay: Destino;
  entra: Destino;
  onVaciarYAgregar: () => void;
  onCancelar: () => void;
}) {
  const t = useTranslations("carrito.destino");
  return (
    <div
      role="alertdialog"
      aria-label={t("titulo")}
      className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900"
    >
      <p className="flex items-start gap-2 font-semibold">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("titulo")}
      </p>
      <p className="mt-1 pl-6 leading-snug">
        {t("texto", { hay: t(`lugar.${hay}`), entra: t(`lugar.${entra}`) })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 pl-6">
        <button
          type="button"
          onClick={onVaciarYAgregar}
          className="rounded-lg bg-amber-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-800"
        >
          {t("vaciarYAgregar")}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-semibold hover:bg-amber-100"
        >
          {t("dejarComoEsta")}
        </button>
      </div>
    </div>
  );
}
