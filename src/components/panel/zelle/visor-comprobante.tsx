"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora, fechaLarga, soloHora, ZONA } from "@/lib/fechas";
import type { PagoVista } from "@/lib/zelle/vista";

/**
 * Visor del comprobante. Se abre DENTRO de la aplicacion: nunca manda al
 * usuario a otra pestana. Muestra la captura junto a los datos del pago.
 */
export function VisorComprobante({
  pago,
  onCerrar,
}: {
  pago: PagoVista;
  onCerrar: () => void;
}) {
  const t = useTranslations("panel.zelle");
  const idioma = useLocale() as Idioma;
  const [falloImagen, setFalloImagen] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  // Cerrar con Escape y bloquear el desplazamiento del fondo.
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

  const datos: { etiqueta: string; valor: string | null }[] = [
    {
      etiqueta: t("pago.fechaPago"),
      valor: pago.fechaTransaccion
        ? fechaLarga(pago.fechaTransaccion, idioma)
        : null,
    },
    {
      etiqueta: t("pago.subido"),
      valor: pago.subidoEn
        ? `${fechaHora(pago.subidoEn, idioma)} · ${soloHora(pago.subidoEn, idioma)}`
        : null,
    },
    {
      etiqueta: t("pago.aprobado"),
      valor: pago.aprobadoEn ? fechaHora(pago.aprobadoEn, idioma) : null,
    },
    { etiqueta: t("pago.codigo"), valor: pago.codigoConfirmacion },
    {
      etiqueta: t("pago.banco"),
      valor:
        [
          pago.bancoOrigen,
          pago.cuentaUltimos4 ? `…${pago.cuentaUltimos4}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
    },
    { etiqueta: t("pago.recibio"), valor: pago.cuentaReceptora },
    {
      etiqueta: t("pago.comision"),
      valor: formatearPrecio(pago.comisionCentavos, idioma, pago.moneda),
    },
    {
      etiqueta: t("pago.neto"),
      valor: formatearPrecio(pago.netoCentavos, idioma, pago.moneda),
    },
    { etiqueta: t("visor.quienSubio"), valor: pago.sellerCuenta },
    { etiqueta: t("pago.nota"), valor: pago.notas },
    { etiqueta: t("pago.motivoRechazo"), valor: pago.motivoRechazo },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("visor.titulo")}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
    >
      <button
        type="button"
        aria-label={t("visor.cerrar")}
        onClick={onCerrar}
        className="absolute inset-0 bg-riel-950/85 backdrop-blur-sm"
      />

      <div className="relative flex max-h-full w-full max-w-5xl animate-in flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-150 zoom-in-95 fade-in sm:flex-row">
        <button
          ref={cerrarRef}
          type="button"
          onClick={onCerrar}
          aria-label={t("visor.cerrar")}
          className="absolute top-3 right-3 z-10 rounded-full bg-riel-950/70 p-2 text-white transition-colors hover:bg-riel-950"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {/* La captura */}
        <div className="flex min-h-[240px] flex-1 items-center justify-center overflow-auto bg-riel-950 p-3">
          {pago.reciboUrl && !falloImagen ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pago.reciboUrl}
              alt={t("visor.titulo")}
              onError={() => setFalloImagen(true)}
              className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
            />
          ) : (
            <p className="px-6 py-16 text-center text-sm text-white/70">
              {pago.reciboUrl ? t("visor.imagenNoCarga") : t("pago.sinRecibo")}
            </p>
          )}
        </div>

        {/* Los datos */}
        <div className="w-full shrink-0 overflow-y-auto border-t border-slate-200 p-5 sm:max-h-[80vh] sm:w-80 sm:border-t-0 sm:border-l">
          <p className="text-xs font-medium text-tinta-suave">
            {t("visor.datos")}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {formatearPrecio(pago.montoCentavos, idioma, pago.moneda)}
          </p>
          <p className="mt-1 text-sm text-tinta-suave">
            {pago.pagadorNombre ?? t(`pagador.${pago.pagadorTipo}`)}
          </p>
          {pago.pagadorCorreo ? (
            <p className="text-sm break-all text-tinta-suave">
              {pago.pagadorCorreo}
            </p>
          ) : null}

          <dl className="mt-5 space-y-3">
            {datos
              .filter((d) => d.valor)
              .map((d) => (
                <div key={d.etiqueta}>
                  <dt className="text-[11px] tracking-wide text-tinta-suave uppercase">
                    {d.etiqueta}
                  </dt>
                  <dd className="text-sm font-medium break-words">{d.valor}</dd>
                </div>
              ))}
          </dl>

          <p className="mt-5 border-t border-slate-200 pt-3 text-[11px] text-tinta-suave">
            {ZONA}
          </p>
        </div>
      </div>
    </div>
  );
}
