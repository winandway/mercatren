"use client";

import { AlertTriangle, Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { corregirMontoDePago } from "@/lib/zelle/corregir";

/**
 * CORREGIR EL MONTO ANTES DE APROBAR.
 *
 * ══ POR QUÉ ESTÁ AQUÍ Y NO ESCONDIDO ══
 *
 * Porque el fallo que lo pidió no se ve. Un cobro de $2.774,04 recibió una
 * transferencia de $500,00 y la pantalla no decía nada: el validador miraba la
 * captura, veía que era legítima, y aprobaba. Con eso se le acreditaban al
 * comercio $2.690,82 por un dinero que nunca llegó.
 *
 * El aviso va **arriba del botón de aprobar** y lo dice con todas las letras:
 * al aprobar se acredita ESTE monto. Es la única forma de que alguien mire el
 * número antes de tocar.
 *
 * ══ CORREGIR NO APRUEBA ══
 *
 * Deja el pago pendiente con los números buenos. Aprobar sigue siendo el botón
 * de siempre, con sus alertas. Un solo clic que cambia un monto y mueve dinero
 * a la vez es justo lo que no se puede revisar después.
 */
export function CorregirMonto({
  pagoId,
  montoCentavos,
}: {
  pagoId: string;
  /** Lo que el pago dice hoy, para enseñarlo y para el campo. */
  montoCentavos: number;
}) {
  const t = useTranslations("panel.correccion");
  const tv = useTranslations("panel.zelle.validacion");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [trabajando, iniciar] = useTransition();
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function corregir() {
    setError(null);
    iniciar(async () => {
      /* EL MONTO NO USA EL FILTRO DE «SOLO NÚMEROS»: ese se come el punto
         decimal, y 500.00 se guardaría como 50000 — quinientos dólares
         convertidos en cinco mil. Ya pasó en los retiros y en la calculadora. */
      const centavos = Math.round(Number(monto.replace(/[^0-9.]/g, "")) * 100);
      const r = await corregirMontoDePago(pagoId, centavos, motivo);
      if (r.ok) {
        setAbierto(false);
        setMonto("");
        setMotivo("");
        router.refresh();
      } else {
        setError(r.mensaje);
      }
    });
  }

  if (!abierto) {
    return (
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("ayuda")}
        </p>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          {t("titulo")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-amber-400 bg-amber-50 p-3">
      <label className="block">
        <span className="text-xs font-bold text-amber-900">
          {t("montoReal")}
        </span>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-amber-900">$</span>
          <input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            inputMode="decimal"
            placeholder={(montoCentavos / 100).toFixed(2)}
            className="w-32 rounded-lg border border-amber-300 px-2 py-2 text-base tabular-nums outline-none focus:border-carga-500 sm:text-sm"
          />
          <span className="text-xs text-amber-900">
            {t("decia")}{" "}
            <strong className="tabular-nums">
              ${(montoCentavos / 100).toFixed(2)}
            </strong>
          </span>
        </div>
      </label>

      <label className="block">
        <span className="text-xs font-bold text-amber-900">{t("motivo")}</span>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={t("motivoEjemplo")}
          className="mt-1 w-full rounded-lg border border-amber-300 px-2 py-2 text-base outline-none focus:border-carga-500 sm:text-sm"
        />
      </label>

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={corregir}
          disabled={trabajando}
          className="inline-flex items-center gap-1.5 rounded-lg bg-riel-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {trabajando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          {t("corregir")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-semibold text-amber-900"
        >
          {tv("cancelar")}
        </button>
      </div>
    </div>
  );
}
