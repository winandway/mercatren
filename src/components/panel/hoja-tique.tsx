"use client";

import { useLocale, useTranslations } from "next-intl";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora, fechaLarga, ZONA } from "@/lib/fechas";
import type { PagoVista } from "@/lib/zelle/vista";

/**
 * La HOJA del tique: solo el contenido, sin ventana ni botones.
 *
 * Vive aparte porque se usa en dos sitios y tiene que verse idéntica en los
 * dos: en Órdenes, como tique que se abre y se imprime, y al costado del
 * comprobante, junto a la captura del banco. Si fueran dos copias, una se
 * quedaría vieja en cuanto se toque la otra.
 */
export function HojaTique({
  pago,
  comercio,
}: {
  pago: PagoVista;
  comercio: string | null;
}) {
  const t = useTranslations("panel.tique");
  const idioma = useLocale() as Idioma;

  // Lo que no se sabe no se inventa: la fila entera desaparece.
  const lineas: { etiqueta: string; valor: string | null }[] = [
    {
      etiqueta: t("fecha"),
      valor: pago.fechaTransaccion
        ? fechaLarga(pago.fechaTransaccion, idioma)
        : null,
    },
    { etiqueta: t("confirmacion"), valor: pago.codigoConfirmacion },
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
            <div key={l.etiqueta} className="flex justify-between gap-4 py-1.5">
              <dt className="shrink-0 text-tinta-suave">{l.etiqueta}</dt>
              <dd className="text-right font-medium break-words">{l.valor}</dd>
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
  );
}
