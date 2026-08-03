import { Clock, ShoppingBag, TriangleAlert } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ListaTiques } from "@/components/panel/lista-tiques";
import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import {
  contarPedidosPorEstado,
  listarPedidosDelPanel,
} from "@/lib/pedidos/consultas";
import { cn } from "@/lib/utils";
import { listarComercios, listarPagos } from "@/lib/zelle/consultas";
import { aPagoVista } from "@/lib/zelle/vista";

export const dynamic = "force-dynamic";

const TONO_ESTADO: Record<string, string> = {
  pendiente_pago: "bg-amber-100 text-amber-900",
  pagado: "bg-emerald-100 text-emerald-900",
  preparando: "bg-blue-100 text-blue-900",
  enviado: "bg-blue-100 text-blue-900",
  entregado: "bg-emerald-100 text-emerald-900",
  cancelado: "bg-slate-200 text-slate-700",
  reembolsado: "bg-slate-200 text-slate-700",
};

const PESTANAS = ["pendiente_pago", "pagado", "preparando", "entregado"];

/**
 * Las ordenes, desde el panel.
 *
 * Un comercio ve solo las que le compraron a el, y los importes son los de
 * SUS renglones: un pedido puede mezclar varios comercios, y decirle a uno el
 * total del pedido entero seria decirle que vendio mas de lo que vendio.
 */
export default async function PaginaOrdenes({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    estado?: string;
    comercio?: string;
    q?: string;
    pagina?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.ordenes");
  const tt = await getTranslations("panel.tique");
  const tp = await getTranslations("pedido");
  const filtros = await searchParams;

  /**
   * LAS VENTAS YA CERRADAS SON LOS PAGOS APROBADOS.
   *
   * Cada pago aprobado ya se cobró y ya se entregó: no se espera a que el
   * cliente pase por el negocio. Por eso salen aquí como tiques entregados, en
   * vez de dejar la sección vacía mientras el histórico vive en otra pantalla.
   *
   * Se reutiliza `listarPagos`, que ya trae el buscador (código de
   * confirmación, banco, últimos cuatro, monto, pagador) y —lo importante— ya
   * respeta el alcance: un comercio solo ve lo suyo.
   */
  const [datos, conteo, ventas, comercios] = await Promise.all([
    listarPedidosDelPanel({
      estado: filtros.estado,
      comercio: filtros.comercio,
    }),
    contarPedidosPorEstado(filtros.comercio),
    listarPagos({
      tipo: "entrada",
      estado: "aprobado",
      comercio: filtros.comercio,
      busqueda: filtros.q,
      pagina: Number(filtros.pagina) || 1,
      porPagina: 24,
    }),
    listarComercios().catch(() => []),
  ]);

  const nombrePorTienda = new Map(comercios.map((c) => [c.id, c.nombre]));

  const tiques = ventas.pagos.map((p) => ({
    pago: aPagoVista(p),
    comercio: p.tiendaId ? (nombrePorTienda.get(p.tiendaId) ?? null) : null,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("titulo")}</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          {datos.soloDeEsteComercio ? t("subtitulo") : t("subtituloEquipo")}
        </p>
      </header>

      {/* Pestanas por estado. */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {[undefined, ...PESTANAS].map((clave) => {
          const activa = (clave ?? undefined) === filtros.estado;
          const destino = new URLSearchParams();
          if (clave) destino.set("estado", clave);
          if (filtros.comercio) destino.set("comercio", filtros.comercio);

          return (
            <Link
              key={clave ?? "todas"}
              href={`/panel/ordenes${destino.size ? `?${destino}` : ""}`}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                activa
                  ? "bg-riel-900 text-white"
                  : "bg-white text-tinta-suave ring-1 ring-borde hover:ring-carga-500",
              )}
            >
              {clave ? tp(`estado.${clave}`) : t("todos")}{" "}
              <span className="tabular-nums opacity-70">
                {/**
                 * Las ventas aprobadas cuentan como entregadas: ya se cobraron
                 * y ya se entregaron. Si no se sumaran aquí, "Entregado" diría
                 * cero teniendo cientos abajo en la pantalla.
                 */}
                {clave === "entregado"
                  ? (conteo.entregado ?? 0) + ventas.total
                  : clave
                    ? (conteo[clave] ?? 0)
                    : conteo.total + ventas.total}
              </span>
            </Link>
          );
        })}
      </div>

      {datos.soloDeEsteComercio && datos.pedidos.length > 0 ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-tinta-suave">
          {t("soloTuParte")}
        </p>
      ) : null}

      {/**
       * Las ventas ya cerradas, como tiques. Solo aparecen cuando no se está
       * filtrando por otro estado: si alguien pide "esperando el pago", meterle
       * aquí las entregadas sería contradecir el filtro que acaba de tocar.
       */}
      {!filtros.estado || filtros.estado === "entregado" ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-bold">{tt("seccion")}</h2>
            <p className="text-sm text-tinta-suave">
              {tt("cuantas", { n: ventas.total })} ·{" "}
              <span className="font-semibold tabular-nums">
                {formatearPrecio(ventas.sumaFiltrada.montoCentavos, idioma)}
              </span>
            </p>
          </div>

          {/* Carga infinita: nadie va a pulsar "siguiente" 27 veces. */}
          <ListaTiques
            key={filtros.q ?? ""}
            tiques={tiques}
            busqueda={filtros.q ?? ""}
            paginas={ventas.paginas}
          />
        </section>
      ) : null}

      {datos.pedidos.length === 0 ? (
        conteo.total === 0 ? null : (
          <div className="rounded-xl border border-dashed border-borde bg-white px-6 py-16 text-center">
            <ShoppingBag
              className="mx-auto h-10 w-10 text-tinta-suave"
              aria-hidden
            />
            <p className="mt-4 text-sm text-tinta-suave">
              {t("sinResultados")}
            </p>
          </div>
        )
      ) : (
        <ul className="space-y-2">
          {datos.pedidos.map((p) => {
            const enRevision = p.estadoPago === "pendiente";
            const rechazado = p.estadoPago === "rechazado";

            return (
              <li
                key={p.numero}
                className="rounded-xl border border-borde bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {p.numero}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          TONO_ESTADO[p.estado],
                        )}
                      >
                        {tp(`estado.${p.estado}`)}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-sm">{p.clienteNombre}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-tinta-suave">
                      <span>{fechaCorta(p.creadoEn, idioma)}</span>
                      <span>{t("articulos", { n: p.articulos })}</span>
                      {p.paisDestino ? <span>{p.paisDestino}</span> : null}
                    </p>
                  </div>

                  <p className="text-lg font-extrabold tabular-nums">
                    {formatearPrecio(p.montoCentavos, idioma)}
                  </p>
                </div>

                {enRevision ? (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-800">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {t("pagoEnRevision")}
                  </p>
                ) : rechazado ? (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-700">
                    <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
                    {t("pagoRechazado")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
