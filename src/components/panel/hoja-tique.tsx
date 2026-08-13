"use client";

import { useLocale, useTranslations } from "next-intl";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora, fechaLarga, ZONA } from "@/lib/fechas";
import type { LineaDeVenta } from "@/lib/zelle/lineas";
import type { PagoVista } from "@/lib/zelle/vista";

/**
 * La HOJA del tique: solo el contenido, sin ventana ni botones.
 *
 * Vive aparte porque se usa en dos sitios y tiene que verse idéntica en los
 * dos: en Órdenes, como tique que se abre y se imprime, y al costado del
 * comprobante, junto a la captura del banco. Si fueran dos copias, una se
 * quedaría vieja en cuanto se toque la otra.
 *
 * ESTE COMPROBANTE ES INTERNO Y NO ES LA FACTURA DEL CLIENTE.
 *
 * Lleva el margen de Mercatren y el costo de la mercancía, que son números
 * nuestros. La factura de venta que recibe el comprador es otro documento y
 * NUNCA lleva esas dos líneas: el cliente paga un precio y ese precio es todo
 * lo que le corresponde ver. El dueño lo preguntó el 5 ago 2026 —"¿este tique
 * es para nosotros o lo ve el cliente?"— y la respuesta tiene que estar
 * escrita en el propio papel, no en la cabeza de quien lo imprime.
 *
 * Por eso arriba dice USO INTERNO y abajo se repite. Un papel que sale de una
 * impresora acaba en cualquier escritorio.
 */
export function HojaTique({
  pago,
  comercio,
  lineas = [],
}: {
  pago: PagoVista;
  comercio: string | null;
  /** Qué se vendió y de qué depósito salió. Vacío en el histórico importado. */
  lineas?: LineaDeVenta[];
}) {
  const t = useTranslations("panel.tique");
  const idioma = useLocale() as Idioma;

  // Lo que no se sabe no se inventa: la fila entera desaparece.
  const datos: { etiqueta: string; valor: string | null }[] = [
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
        <p className="mt-2 text-[12px] tracking-wider text-tinta-suave uppercase">
          {t("titulo")}
        </p>
        {/* QUE SE LEA EN EL PAPEL, no solo en la pantalla. Un comprobante
            impreso acaba en cualquier escritorio y lleva nuestro margen. */}
        <p className="mt-1.5 inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold tracking-wider text-amber-900 uppercase">
          {t("usoInterno")}
        </p>
      </div>

      {/* El monto, que es lo que se mira primero */}
      <div className="border-b border-dashed border-slate-300 py-5 text-center">
        <p className="text-4xl font-extrabold tracking-tight tabular-nums">
          {formatearPrecio(pago.montoCentavos, idioma, pago.moneda)}
        </p>
        <p className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[12px] font-bold text-emerald-900">
          {t("entregado")}
        </p>
      </div>

      {/* Los datos */}
      <dl className="border-b border-dashed border-slate-300 py-4 text-sm">
        {datos
          .filter((l) => l.valor)
          .map((l) => (
            <div key={l.etiqueta} className="flex justify-between gap-4 py-1.5">
              <dt className="shrink-0 text-tinta-suave">{l.etiqueta}</dt>
              <dd className="text-right font-medium break-words">{l.valor}</dd>
            </div>
          ))}
      </dl>

      {/* QUÉ MERCANCÍA SE VENDIÓ Y A QUIÉN SE LE COMPRÓ.
          Sin esto el comprobante decía que entraron $2.48 y nada más: no
          sustentaba ninguna compraventa, porque no identificaba la mercancía. */}
      <div className="border-b border-dashed border-slate-300 py-4">
        <p className="text-[12px] font-bold tracking-wider text-tinta-suave uppercase">
          {t("mercancia")}
        </p>

        {lineas.length > 0 ? (
          <ul className="mt-2 space-y-2.5">
            {lineas.map((linea, i) => (
              <li key={`${linea.titulo}-${i}`} className="text-sm">
                <div className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <span className="font-medium">{linea.titulo}</span>
                    {linea.cantidad > 1 ? (
                      <span className="text-tinta-suave">
                        {" "}
                        &times;{linea.cantidad}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatearPrecio(
                      linea.subtotalCentavos,
                      idioma,
                      pago.moneda,
                    )}
                  </span>
                </div>
                {/* A QUIÉN SE LE COMPRÓ. Es la parte que sustenta la figura:
                    hubo un proveedor concreto y un depósito concreto. */}
                {linea.proveedor || linea.deposito ? (
                  <p className="mt-0.5 text-[12px] text-tinta-suave">
                    {linea.proveedor ? (
                      <>
                        {t("compradaA")} {linea.proveedor}
                      </>
                    ) : null}
                    {linea.deposito ? (
                      <>
                        {linea.proveedor ? " · " : null}
                        {linea.deposito}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          /* El histórico importado no trae pedido: se dice, no se finge. */
          <p className="mt-2 text-sm text-tinta-suave">{t("sinDetalle")}</p>
        )}
      </div>

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
        <p className="text-[12px] leading-relaxed font-semibold text-tinta">
          {t("noEsFactura")}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-tinta-suave">
          {t("pie")}
        </p>
        <p className="mt-1 text-[12px] text-tinta-suave">{ZONA}</p>
      </div>
    </div>
  );
}
