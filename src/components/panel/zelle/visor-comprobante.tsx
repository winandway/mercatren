"use client";

import { Printer, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { HojaTique } from "@/components/panel/hoja-tique";
import type { LineaDeVenta } from "@/lib/zelle/lineas";
import { type Idioma } from "@/lib/dinero";
import { fechaHora, soloHora } from "@/lib/fechas";
import type { PagoVista } from "@/lib/zelle/vista";

/**
 * Visor del comprobante. Se abre DENTRO de la aplicacion: nunca manda al
 * usuario a otra pestana. Muestra la captura junto a los datos del pago.
 */
export function VisorComprobante({
  pago,
  comercio,
  onCerrar,
  lineas = [],
}: {
  pago: PagoVista;
  comercio?: string | null;
  onCerrar: () => void;
  /** Qué mercancía se vendió, para que el comprobante la identifique. */
  lineas?: LineaDeVenta[];
}) {
  const t = useTranslations("panel.zelle");
  const tt = useTranslations("panel.tique");
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

  /**
   * Lo que NO va en el tique pero sí hace falta para validar: cuándo se subió
   * la captura, quién la subió y, si se rechazó, por qué. Un comprobante que
   * se imprime para el cliente no lleva eso.
   */
  const extras = (
    [
      {
        etiqueta: t("pago.subido"),
        valor: pago.subidoEn
          ? `${fechaHora(pago.subidoEn, idioma)} · ${soloHora(pago.subidoEn, idioma)}`
          : null,
      },
      { etiqueta: t("visor.quienSubio"), valor: pago.sellerCuenta },
      { etiqueta: t("pago.nota"), valor: pago.notas },
      { etiqueta: t("pago.motivoRechazo"), valor: pago.motivoRechazo },
    ] as { etiqueta: string; valor: string | null }[]
  ).filter((d) => d.valor);

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

        {/**
         * EL COSTADO ES EL TIQUE.
         *
         * Antes era una lista de datos sueltos; ahora es el mismo comprobante
         * imprimible que sale en Órdenes, al lado de la captura del banco. Es
         * la misma pieza (`HojaTique`), no una copia: si se toca una, se toca
         * la otra.
         */}
        <div className="hoja-tique w-full shrink-0 overflow-y-auto border-t border-slate-200 bg-white sm:max-h-[80vh] sm:w-80 sm:border-t-0 sm:border-l">
          <div className="flex justify-end p-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-tinta-suave transition-colors hover:bg-slate-100 hover:text-tinta"
            >
              <Printer className="h-4 w-4" aria-hidden />
              {tt("imprimir")}
            </button>
          </div>

          <HojaTique pago={pago} comercio={comercio ?? null} lineas={lineas} />

          {/* Lo que solo importa al validar, fuera del tique. */}
          {extras.length > 0 ? (
            <dl className="space-y-3 border-t border-slate-200 px-6 py-4 sm:px-8">
              {extras.map((d) => (
                <div key={d.etiqueta}>
                  <dt className="text-[11px] tracking-wide text-tinta-suave uppercase">
                    {d.etiqueta}
                  </dt>
                  <dd className="text-sm font-medium break-words">{d.valor}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}
