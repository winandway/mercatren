import { Check, Crown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BotonesPlan } from "@/components/panel/ganar/botones-plan";
import { obtenerAlcance } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { estadisticasDeTienda } from "@/lib/ganar/estadisticas";
import { estadoDelPlan } from "@/lib/ganar/planes";
import { PRECIO_PRO_CENTAVOS } from "@/lib/ganar/reglas";

export const dynamic = "force-dynamic";

/**
 * EL PLAN PRO EN EL PANEL (5 nov 2026, Fase 4): lo mismo que en la app.
 * Qué incluye, el mes gratis y, con Pro, las estadísticas de 30 días (de las
 * ventas guardadas). NADA SE COBRA.
 */
export default async function PaginaPlan({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;
  const t = await getTranslations("panel.ganar");
  const dinero = (c: number) => formatearPrecio(c, idioma, "USD");

  const alcance = await obtenerAlcance();
  if (alcance.tipo !== "tienda") {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="text-sm text-tinta-suave">{t("soloComercio")}</p>
      </div>
    );
  }

  const plan = await estadoDelPlan(alcance.tiendaId);
  const e = plan.pro ? await estadisticasDeTienda(alcance.tiendaId) : null;
  const vista = plan.pro
    ? plan.cancelado
      ? "termina"
      : "pro"
    : plan.puedeProbar
      ? "ofrecer"
      : "terminado";
  const fecha = plan.hasta
    ? new Date(plan.hasta).toLocaleDateString(
        idioma === "es" ? "es-US" : "en-US",
        { month: "long", day: "numeric" },
      )
    : "";

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Crown className="h-6 w-6 text-carga-500" aria-hidden />
          {t("titulo")}
        </h1>
        <p className="mt-2 text-xl font-bold">
          {t("precio", { precio: dinero(PRECIO_PRO_CENTAVOS) })}
        </p>
        <p className="font-semibold text-emerald-700">{t("primerMesGratis")}</p>
        <p className="mt-3 text-sm">{t("resumen")}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {(["beneficio1", "beneficio2", "beneficio3"] as const).map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden
              />
              {t(b)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-tinta-suave">
          {t("publicados", {
            n: plan.publicados,
            tope: plan.tope.toLocaleString(idioma === "es" ? "es-US" : "en-US"),
          })}
        </p>
        <div className="mt-4">
          {vista === "pro" ? (
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
              {t(plan.enPrueba ? "mesGratisHasta" : "proHasta", { fecha })}
            </p>
          ) : null}
          {vista === "termina" ? (
            <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              {t("proTermina", { fecha })}
            </p>
          ) : null}
          {vista === "terminado" ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              {t("terminado")}
            </p>
          ) : (
            <BotonesPlan vista={vista} />
          )}
        </div>
      </section>

      {e ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">{t("estadisticas")}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [t("ventas"), dinero(e.ventasCentavos)],
              [t("paraTi"), dinero(e.paraTiCentavos)],
              [t("pedidos"), String(e.pedidos)],
              [t("unidades"), String(e.unidades)],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dd className="text-xl font-bold text-riel-900">{valor}</dd>
                <dt className="text-xs text-tinta-suave">{etiqueta}</dt>
              </div>
            ))}
          </dl>
          <h3 className="mt-6 text-sm font-bold">{t("masVendidos")}</h3>
          {e.masVendidos.length === 0 ? (
            <p className="mt-2 text-sm text-tinta-suave">{t("sinVentas")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {e.masVendidos.map((p, i) => (
                <li
                  key={`${p.productoId}-${i}`}
                  className="flex justify-between gap-4 py-2"
                >
                  <span className="truncate">{p.titulo}</span>
                  <span className="shrink-0 text-tinta-suave">
                    {p.unidades} · {dinero(p.ventasCentavos)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
