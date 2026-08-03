"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { titularPeriodo } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import type { FilaCierre, Periodo } from "@/lib/zelle/consultas";

const PERIODOS: { clave: Periodo; etiqueta: string }[] = [
  { clave: "dia", etiqueta: "porDia" },
  { clave: "semana", etiqueta: "porSemana" },
  { clave: "mes", etiqueta: "porMes" },
];

const VISIBLES = 6;

/**
 * Cierre de ventas por periodo, en orden cronologico.
 * Solo entra lo aprobado; los retiros no aparecen aqui nunca.
 */
export function CierreVentas({
  cierres,
}: {
  cierres: Record<Periodo, FilaCierre[]>;
}) {
  const t = useTranslations("panel.zelle.cierre");
  const idioma = useLocale() as Idioma;
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [todo, setTodo] = useState(false);

  const filas = cierres[periodo] ?? [];
  const mostradas = todo ? filas : filas.slice(-VISIBLES);

  const total = filas.reduce(
    (a, f) => ({
      pagos: a.pagos + f.pagos,
      monto: a.monto + f.montoCentavos,
      comision: a.comision + f.comisionCentavos,
      neto: a.neto + f.netoCentavos,
    }),
    { pagos: 0, monto: 0, comision: 0, neto: 0 },
  );

  const mayor = Math.max(1, ...filas.map((f) => f.montoCentavos));

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold">{t("titulo")}</h2>
          <p className="text-xs text-tinta-suave">{t("soloEntradas")}</p>
        </div>

        <div
          role="tablist"
          aria-label={t("titulo")}
          className="flex rounded-lg bg-slate-100 p-0.5"
        >
          {PERIODOS.map((p) => (
            <button
              key={p.clave}
              role="tab"
              type="button"
              aria-selected={periodo === p.clave}
              onClick={() => {
                setPeriodo(p.clave);
                setTodo(false);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                periodo === p.clave
                  ? "bg-white text-tinta shadow-sm"
                  : "text-tinta-suave hover:text-tinta",
              )}
            >
              {t(p.etiqueta)}
            </button>
          ))}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-tinta-suave">
              <th className="px-4 py-2 font-medium">{t("periodo")}</th>
              <th className="px-4 py-2 text-right font-medium">{t("pagos")}</th>
              <th className="px-4 py-2 text-right font-medium">{t("monto")}</th>
              <th className="px-4 py-2 text-right font-medium">
                {t("comision")}
              </th>
              <th className="px-4 py-2 text-right font-medium">{t("neto")}</th>
            </tr>
          </thead>
          <tbody>
            {mostradas.map((f) => (
              <tr key={f.periodo} className="border-t border-slate-100">
                <td className="px-4 py-2.5">
                  <span className="font-medium">
                    {titularPeriodo(f.periodo, idioma)}
                  </span>
                  <span
                    aria-hidden
                    className="mt-1 block h-1 rounded-full bg-carga-500/70"
                    style={{
                      width: `${Math.max(4, (f.montoCentavos / mayor) * 100)}%`,
                    }}
                  />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {f.pagos}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                  {formatearPrecio(f.montoCentavos, idioma)}
                </td>
                <td className="px-4 py-2.5 text-right text-tinta-suave tabular-nums">
                  {formatearPrecio(f.comisionCentavos, idioma)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatearPrecio(f.netoCentavos, idioma)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
              <td className="px-4 py-2.5">{t("total")}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {total.pagos}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatearPrecio(total.monto, idioma)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatearPrecio(total.comision, idioma)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatearPrecio(total.neto, idioma)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {filas.length > VISIBLES ? (
        <div className="border-t border-slate-100 px-4 py-2 text-center">
          <button
            type="button"
            onClick={() => setTodo((v) => !v)}
            className="text-xs font-semibold text-riel-700 hover:text-carga-600"
          >
            {todo ? t("verMenos") : t("verTodo")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
