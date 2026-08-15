"use client";

import { Check, Loader2, MoreVertical, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "@/i18n/navigation";
import {
  cancelarRetiro,
  marcarRetiroPagado,
  rechazarRetiro,
} from "@/lib/retiros/acciones";

/**
 * Lo que se puede hacer con un retiro que está esperando.
 *
 * "Ya lo pagué" es la acción normal y va a la vista. Rechazar y cancelar se
 * pueden lamentar, así que van dentro del menú de tres puntos (regla del
 * proyecto) y piden confirmación aparte.
 *
 * OJO: este botón no mueve dinero. La transferencia la hace una persona en el
 * banco; aquí solo se deja constancia de que ya se hizo.
 */
export function AccionesRetiro({
  id,
  puedePagar,
  puedeCancelar,
}: {
  id: string;
  /** Solo el equipo de Mercatren paga y rechaza. */
  puedePagar: boolean;
  /** El comercio puede echarse atrás mientras nadie lo haya tocado. */
  puedeCancelar: boolean;
}) {
  const t = useTranslations("panel.retiros");
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState<"pagar" | "rechazar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const caja = useRef<HTMLDivElement>(null);
  const referencia = useRef<HTMLInputElement>(null);
  const captura = useRef<HTMLInputElement>(null);
  const motivo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!menu) return;
    const alTocar = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setMenu(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [menu]);

  function correr(tarea: () => Promise<{ ok: boolean; mensaje: string }>) {
    setError(null);
    iniciar(async () => {
      const r = await tarea();
      if (r.ok) {
        setPanel(null);
        router.refresh();
      } else {
        setError(r.mensaje);
      }
    });
  }

  if (panel === "pagar") {
    return (
      <div className="w-full max-w-sm space-y-2">
        <label htmlFor={`ref-${id}`} className="block text-xs font-medium">
          {t("referencia")}
        </label>
        <input
          ref={referencia}
          id={`ref-${id}`}
          type="text"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-carga-500"
        />
        <p className="text-xs text-tinta-suave">{t("referenciaAyuda")}</p>

        {/**
         * LA CAPTURA DE LA TRANSFERENCIA.
         *
         * Una ACH tarda uno o dos días y un wire internacional más. Sin la
         * captura, el comercio ve «pagado» en su panel y NADA en su cuenta, y
         * lo único que puede hacer es escribir preguntando. Con ella sabe que
         * salió de verdad y que solo hay que esperar.
         *
         * Es OPCIONAL: un retiro a otro comercio de Mercatren no tiene
         * comprobante que subir —el dinero no sale del sistema— y exigirla
         * dejaría ese caso sin poder marcarse.
         */}
        <label
          htmlFor={`captura-${id}`}
          className="block pt-1 text-xs font-medium"
        >
          {t("capturaTransferencia")}
        </label>
        <input
          ref={captura}
          id={`captura-${id}`}
          type="file"
          /* `image/*` y no una lista cerrada: la lista dejaba fuera el HEIC,
             que es el formato por defecto del iPhone. */
          accept="image/*,application/pdf"
          className="block w-full text-xs file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold"
        />
        <p className="text-xs text-tinta-suave">{t("capturaAyuda")}</p>
        {error ? (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              correr(() =>
                marcarRetiroPagado(
                  id,
                  referencia.current?.value ?? "",
                  captura.current?.files?.[0] ?? null,
                ),
              )
            }
            className="boton-principal gap-2 text-sm disabled:opacity-60"
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Check className="h-4 w-4" aria-hidden />
            )}
            {t("confirmarPago")}
          </button>
          <button
            type="button"
            onClick={() => setPanel(null)}
            className="rounded-lg px-3 py-2 text-sm text-tinta-suave hover:bg-slate-100"
          >
            {t("cancelar")}
          </button>
        </div>
      </div>
    );
  }

  if (panel === "rechazar") {
    return (
      <div className="w-full max-w-sm space-y-2">
        <label htmlFor={`motivo-${id}`} className="block text-xs font-medium">
          {t("motivo")}
        </label>
        <textarea
          ref={motivo}
          id={`motivo-${id}`}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-carga-500"
        />
        {error ? (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pendiente}
            onClick={() =>
              correr(() => rechazarRetiro(id, motivo.current?.value ?? ""))
            }
            className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <X className="h-4 w-4" aria-hidden />
            )}
            {t("confirmarRechazo")}
          </button>
          <button
            type="button"
            onClick={() => setPanel(null)}
            className="rounded-lg px-3 py-2 text-sm text-tinta-suave hover:bg-slate-100"
          >
            {t("cancelar")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {puedePagar ? (
        <button
          type="button"
          onClick={() => setPanel("pagar")}
          className="hover:bg-precio-700 inline-flex items-center gap-1.5 rounded-lg bg-precio-600 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-white transition-colors"
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          {t("marcarPagado")}
        </button>
      ) : null}

      {puedePagar || puedeCancelar ? (
        <div ref={caja} className="relative">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-label={t("masOpciones")}
            aria-expanded={menu}
            className="rounded-lg p-2 text-tinta-suave transition-colors hover:bg-slate-100 hover:text-tinta"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </button>

          {menu ? (
            <div className="absolute top-full right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg bg-white py-1 shadow-xl ring-1 ring-black/10">
              {puedePagar ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    setPanel("rechazar");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" aria-hidden />
                  {t("rechazar")}
                </button>
              ) : null}

              {puedeCancelar ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    if (window.confirm(t("seguroCancelar"))) {
                      correr(() => cancelarRetiro(id));
                    }
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" aria-hidden />
                  {t("cancelarMio")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
