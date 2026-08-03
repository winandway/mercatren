"use client";

import { Printer, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { HojaTique } from "@/components/panel/hoja-tique";
import type { PagoVista } from "@/lib/zelle/vista";

/**
 * El tique de una venta, en su propia ventana y listo para imprimir.
 *
 * REGLA DE NEGOCIO: un pago aprobado ya está pagado y ya está entregado. No se
 * espera a que el cliente pase por el negocio ni a que nadie confirme nada, así
 * que el tique nace cerrado y dice "entregado" de entrada.
 *
 * Al imprimir se esconde todo lo demás de la pantalla y queda solo esta hoja,
 * sin botones. Las reglas de impresión viven en `globals.css` bajo
 * `@media print`.
 */
export function Tique({
  pago,
  comercio,
  onCerrar,
}: {
  pago: PagoVista;
  comercio: string | null;
  onCerrar: () => void;
}) {
  const t = useTranslations("panel.tique");
  const tz = useTranslations("panel.zelle");
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("titulo")}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-6"
    >
      <button
        type="button"
        aria-label={tz("visor.cerrar")}
        onClick={onCerrar}
        className="fixed inset-0 bg-riel-950/85 backdrop-blur-sm print:hidden"
      />

      <div className="hoja-tique relative my-auto w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex justify-end gap-1 p-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-tinta-suave transition-colors hover:bg-slate-100 hover:text-tinta"
          >
            <Printer className="h-4 w-4" aria-hidden />
            {t("imprimir")}
          </button>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label={tz("visor.cerrar")}
            className="rounded-lg p-1.5 text-tinta-suave transition-colors hover:bg-slate-100 hover:text-tinta"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <HojaTique pago={pago} comercio={comercio} />
      </div>
    </div>
  );
}
