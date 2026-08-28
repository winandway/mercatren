"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  COMISION_TARJETA_PB,
  formatearPrecio,
  PROCESADOR_FIJO_CENTAVOS,
  PROCESADOR_PORCENTAJE_PB,
  precioConAjusteCentavos,
  type Idioma,
} from "@/lib/dinero";

/**
 * LA CALCULADORA DEL PRECIO, con todo desglosado.
 *
 * La pidió el dueño el 5 ago 2026: «no se cobra esto a lo loco, tres por
 * ciento así, no; se tiene que desglosar». Tenía razón — donde antes decía
 * "Margen por venta: 3 % sobre el valor del pedido" había un texto suelto,
 * heredado del modelo viejo, que no salía de ningún cálculo.
 *
 * Y ADEMÁS ENSEÑA POR QUÉ NO SE SUMAN LOS PORCENTAJES. Sumar hacia adelante
 * —base + 2% + 2.9% + $0.30— deja SIEMPRE corto, porque el procesador cobra
 * su 2.9% sobre el precio FINAL, no sobre la base. En $10 la diferencia son
 * cuatro centavos; en un pedido de $2.000, ocho dólares. La calculadora
 * enseña las dos cuentas una al lado de la otra para que se vea.
 *
 * Los números salen de las mismas constantes que usa el catálogo, así que si
 * mañana Stripe cambia su tarifa o el margen sube, esta pantalla cambia sola.
 * Nada escrito a mano.
 */
export function CalculadoraPrecio() {
  const t = useTranslations("panel.configuracion.calculadora");
  const idioma = useLocale() as Idioma;
  const [texto, setTexto] = useState("10.00");

  const base = Math.round(Number(texto.replace(",", ".")) * 100);
  const valida = Number.isFinite(base) && base > 0;

  const publicado = valida ? precioConAjusteCentavos(base) : 0;
  const procesador = valida
    ? Math.round((publicado * PROCESADOR_PORCENTAJE_PB) / 10_000) +
      PROCESADOR_FIJO_CENTAVOS
    : 0;
  const margen = valida
    ? Math.round((publicado * COMISION_TARJETA_PB) / 10_000)
    : 0;
  const alProveedor = publicado - procesador - margen;

  /* La cuenta INGENUA, la que uno haría de cabeza: sumar los porcentajes
     sobre la base. Se enseña al lado para que se vea cuánto deja corto. */
  const ingenuo = valida
    ? base +
      Math.round((base * COMISION_TARJETA_PB) / 10_000) +
      Math.round((base * PROCESADOR_PORCENTAJE_PB) / 10_000) +
      PROCESADOR_FIJO_CENTAVOS
    : 0;
  const ingenuoProcesador = valida
    ? Math.round((ingenuo * PROCESADOR_PORCENTAJE_PB) / 10_000) +
      PROCESADOR_FIJO_CENTAVOS
    : 0;
  const ingenuoMargen = valida
    ? Math.round((ingenuo * COMISION_TARJETA_PB) / 10_000)
    : 0;
  const ingenuoAlProveedor = ingenuo - ingenuoProcesador - ingenuoMargen;
  const faltante = base - ingenuoAlProveedor;

  const pct = (pb: number) => (pb / 100).toFixed(pb % 100 === 0 ? 0 : 1);

  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium">{t("etiqueta")}</span>
        <span className="mt-1.5 flex max-w-xs items-center gap-2 rounded-lg border border-borde bg-white px-3 py-2 focus-within:border-carga-500 focus-within:ring-2 focus-within:ring-carga-500/30">
          <span className="text-tinta-suave">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full bg-transparent tabular-nums outline-none"
          />
        </span>
      </label>

      {valida ? (
        <>
          <dl className="mt-4 max-w-lg text-sm">
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-tinta-suave">{t("base")}</dt>
              <dd className="tabular-nums">
                {formatearPrecio(base, idioma, "USD")}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-tinta-suave">
                {t("procesador", {
                  pct: pct(PROCESADOR_PORCENTAJE_PB),
                  fijo: formatearPrecio(
                    PROCESADOR_FIJO_CENTAVOS,
                    idioma,
                    "USD",
                  ),
                })}
              </dt>
              <dd className="tabular-nums">
                {formatearPrecio(procesador, idioma, "USD")}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-tinta-suave">
                {t("margen", { pct: pct(COMISION_TARJETA_PB) })}
              </dt>
              <dd className="tabular-nums">
                {formatearPrecio(margen, idioma, "USD")}
              </dd>
            </div>

            <div className="mt-2 flex justify-between gap-4 border-t border-borde pt-3">
              <dt className="font-bold">{t("publicado")}</dt>
              <dd className="text-lg font-extrabold tabular-nums">
                {formatearPrecio(publicado, idioma, "USD")}
              </dd>
            </div>

            {/* LA COMPROBACIÓN. Es la línea que importa: el proveedor tiene
                que cobrar su precio COMPLETO, nunca un centavo menos. */}
            <div className="mt-2 flex justify-between gap-4 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
              <dt className="font-semibold">{t("alProveedor")}</dt>
              <dd className="font-bold tabular-nums">
                {formatearPrecio(alProveedor, idioma, "USD")}
              </dd>
            </div>
          </dl>

          {/* POR QUÉ NO SE SUMAN LOS PORCENTAJES. */}
          <div className="mt-5 max-w-lg rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">{t("ojoTitulo")}</p>
            <p className="mt-1 leading-relaxed">
              {t("ojoTexto", {
                sumado: formatearPrecio(ingenuo, idioma, "USD"),
                queda: formatearPrecio(ingenuoAlProveedor, idioma, "USD"),
                falta: formatearPrecio(Math.max(0, faltante), idioma, "USD"),
                correcto: formatearPrecio(publicado, idioma, "USD"),
              })}
            </p>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-tinta-suave">{t("escribeUnMonto")}</p>
      )}
    </div>
  );
}
