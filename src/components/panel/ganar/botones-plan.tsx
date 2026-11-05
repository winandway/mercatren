"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { useRouter } from "@/i18n/navigation";
import { accionDelPlan } from "@/lib/ganar/acciones";

/**
 * Los botones del plan Pro en el panel: empezar el mes gratis, seguir o
 * cancelar (cancelar pide confirmar en la misma tarjeta, sin ventanas).
 */
export function BotonesPlan({
  vista,
}: {
  vista: "ofrecer" | "pro" | "termina" | "terminado";
}) {
  const t = useTranslations("panel.ganar");
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function hacer(accion: "empezar" | "cancelar" | "seguir") {
    setError(null);
    iniciar(async () => {
      const r = await accionDelPlan(accion);
      if (r.ok) {
        setConfirmando(false);
        router.refresh();
      } else {
        setError(
          r.motivo === "ya_tuvo_prueba" ? t("yaTuvoPrueba") : t("error"),
        );
      }
    });
  }

  const girando = pendiente ? (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
  ) : null;

  return (
    <div className="space-y-2">
      {vista === "ofrecer" ? (
        <>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => hacer("empezar")}
            className="boton-principal gap-2 disabled:opacity-60"
          >
            {girando}
            {t("empezar")}
          </button>
          <p className="text-xs text-tinta-suave">{t("sinTarjeta")}</p>
        </>
      ) : null}
      {vista === "termina" ? (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => hacer("seguir")}
          className="boton-principal gap-2 disabled:opacity-60"
        >
          {girando}
          {t("seguir")}
        </button>
      ) : null}
      {vista === "pro" && !confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="text-sm text-tinta-suave underline hover:text-tinta"
        >
          {t("cancelar")}
        </button>
      ) : null}
      {vista === "pro" && confirmando ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <p>{t("cancelarPregunta")}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={pendiente}
              onClick={() => hacer("cancelar")}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {girando}
              {t("cancelar")}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-white"
            >
              {t("seguir")}
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
