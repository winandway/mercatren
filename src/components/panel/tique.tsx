"use client";

import { Printer, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora, fechaLarga, ZONA } from "@/lib/fechas";
import type { PagoVista } from "@/lib/zelle/vista";

/**
 * El tique de una venta, listo para imprimir.
 *
 * REGLA DE NEGOCIO: un pago aprobado ya está pagado y ya está entregado. No se
 * espera a que el cliente pase por el negocio ni a que nadie confirme nada, así
 * que el tique nace cerrado y dice "entregado" de entrada.
 *
 * Está pensado para salir bien en papel: al imprimir se esconde todo lo demás
 * de la pantalla y queda solo esta hoja, en blanco y negro, sin botones. Las
 * reglas de impresión viven en `globals.css` bajo `@media print`.
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
  const idioma = useLocale() as Idioma;
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

  // Lo que no se sabe no se inventa: la fila entera desaparece.
  const lineas: { etiqueta: string; valor: string | null }[] = [
    {
      etiqueta: t("fecha"),
      valor: pago.fechaTransaccion
        ? fechaLarga(pago.fechaTransaccion, idioma)
        : null,
    },
    {
      etiqueta: t("confirmacion"),
      valor: pago.codigoConfirmacion,
    },
    {
      etiqueta: t("banco"),
      valor:
        [
          pago.bancoOrigen,
          pago.cuentaUltimos4 ? `…${pago.cuentaUltimos4}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
    },
    { etiqueta: t("recibio"), valor: pago.cuentaReceptora },
    { etiqueta: t("comercio"), valor: comercio },
    {
      etiqueta: t("aprobado"),
      valor: pago.aprobadoEn ? fechaHora(pago.aprobadoEn, idioma) : null,
    },
  ];

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

        <div className="px-6 pb-6 sm:px-8">
          {/* Cabecera con la marca */}
          <div className="border-b border-dashed border-slate-300 pb-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_mercatren/mercatren-isologotipo-horizontal-com.svg"
              alt="Mercatren"
              className="mx-auto h-8"
            />
            <p className="mt-2 text-[11px] tracking-wider text-tinta-suave uppercase">
              {t("titulo")}
            </p>
          </div>

          {/* El monto, que es lo que se mira primero */}
          <div className="border-b border-dashed border-slate-300 py-5 text-center">
            <p className="text-4xl font-extrabold tracking-tight tabular-nums">
              {formatearPrecio(pago.montoCentavos, idioma, pago.moneda)}
            </p>
            <p className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
              {t("entregado")}
            </p>
          </div>

          {/* Los datos */}
          <dl className="border-b border-dashed border-slate-300 py-4 text-sm">
            {lineas
              .filter((l) => l.valor)
              .map((l) => (
                <div
                  key={l.etiqueta}
                  className="flex justify-between gap-4 py-1.5"
                >
                  <dt className="shrink-0 text-tinta-suave">{l.etiqueta}</dt>
                  <dd className="text-right font-medium break-words">
                    {l.valor}
                  </dd>
                </div>
              ))}
          </dl>

          {/* El reparto del dinero */}
          <dl className="py-4 text-sm">
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-tinta-suave">{t("comision")}</dt>
              <dd className="font-medium tabular-nums">
                {formatearPrecio(pago.comisionCentavos, idioma, pago.moneda)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2.5 pb-1.5">
              <dt className="font-bold">{t("neto")}</dt>
              <dd className="text-lg font-extrabold tabular-nums">
                {formatearPrecio(pago.netoCentavos, idioma, pago.moneda)}
              </dd>
            </div>
          </dl>

          {/* Pie: el corte del papel */}
          <div className="border-t border-dashed border-slate-300 pt-4 text-center">
            <p className="text-[11px] leading-relaxed text-tinta-suave">
              {t("pie")}
            </p>
            <p className="mt-1 text-[11px] text-tinta-suave">{ZONA}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
