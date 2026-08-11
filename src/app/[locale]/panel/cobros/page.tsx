import {
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  TriangleAlert,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Exportar } from "@/components/panel/exportar";
import { TarjetaMetrica } from "@/components/panel/tarjeta-metrica";
import { Link } from "@/i18n/navigation";
import {
  listarCobrosConTarjeta,
  listarDisputas,
  resumenDeTarjeta,
} from "@/lib/cobros/consultas";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { esEquipoInterno } from "@/lib/autorizacion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TONO: Record<string, string> = {
  confirmado: "bg-emerald-100 text-emerald-900",
  pendiente: "bg-amber-100 text-amber-900",
  rechazado: "bg-red-100 text-red-900",
  reembolsado: "bg-slate-200 text-slate-700",
};

const ESTADOS = ["confirmado", "pendiente", "rechazado"];

/**
 * LOS COBROS CON TARJETA.
 *
 * La pantalla que faltaba. Hasta hoy el panel enseñaba los cobros por Zelle en
 * una sección propia y los de tarjeta en ninguna: se sabían abriendo el pedido
 * uno por uno.
 *
 * Arriba, los contracargos. Un contracargo es dinero que YA salió de la
 * cuenta, así que no puede estar escondido dentro de la ficha de un pedido que
 * hay que sospechar primero para abrirlo.
 */
export default async function PaginaCobrosTarjeta({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    estado?: string;
    comercio?: string;
    pagina?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const filtros = await searchParams;
  const t = await getTranslations("panel.cobros");
  const esEquipo = await esEquipoInterno();

  const [resumen, listado, disputas] = await Promise.all([
    resumenDeTarjeta(filtros.comercio),
    listarCobrosConTarjeta({
      estado: filtros.estado,
      comercio: filtros.comercio,
      pagina: Number(filtros.pagina) || 1,
    }),
    /* Los contracargos los ve también el comercio: le afectan directamente al
       dinero que ya tiene acreditado. */
    listarDisputas(filtros.comercio),
  ]);

  return (
    <div className="space-y-6">
      {/* LOS CONTRACARGOS, ARRIBA DE TODO. */}
      {disputas.length > 0 ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-red-900">
            <TriangleAlert className="h-4 w-4" aria-hidden />
            {t("disputas.titulo", { n: disputas.length })}
          </h2>
          <p className="mt-1 text-xs text-red-900/80">{t("disputas.queEs")}</p>

          <ul className="mt-3 space-y-2">
            {disputas.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  {d.pedidoNumero ? (
                    <Link
                      href={`/panel/ordenes/${d.pedidoNumero}`}
                      className="font-mono font-bold text-carga-600 hover:underline"
                    >
                      {d.pedidoNumero}
                    </Link>
                  ) : (
                    <span className="font-mono text-tinta-suave">{d.id}</span>
                  )}
                  <span className="ml-2 text-xs text-tinta-suave">
                    {t(`disputas.estado.${d.estado}`)}
                    {d.motivo ? ` · ${d.motivo}` : ""}
                  </span>
                </span>
                <span className="font-bold tabular-nums">
                  {formatearPrecio(d.montoCentavos, idioma, d.moneda)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          tono="principal"
          Icono={CheckCircle2}
          titulo={t("tarjetas.cobrado")}
          valor={formatearPrecio(resumen.montoConfirmadoCentavos, idioma)}
          pie={t("tarjetas.cobradoPie", { n: resumen.confirmados })}
        />
        <TarjetaMetrica
          tono={resumen.pendientes > 0 ? "alerta" : "neutro"}
          Icono={Clock}
          titulo={t("tarjetas.enCurso")}
          valor={String(resumen.pendientes)}
          pie={t("tarjetas.enCursoPie")}
        />
        <TarjetaMetrica
          Icono={Ban}
          titulo={t("tarjetas.noEntraron")}
          valor={String(resumen.rechazados)}
          pie={t("tarjetas.noEntraronPie")}
        />
        <TarjetaMetrica
          tono={resumen.disputasAbiertas > 0 ? "alerta" : "apagado"}
          Icono={TriangleAlert}
          titulo={t("tarjetas.contracargos")}
          valor={String(resumen.disputasAbiertas)}
          pie={t("tarjetas.contracargosPie", {
            monto: formatearPrecio(resumen.montoDisputadoCentavos, idioma),
          })}
        />
      </section>

      {/* Filtro por estado del cobro, y el archivo para conciliar. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {[undefined, ...ESTADOS].map((clave) => {
            const activa = (clave ?? undefined) === filtros.estado;
            const destino = new URLSearchParams();
            if (clave) destino.set("estado", clave);
            if (filtros.comercio) destino.set("comercio", filtros.comercio);

            return (
              <Link
                key={clave ?? "todos"}
                href={`/panel/cobros${destino.size ? `?${destino}` : ""}`}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                  activa
                    ? "text-carga-700 bg-carga-500/15"
                    : "text-tinta-suave hover:bg-slate-100",
                )}
              >
                {clave ? t(`estado.${clave}`) : t("todos")}
              </Link>
            );
          })}
        </div>

        <Exportar que="cobros" comercio={filtros.comercio} />
      </div>

      {listado.cobros.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-16 text-center">
          <CreditCard
            className="mx-auto h-10 w-10 text-tinta-suave"
            aria-hidden
          />
          <p className="mt-4 text-sm text-tinta-suave">{t("sinCobros")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {listado.cobros.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-borde bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    {c.pedidoNumero ? (
                      <Link
                        href={`/panel/ordenes/${c.pedidoNumero}`}
                        className="font-mono text-sm font-bold text-carga-600 hover:underline"
                      >
                        {c.pedidoNumero}
                      </Link>
                    ) : (
                      <span className="font-mono text-sm text-tinta-suave">
                        {t("sinPedido")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        TONO[c.estado],
                      )}
                    >
                      {t(`estado.${c.estado}`)}
                    </span>
                    {c.disputa ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-900">
                        {t("conContracargo")}
                      </span>
                    ) : null}
                  </p>

                  <p className="mt-1 truncate text-sm">
                    {c.clienteNombre ?? t("sinCliente")}
                  </p>

                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-tinta-suave">
                    <span>{fechaCorta(c.creadoEn, idioma)}</span>
                    {/* LA REFERENCIA SOLO CON EL COBRO CONFIRMADO. El `pi_…`
                        existe desde que se abre el intento, mucho antes de que
                        el dinero entre: enseñarlo en un cobro sin confirmar es
                        dar por cobrado lo que no lo está. */}
                    {esEquipo && c.estado === "confirmado" && c.referencia ? (
                      <span className="font-mono">{c.referencia}</span>
                    ) : null}
                  </p>
                </div>

                <p className="text-lg font-extrabold tabular-nums">
                  {formatearPrecio(c.montoCentavos, idioma, c.moneda)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
