"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { useRouter } from "@/i18n/navigation";
import { accionEstadoPromocion } from "@/lib/ganar/acciones";

/** Pausar o reanudar una promoción (no borra nada). */
export function EstadoPromocion({
  id,
  estado,
}: {
  id: string;
  estado: "activa" | "pausada";
}) {
  const t = useTranslations("panel.ganar");
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() =>
        iniciar(async () => {
          await accionEstadoPromocion(
            id,
            estado === "activa" ? "pausada" : "activa",
          );
          router.refresh();
        })
      }
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
    >
      {pendiente ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : null}
      {t(estado === "activa" ? "promoPausar" : "promoReanudar")}
    </button>
  );
}
