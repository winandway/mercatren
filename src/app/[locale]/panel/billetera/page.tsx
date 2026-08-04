import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { esEquipoInterno } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import {
  listarMovimientosReales,
  obtenerBilleteraOperador,
  obtenerPosicion,
} from "@/lib/zelle/billetera";

export const dynamic = "force-dynamic";

/**
 * Billetera del comercio: lo que tiene a su favor y lo que ya se llevó.
 *
 * El saldo NO es un número guardado a mano: sale de restarle a lo que se le ha
 * acreditado todo lo que ya retiró. Ese dinero no está en una cuenta aparte —
 * está en la cuenta del banco, a su favor, esperando a que lo pida.
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
  const tr = await getTranslations("panel.retiros");

  const [posicion, movimientos, interno, operador] = await Promise.all([
    obtenerPosicion(comercio),
    listarMovimientosReales(comercio),
    esEquipoInterno(),
    obtenerBilleteraOperador().catch(() => null),
  ]);

  if (!posicion) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {t("sinBilletera")}
        </p>
      </div>
    );
  }

  const moneda = posicion.moneda;
  const dinero = (centavos: number) =>
    formatearPrecio(centavos, idioma, moneda);

  const delMes = [
    { clave: "bruto", valor: posicion.mes.brutoCentavos, tono: "" },
    {
      clave: "comision",
      valor: posicion.mes.comisionCentavos,
      tono: "text-precio-600",
    },
    {
      clave: "retirado",
      valor: posicion.mes.retiradoCentavos,
      tono: "text-red-700",
    },
    { clave: "rechazado", valor: posicion.mes.rechazadoCentavos, tono: "" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      {/* El saldo, que es lo que se viene a mirar. */}
      <section className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-riel-900 p-6 text-white shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-white/70 uppercase">
                {t("saldo")}
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                {dinero(posicion.saldoCentavos)}
              </p>
              <p className="mt-2 text-sm text-white/70">{t("saldoAyuda")}</p>
              <p className="mt-3 truncate text-sm font-semibold">
                {posicion.nombreTienda}
              </p>

              {/* Sacar el dinero tiene que estar donde se mira el saldo: es
                  lo primero que uno quiere hacer al verlo. */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/panel/retiros"
                  className="inline-flex items-center gap-2 rounded-lg bg-carga-500 px-4 py-2 text-sm font-semibold text-riel-950 transition-colors hover:bg-carga-400"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                  {tr("pedir")}
                </Link>

                {posicion.enTramiteCentavos > 0 ? (
                  <span className="text-sm text-white/70">
                    {tr("enTramite")}:{" "}
                    <b className="font-semibold text-white tabular-nums">
                      {dinero(posicion.enTramiteCentavos)}
                    </b>
                  </span>
                ) : null}
              </div>
            </div>
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-carga-400">
              <Wallet className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </article>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs text-tinta-suave">
              <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden />
              {t("acreditado")}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {dinero(posicion.netoHistoricoCentavos)}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-1.5 text-xs text-tinta-suave">
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              {t("yaRetirado")}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {dinero(posicion.retiradoCentavos)}
            </p>
            <p className="mt-0.5 text-xs text-tinta-suave">
              {t("cuantosRetiros", { n: posicion.retiros })}
            </p>
          </article>
        </div>
      </section>

      {/* El mes en curso. */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold">{t("esteMes")}</h2>

        {/* Un cero se lee mal si no se dice hasta dónde llegan los datos. */}
        {posicion.ultimoMovimiento ? (
          <p className="mt-1 text-xs text-tinta-suave">
            {t("datosHasta", {
              fecha: fechaCorta(posicion.ultimoMovimiento, idioma) ?? "—",
            })}
          </p>
        ) : null}

        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {delMes.map(({ clave, valor, tono }) => (
            <div key={clave} className="rounded-lg bg-slate-50 px-4 py-3">
              <dt className="text-xs text-tinta-suave">{t(`mes.${clave}`)}</dt>
              <dd className={cn("mt-0.5 text-lg font-bold tabular-nums", tono)}>
                {dinero(valor)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/**
       * LA CAJA DEL OPERADOR: la comisión de Mercatren.
       *
       * Es una billetera APARTE de la del comercio. Un retiro del comercio no
       * la toca, y un retiro de comisión no toca la de él. Solo la ve el
       * equipo: a un comercio no le corresponde saber cuánto lleva ganado
       * Mercatren.
       */}
      {interno && operador ? (
        <section className="rounded-xl border border-carga-500/30 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <PiggyBank className="h-4 w-4 text-carga-500" aria-hidden />
            {t("comision.titulo")}
          </h2>
          <p className="mt-1 text-sm text-tinta-suave">{t("comision.texto")}</p>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-carga-500/10 px-4 py-3">
              <dt className="text-xs text-tinta-suave">
                {t("comision.disponible")}
              </dt>
              <dd className="mt-0.5 text-2xl font-extrabold tabular-nums">
                {dinero(operador.disponibleCentavos)}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <dt className="text-xs text-tinta-suave">
                {t("comision.ganado")}
              </dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">
                {dinero(operador.ganadoCentavos)}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <dt className="text-xs text-tinta-suave">
                {t("comision.retirado")}
              </dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">
                {dinero(operador.retiradoCentavos)}
              </dd>
              <dd className="text-xs text-tinta-suave">
                {t("comision.cuantosRetiros", { n: operador.retiros.length })}
              </dd>
            </div>
          </dl>

          {operador.retiros.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-tinta-suave hover:text-tinta">
                {t("comision.verRetiros")}
              </summary>
              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {operador.retiros.map((r) => (
                  <li key={r.id} className="flex justify-between gap-4 py-2">
                    <span className="text-tinta-suave">
                      {fechaCorta(r.fecha, idioma)}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {dinero(r.montoCentavos)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-tinta-suave">
        {t("avisoHistorico")}
      </p>

      {/* El historial. */}
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
                      {m.fecha ? fechaCorta(m.fecha, idioma) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium">
                        {t(`tipos.${m.tipo}`)}
                      </span>
                      {m.concepto ? (
                        <span className="block truncate text-xs text-tinta-suave">
                          {m.concepto}
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
                      {dinero(m.montoCentavos)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {dinero(m.saldoResultanteCentavos)}
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
