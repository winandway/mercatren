import { getTranslations, setRequestLocale } from "next-intl/server";

import { esEquipoInterno } from "@/lib/autorizacion";
import { listarCasilleros, resumenCasillero } from "@/lib/casillero/panel";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * ══ EL CASILLERO EN EL PANEL DEL EQUIPO ══
 *
 * Se integra al panel que ya existe, con su sesión y sus roles: un panel
 * aparte sería otra contraseña y otra puerta que vigilar.
 *
 * Solo el equipo interno. Un comercio no tiene nada que hacer viendo los
 * casilleros de los compradores.
 */
export default async function PaginaCasilleros({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await esEquipoInterno())) notFound();
  const t = await getTranslations("panel.casilleros");

  const { q } = await searchParams;
  const [resumen, lista] = await Promise.all([
    resumenCasillero(),
    listarCasilleros(q),
  ]);

  const tarjetas = resumen
    ? [
        { titulo: t("hoy"), valor: resumen.altas.hoy },
        { titulo: t("semana"), valor: resumen.altas.semana },
        { titulo: t("mes"), valor: resumen.altas.mes },
        { titulo: t("total"), valor: resumen.altas.total },
      ]
    : [];

  const salud = resumen
    ? [
        { titulo: t("enBodega"), valor: resumen.enBodega },
        {
          titulo: t("huerfanos"),
          valor: resumen.huerfanos,
          alerta: resumen.huerfanos > 0,
        },
        {
          titulo: t("sinDeclarar"),
          valor: resumen.sinDeclarar,
          alerta: resumen.sinDeclarar > 0,
        },
        { titulo: t("sinVerificar"), valor: resumen.sinVerificar },
      ]
    : [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">{t("titulo")}</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Paquetería de Estados Unidos a Sudamérica. La bodega la opera BESTWAY
          GROUP INTL. CORP. en Miami.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-tinta-suave uppercase">
          {t("creados")}
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tarjetas.map((t) => (
            <div
              key={t.titulo}
              className="rounded-xl border border-borde bg-white p-4"
            >
              <dt className="text-xs text-tinta-suave">{t.titulo}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">
                {t.valor}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* DE DÓNDE VIENEN. Es la pregunta que el dueño hace todos los días,
          así que va con nombre propio y no escondida en una tabla. */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-borde bg-white p-5">
          <h2 className="font-bold">{t("deDondeVienen")}</h2>
          {resumen && resumen.porOrigen.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {resumen.porOrigen.map((o) => (
                <li key={o.nombre} className="flex justify-between gap-3">
                  <span>{o.nombre}</span>
                  <span className="font-semibold tabular-nums">
                    {o.cuantos}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-tinta-suave">{t("sinAltas")}</p>
          )}
        </div>

        <div className="rounded-xl border border-borde bg-white p-5">
          <h2 className="font-bold">{t("porPais")}</h2>
          {resumen && resumen.porPais.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {resumen.porPais.map((p) => (
                <li key={p.pais} className="flex justify-between gap-3">
                  <span>{p.pais}</span>
                  <span className="font-semibold tabular-nums">
                    {p.cuantos}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-tinta-suave">{t("sinAltas")}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-tinta-suave uppercase">
          {t("salud")}
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {salud.map((t) => (
            <div
              key={t.titulo}
              className={`rounded-xl border bg-white p-4 ${
                t.alerta ? "border-carga-500/60" : "border-borde"
              }`}
            >
              <dt className="text-xs text-tinta-suave">{t.titulo}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums">
                {t.valor}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">{t("titulo")}</h2>
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder={t("buscarPlaceholder")}
              className="rounded-lg border border-borde px-3 py-1.5 text-sm"
            />
            <button className="rounded-lg border border-borde px-3 py-1.5 text-sm font-semibold">
              {t("buscar")}
            </button>
          </form>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-tinta-suave">
              <tr>
                <th className="py-1 pr-3">{t("colCodigo")}</th>
                <th className="py-1 pr-3">{t("colNombre")}</th>
                <th className="py-1 pr-3">{t("colCorreo")}</th>
                <th className="py-1 pr-3">{t("colTelefono")}</th>
                <th className="py-1 pr-3">{t("colPais")}</th>
                <th className="py-1 pr-3">{t("colOrigen")}</th>
                <th className="py-1 pr-3">{t("colEstado")}</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-t border-borde">
                  <td className="py-1.5 pr-3 font-mono font-semibold">
                    {c.codigo}
                  </td>
                  <td className="py-1.5 pr-3">{c.nombreLegal}</td>
                  {/* Enmascarados: ver el dato completo es una acción aparte
                      que queda registrada. */}
                  <td className="py-1.5 pr-3 text-tinta-suave">{c.correo}</td>
                  <td className="py-1.5 pr-3 text-tinta-suave">{c.telefono}</td>
                  <td className="py-1.5 pr-3">{c.paisDestino}</td>
                  <td className="py-1.5 pr-3">{c.origen ?? "Mercatren"}</td>
                  <td className="py-1.5 pr-3">
                    {c.verificado ? t("verificado") : t("sinVerificarUno")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 ? (
            <p className="mt-3 text-sm text-tinta-suave">
              {t("sinCasilleros")}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
