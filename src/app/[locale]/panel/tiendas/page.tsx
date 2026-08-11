import { ArrowRight, Wallet } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BotonVerComo } from "@/components/panel/ver-como";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { listarComercios } from "@/lib/zelle/consultas";

export const dynamic = "force-dynamic";

const ESTILO_ESTADO = {
  activa: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  borrador: "bg-slate-100 text-tinta-suave",
  // Se dio de alta solo y espera que Mercatren la revise.
  pendiente: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  suspendida: "bg-red-50 text-red-700 ring-1 ring-red-200",
} as const;

/**
 * Los comercios que usan Mercatren. Cada uno entra con su propia cuenta y solo
 * ve lo suyo; desde aqui el equipo puede mirar el de cada quien.
 */
export default async function PaginaComercios({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.comercios");
  /* Solo `soporte`, nunca `validador`: uno atiende comercios y el otro revisa
     comprobantes. El servidor lo vuelve a comprobar en la acción. */
  const esSoporte = (await obtenerUsuario())?.rol === "soporte";
  const comercios = await listarComercios();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      {comercios.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {t("vacio")}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {comercios.map((c) => (
            <li key={c.id}>
              <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{c.nombre}</h2>
                    <p className="text-xs text-tinta-suave">
                      {c.paisOrigen} · {(c.comisionPuntosBase / 100).toFixed(1)}
                      %
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${ESTILO_ESTADO[c.estado]}`}
                  >
                    {t(`estados.${c.estado}`)}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-tinta-suave">{t("columnas.pagos")}</dt>
                    <dd className="font-semibold tabular-nums">{c.pagos}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-tinta-suave">
                      {t("columnas.ingresos")}
                    </dt>
                    <dd className="font-semibold tabular-nums">
                      {formatearPrecio(c.ingresosCentavos, idioma)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-tinta-suave">{t("columnas.saldo")}</dt>
                    <dd className="inline-flex items-center gap-1 font-semibold tabular-nums">
                      <Wallet
                        className="h-3.5 w-3.5 text-tinta-suave"
                        aria-hidden
                      />
                      {formatearPrecio(c.saldoCentavos, idioma)}
                    </dd>
                  </div>
                </dl>

                {/* «Ver su panel»: para responderle cuando manda una captura
                    preguntando dónde se hace algo. Solo para Soporte. */}
                {esSoporte ? (
                  <div className="mt-4">
                    <BotonVerComo tiendaId={c.id} nombre={c.nombre} />
                  </div>
                ) : null}

                <div className="mt-auto flex gap-2 pt-4">
                  <Link
                    href={`/panel/cobros/zelle?comercio=${c.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-riel-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-riel-800"
                  >
                    {t("verPagos")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                  <Link
                    href={`/panel/billetera?comercio=${c.id}`}
                    aria-label={t("columnas.saldo")}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50"
                  >
                    <Wallet className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
