import { CircleCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { CorrerVigilante } from "@/components/panel/vigilante/correr";
import { EmpujonesDelTablero } from "@/components/panel/vigilante/empujones";
import { HistorialDeErrores } from "@/components/panel/vigilante/errores";
import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { historialDeErrores } from "@/lib/errores/registro";
import { ultimosLatidos } from "@/lib/vigilante/correr";
import {
  inventarioPorPlaza,
  inventarioPorTienda,
} from "@/lib/vigilante/inventario";
import {
  minutosDesde,
  nombreDePlaza,
  relojAhoraMs,
} from "@/lib/vigilante/reglas";

export const dynamic = "force-dynamic";

/**
 * EL VIGILANTE, EN PANTALLA: la última corrida, qué alertó, qué hizo solo,
 * qué midió, y el historial. Es a lo que el dueño «le puede preguntar».
 */
export default async function PaginaVigilante({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await esSoporteDeVerdad())) redirect(`/${locale}/panel`);

  const t = await getTranslations("panel.vigilante");
  const [latidos, plazas, tiendasDeComercios, errores] = await Promise.all([
    ultimosLatidos(12),
    inventarioPorPlaza(),
    inventarioPorTienda(),
    historialDeErrores(30),
  ]);
  const ti = await getTranslations("panel.vigilante.inventario");
  const ultimo = latidos[0] ?? null;
  const ahoraMs = relojAhoraMs();
  const fecha = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="h-6 w-6 text-carga-500" aria-hidden />
            {t("titulo")}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
            {t("texto")}
          </p>
        </div>
        <CorrerVigilante />
      </header>

      <EmpujonesDelTablero />

      {/* LA CONTABILIDAD DE CADA PLAZA. Lo pidió el dueño: «yo no sé cuántos
          productos tenemos en Chile, en Colombia, en Estados Unidos, cuántos
          están traducidos, cuántos tienen el envío resuelto». */}
      <section className="rounded-xl border border-borde bg-white p-4">
        <h2 className="text-sm font-semibold">{ti("titulo")}</h2>
        <p className="mt-1 text-xs text-tinta-suave">{ti("texto")}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="text-xs text-tinta-suave">
              <tr>
                <th className="py-1 pr-3">{ti("plaza")}</th>
                <th className="py-1 pr-3">{ti("aLaVenta")}</th>
                <th className="py-1 pr-3">{ti("enRevision")}</th>
                <th className="py-1 pr-3">{ti("borradores")}</th>
                <th className="py-1 pr-3">{ti("agotados")}</th>
                <th className="py-1 pr-3">{ti("fleteReal")}</th>
                <th className="py-1 pr-3">{ti("fleteEstimado")}</th>
                <th className="py-1 pr-3">{ti("sinFlete")}</th>
                <th className="py-1 pr-3">{ti("sinTraducir")}</th>
                <th className="py-1 pr-3">{ti("sinDescripcion")}</th>
                <th className="py-1">{ti("fotosDeOrigen")}</th>
              </tr>
            </thead>
            <tbody>
              {plazas.map((p) => (
                <tr key={p.mercado} className="border-t border-borde">
                  <td className="py-1.5 pr-3 font-semibold">
                    {nombreDePlaza(p.mercado)}
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">{p.publicados}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{p.enRevision}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{p.borradores}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{p.agotados}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{p.conFleteReal}</td>
                  <td className="py-1.5 pr-3 tabular-nums">
                    {p.conFleteEstimado}
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">{p.sinFlete}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{p.sinTraducir}</td>
                  <td className="py-1.5 pr-3 tabular-nums">
                    {p.sinDescripcion}
                  </td>
                  <td className="py-1.5 tabular-nums">{p.fotosDeOrigen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 text-sm font-semibold">{ti("tiendas")}</h3>
        {tiendasDeComercios.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">{ti("sinTiendas")}</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="text-xs text-tinta-suave">
                <tr>
                  <th className="py-1 pr-3">{ti("tienda")}</th>
                  <th className="py-1 pr-3">{ti("pais")}</th>
                  <th className="py-1 pr-3">{ti("estado")}</th>
                  <th className="py-1 pr-3">{ti("aLaVenta")}</th>
                  <th className="py-1 pr-3">{ti("borradores")}</th>
                  <th className="py-1 pr-3">{ti("agotados")}</th>
                  <th className="py-1 pr-3">{ti("sinFoto")}</th>
                  <th className="py-1">{ti("sincronizado")}</th>
                </tr>
              </thead>
              <tbody>
                {tiendasDeComercios.map((c) => (
                  <tr key={c.id} className="border-t border-borde">
                    <td className="py-1.5 pr-3 font-semibold">{c.nombre}</td>
                    <td className="py-1.5 pr-3">{c.pais ?? "—"}</td>
                    <td className="py-1.5 pr-3">{c.estado}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{c.publicados}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{c.borradores}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{c.agotados}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{c.sinFoto}</td>
                    <td className="py-1.5">
                      {c.sincronizadoEnMs
                        ? fecha.format(c.sincronizadoEnMs)
                        : ti("nunca")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <HistorialDeErrores errores={errores} ahoraMs={ahoraMs} />

      {!ultimo ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {t("nuncaCorrio")}
        </p>
      ) : (
        <>
          <p className="text-sm text-tinta-suave">
            {t("ultimaCorrida", {
              hace: minutosDesde(ultimo.corridoEnMs, ahoraMs) ?? 0,
              origen:
                ultimo.origen === "panel" ? t("origenPanel") : t("origenReloj"),
              segundos: Math.round(ultimo.duracionMs / 1000),
            })}
          </p>

          <section className="rounded-xl border border-borde bg-white p-4">
            <h2 className="text-base font-semibold">{t("alertas")}</h2>
            {ultimo.alertas.length === 0 ? (
              <p className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                <CircleCheck className="h-4 w-4" aria-hidden />
                {t("sinAlertas")}
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {ultimo.alertas.map((a) => (
                  <li
                    key={a.clave}
                    className={
                      a.nivel === "rojo"
                        ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
                        : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    }
                  >
                    <p className="flex items-start gap-2 font-semibold">
                      <TriangleAlert
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      {a.titulo}
                    </p>
                    <p className="mt-1 text-xs">{a.detalle}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-borde bg-white p-4">
            <h2 className="text-base font-semibold">{t("acciones")}</h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {ultimo.acciones.map((x) => (
                <li
                  key={x.clave}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <p className="text-2xl font-bold tabular-nums">
                    {x.cantidad}
                  </p>
                  <p className="text-xs text-tinta-suave">{x.titulo}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-borde bg-white p-4">
            <h2 className="text-base font-semibold">{t("hechos")}</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-tinta-suave">
                  <tr>
                    <th className="py-1 pr-3">{t("plaza")}</th>
                    <th className="py-1 pr-3">{t("publicados")}</th>
                    <th className="py-1 pr-3">{t("enRevision")}</th>
                    <th className="py-1 pr-3">{t("porAfinar")}</th>
                    <th className="py-1 pr-3">{t("sinCostoBase")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(ultimo.hechos.plazas ?? []).map((p) => (
                    <tr
                      key={p.mercado}
                      className="border-t border-borde tabular-nums"
                    >
                      <td className="py-1 pr-3 font-semibold">
                        {nombreDePlaza(p.mercado)}
                      </td>
                      <td className="py-1 pr-3">{p.publicados}</td>
                      <td className="py-1 pr-3">{p.enRevision}</td>
                      <td className="py-1 pr-3">{p.porAfinar}</td>
                      <td className="py-1 pr-3">{p.sinCostoBase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
              {[
                [
                  t("reloj"),
                  ultimo.hechos.latidoSincronizarMs
                    ? t("haceMin", {
                        min:
                          minutosDesde(
                            ultimo.hechos.latidoSincronizarMs,
                            ultimo.corridoEnMs,
                          ) ?? 0,
                      })
                    : t("nunca"),
                ],
                [t("proveedor"), ultimo.hechos.proveedor],
                [t("avisoStripe"), ultimo.hechos.avisoStripe],
                [
                  t("importaciones"),
                  String((ultimo.hechos.importaciones ?? []).length),
                ],
                [
                  t("comprasConError"),
                  String(ultimo.hechos.comprasConError ?? 0),
                ],
                [
                  t("comprasPorPagar"),
                  String(ultimo.hechos.comprasPorPagarViejas ?? 0),
                ],
                [
                  t("ventasSinCompra"),
                  String(ultimo.hechos.ventasSinCompra ?? 0),
                ],
                [
                  t("zellePendientes"),
                  String(ultimo.hechos.zellePendientesViejos ?? 0),
                ],
                [
                  t("retirosSinPagar"),
                  String(ultimo.hechos.retirosSinPagarViejos ?? 0),
                ],
                [
                  t("fuentesAtrasadas"),
                  String((ultimo.hechos.fuentesAtrasadas ?? []).length),
                ],
                [t("sinTraducir"), String(ultimo.hechos.sinTraducir ?? 0)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-tinta-suave">{k}</dt>
                  <dd className="font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            {(ultimo.hechos.importaciones ?? []).map((i) => (
              <p key={i.id} className="mt-2 text-xs text-tinta-suave">
                {t("importacionLinea", {
                  plaza: nombreDePlaza(i.mercado),
                  estado: i.estado,
                  agregados: i.agregados,
                  pendientes: i.tandasPendientes,
                  conError: i.tandasConError,
                })}
              </p>
            ))}
          </section>

          <section className="rounded-xl border border-borde bg-white p-4">
            <h2 className="text-base font-semibold">{t("historial")}</h2>
            <ul className="mt-2 divide-y divide-borde text-sm">
              {latidos.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-1.5"
                >
                  <span className="tabular-nums">
                    {fecha.format(new Date(l.corridoEnMs))}
                  </span>
                  <span className="text-xs text-tinta-suave">
                    {l.origen === "panel" ? t("origenPanel") : t("origenReloj")}
                  </span>
                  <span
                    className={
                      l.alertas.some((a) => a.nivel === "rojo")
                        ? "text-red-700"
                        : l.alertas.length
                          ? "text-amber-700"
                          : "text-emerald-700"
                    }
                  >
                    {t("alertasN", { n: l.alertas.length })}
                  </span>
                  <span className="text-xs text-tinta-suave">
                    {t("accionesN", {
                      n: l.acciones.reduce((s, a) => s + a.cantidad, 0),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
