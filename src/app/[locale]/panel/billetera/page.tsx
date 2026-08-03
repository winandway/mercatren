import { Wallet } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import { listarMovimientos, obtenerBilletera } from "@/lib/zelle/consultas";

export const dynamic = "force-dynamic";

/**
 * Billetera del comercio: lo que Mercatren le debe por los pagos ya validados.
 * Un vendedor ve la suya; el equipo ve la del comercio que este mirando.
 */
export default async function PaginaBilletera({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ comercio?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const { comercio } = await searchParams;
  const t = await getTranslations("panel.billetera");

  const [billetera, movimientos] = await Promise.all([
    obtenerBilletera(comercio),
    listarMovimientos(comercio),
  ]);

  if (!billetera) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {t("sinBilletera")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-riel-900 p-5 text-white shadow-sm sm:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-white/70">{t("saldo")}</p>
              <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
                {formatearPrecio(
                  billetera.saldoCentavos,
                  idioma,
                  billetera.moneda,
                )}
              </p>
              <p className="mt-1 text-sm text-white/70">
                {billetera.nombreTienda}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-carga-400">
              <Wallet className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-tinta-suave">{t("proveedor")}</p>
          <p className="mt-1 text-lg font-bold capitalize">
            {billetera.proveedor}
          </p>
          <p className="mt-2 text-xs text-tinta-suave">
            {t("pendienteConexion", { proveedor: billetera.proveedor })}
          </p>
        </article>
      </section>

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-tinta-suave">
        {t("avisoHistorico")}
      </p>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">
          {t("movimientos")}
        </h2>

        {movimientos.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-tinta-suave">
            {t("sinMovimientos")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-tinta-suave">
                  <th className="px-4 py-2 font-medium">
                    {t("columnas.fecha")}
                  </th>
                  <th className="px-4 py-2 font-medium">
                    {t("columnas.concepto")}
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    {t("columnas.monto")}
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    {t("columnas.saldo")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {fechaHora(m.creadoEn, idioma)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium">
                        {t(`tipos.${m.tipo}`)}
                      </span>
                      {m.nota ? (
                        <span className="block text-xs text-tinta-suave">
                          {m.nota}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right font-semibold tabular-nums",
                        m.montoCentavos >= 0
                          ? "text-emerald-700"
                          : "text-red-700",
                      )}
                    >
                      {m.montoCentavos >= 0 ? "+" : ""}
                      {formatearPrecio(m.montoCentavos, idioma)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatearPrecio(m.saldoResultanteCentavos, idioma)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
