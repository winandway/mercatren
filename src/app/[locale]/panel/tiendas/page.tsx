import { ArrowRight, FileWarning, Wallet } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BotonVerComo } from "@/components/panel/ver-como";
import { CerrarSaldo } from "@/components/panel/cerrar-saldo";
import { AprobarComercio } from "@/components/panel/aprobar-comercio";
import { TokenIntegracion } from "@/components/panel/tiendas/token-integracion";
import { BuscadorPanel } from "@/components/panel/buscador-panel";
import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { estadoFiscal, puedeCobrar } from "@/lib/fiscal/w8bene";
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.comercios");
  /* Solo `soporte`, nunca `validador`: uno atiende comercios y el otro revisa
     comprobantes. El servidor lo vuelve a comprobar en la acción. */
  const esSoporte = (await obtenerUsuario())?.rol === "soporte";
  const busqueda = ((await searchParams).q ?? "").trim().slice(0, 80);
  const comercios = await listarComercios(busqueda);
  /* Una sola marca de tiempo para toda la lista: con `new Date()` dentro del
     bucle, dos tarjetas de la misma pantalla podrían caer a distinto lado de
     la medianoche. */
  const ahora = new Date();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-tinta-suave">
          {t("subtitulo")}
        </p>
      </header>

      <BuscadorPanel
        busqueda={busqueda}
        ruta="/panel/tiendas"
        placeholder={t("buscarPlaceholder")}
        textoTotal={t("total", { n: comercios.length })}
        textoResultados={t("resultados", {
          n: comercios.length,
          texto: busqueda,
        })}
      />

      {comercios.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-tinta-suave">
          {busqueda ? t("sinResultados", { texto: busqueda }) : t("vacio")}
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
                    className={`shrink-0 rounded-full px-2 py-1 text-[12px] font-semibold ${ESTILO_ESTADO[c.estado]}`}
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
                      {formatearPrecio(c.ingresosCentavos, idioma, "USD")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-tinta-suave">{t("columnas.saldo")}</dt>
                    <dd className="inline-flex items-center gap-1 font-semibold tabular-nums">
                      <Wallet
                        className="h-3.5 w-3.5 text-tinta-suave"
                        aria-hidden
                      />
                      {formatearPrecio(c.saldoCentavos, idioma, "USD")}
                    </dd>
                  </div>
                </dl>

                {/**
                 * SI NO PUEDE COBRAR, SE DICE AQUÍ.
                 *
                 * El candado del W-8BEN-E frena el retiro ANTES de que llegue
                 * a la cola, así que en «Retiros» no aparece nada. Sin esta
                 * línea, un comercio llama diciendo «no me deja pedir mi
                 * dinero» y de este lado no hay dónde mirarlo.
                 *
                 * Se marca la EXCEPCIÓN, no lo normal: quien lo tiene al día
                 * no dibuja nada. Un sello verde en cada tarjeta convertiría
                 * la lista en ruido y el rojo dejaría de significar algo.
                 */}
                {(() => {
                  const fiscal = estadoFiscal(
                    c.paisOrigen,
                    c.fiscalVenceEnMs ? new Date(c.fiscalVenceEnMs) : null,
                    ahora,
                  );
                  if (fiscal.estado === "no_hace_falta") return null;
                  if (fiscal.estado === "al_dia") return null;

                  const frena = !puedeCobrar(fiscal);
                  return (
                    <p
                      className={`mt-3 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                        frena
                          ? "bg-red-50 text-red-800"
                          : "bg-amber-50 text-amber-900"
                      }`}
                    >
                      <FileWarning
                        className="mt-px h-3.5 w-3.5 shrink-0"
                        aria-hidden
                      />
                      {fiscal.estado === "falta"
                        ? t("fiscal.falta")
                        : fiscal.estado === "vencido"
                          ? t("fiscal.vencido")
                          : t("fiscal.porVencer", { dias: fiscal.dias })}
                    </p>
                  );
                })()}

                {/* «Ver su panel»: para responderle cuando manda una captura
                    preguntando dónde se hace algo. Solo para Soporte. */}
                {/**
                 * ACTIVAR UNA QUE QUEDÓ PENDIENTE.
                 *
                 * Desde el 15 ago 2026 las tiendas nacen activas, así que esto
                 * solo sale para las que se registraron antes del cambio, o
                 * para una que se suspendió y se quiere devolver.
                 *
                 * Va AQUÍ y no escondido en la ficha de la cuenta: es donde el
                 * dueño lo buscó, y no encontrarlo es lo mismo que no tenerlo.
                 */}
                {esSoporte && c.estado === "pendiente" ? (
                  <div className="mt-4">
                    <AprobarComercio tiendaId={c.id} />
                  </div>
                ) : null}

                {esSoporte ? (
                  <div className="mt-4">
                    <BotonVerComo tiendaId={c.id} nombre={c.nombre} />
                    <CerrarSaldo
                      tiendaId={c.id}
                      nombre={c.nombre}
                      disponibleTexto={formatearPrecio(
                        c.saldoCentavos ?? 0,
                        idioma,
                        "USD",
                      )}
                    />
                    {/**
                     * EL TOKEN VA PLEGADO, Y ES A PROPÓSITO.
                     *
                     * Casi ningún comercio lo necesita: solo los que tienen su
                     * propio sistema de caja y quieren cobrar desde ahí. A la
                     * vista en cada ficha era un botón que nadie entendía —
                     * «¿para qué es esto?»— repetido seis veces en la pantalla.
                     *
                     * Un `<details>` del navegador: abre sin JavaScript y el
                     * texto de dentro explica para qué sirve antes de que haya
                     * que preguntarlo.
                     */}
                    <details className="mt-3 border-t border-borde pt-3">
                      <summary className="cursor-pointer text-xs font-semibold text-tinta-suave">
                        {t("token.resumen")}
                      </summary>
                      <p className="mt-2 text-xs leading-relaxed text-tinta-suave">
                        {t("token.paraQue")}
                      </p>
                      <TokenIntegracion tiendaId={c.id} nombre={c.nombre} />
                    </details>
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
