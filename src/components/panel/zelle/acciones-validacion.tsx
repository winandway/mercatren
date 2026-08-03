"use client";

import { Check, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { aprobarPago, rechazarPago } from "@/lib/zelle/acciones";

/**
 * Lo que puede hacer el validador con un pago que espera revision.
 *
 * Aprobar mueve dinero de verdad, asi que el boton se bloquea mientras trabaja
 * y el resultado se dice con todas las letras. Rechazar obliga a escribir el
 * motivo: el comercio tiene derecho a saber por que.
 */
export function AccionesValidacion({ pagoId }: { pagoId: string }) {
  const t = useTranslations("panel.zelle.validacion");
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  function aprobar() {
    iniciarTransicion(async () => {
      const resultado = await aprobarPago(pagoId);
      setAviso({ ok: resultado.ok, texto: resultado.mensaje });
      if (resultado.ok) router.refresh();
    });
  }

  function rechazar() {
    iniciarTransicion(async () => {
      const resultado = await rechazarPago(pagoId, motivo);
      setAviso({ ok: resultado.ok, texto: resultado.mensaje });
      if (resultado.ok) {
        setPidiendoMotivo(false);
        router.refresh();
      }
    });
  }

  if (aviso?.ok) {
    return (
      <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
        {aviso.texto}
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      {pidiendoMotivo ? (
        <div className="space-y-2">
          <label
            htmlFor={`motivo-${pagoId}`}
            className="block text-xs font-semibold"
          >
            {t("motivoTitulo")}
          </label>
          <textarea
            id={`motivo-${pagoId}`}
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={t("motivoPlaceholder")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-carga-500 focus:ring-2 focus:ring-carga-500/30"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={rechazar}
              disabled={pendiente || motivo.trim().length < 5}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {pendiente ? t("trabajando") : t("confirmarRechazo")}
            </button>
            <button
              type="button"
              onClick={() => setPidiendoMotivo(false)}
              disabled={pendiente}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50"
            >
              {t("cancelar")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={aprobar}
            disabled={pendiente}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {pendiente ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden />
            )}
            {t("aprobar")}
          </button>
          <button
            type="button"
            onClick={() => setPidiendoMotivo(true)}
            disabled={pendiente}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {t("rechazar")}
          </button>
        </div>
      )}

      {aviso && !aviso.ok ? (
        <p
          role="alert"
          className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {aviso.texto}
        </p>
      ) : null}
    </div>
  );
}
