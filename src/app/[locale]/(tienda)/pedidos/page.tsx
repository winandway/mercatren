import { ArrowRight, Clock, PackageSearch, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { obtenerUsuario } from "@/lib/autorizacion";
import type { Idioma } from "@/lib/dinero";
import { formatearPrecio } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import { listarPedidosPropios } from "@/lib/pedidos/acciones";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "misPedidos" });
  // Es una pagina privada: no se indexa.
  return {
    title: t("titulo"),
    description: t("entradilla"),
    robots: { index: false, follow: false },
  };
}

/** El color y el texto de cada estado, para que se lea de un vistazo. */
const TONO_ESTADO: Record<string, string> = {
  pendiente_pago: "bg-amber-100 text-amber-900",
  pagado: "bg-emerald-100 text-emerald-900",
  preparando: "bg-blue-100 text-blue-900",
  enviado: "bg-blue-100 text-blue-900",
  entregado: "bg-emerald-100 text-emerald-900",
  cancelado: "bg-slate-200 text-slate-700",
  reembolsado: "bg-slate-200 text-slate-700",
};

/**
 * "Devoluciones y pedidos": la lista de compras del cliente.
 *
 * Sale del menu de arriba, asi que la abre gente que solo quiere saber en que
 * va lo suyo. Por eso lo primero de cada fila es el estado y, si falta pagar,
 * el boton para hacerlo.
 */
export default async function PaginaMisPedidos({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("misPedidos");
  const tp = await getTranslations("pedido");

  const usuario = await obtenerUsuario();

  if (!usuario) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">{t("titulo")}</h1>
        <p className="mt-3 text-tinta-suave">{t("entrar")}</p>
        <Link href="/entrar" className="boton-principal mt-6">
          {t("entrar").split(" ").slice(0, 2).join(" ")}
        </Link>
      </div>
    );
  }

  const pedidos = await listarPedidosPropios();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("titulo")}
      </h1>
      <p className="mt-2 text-tinta-suave">{t("entradilla")}</p>

      {pedidos.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-borde px-6 py-16 text-center">
          <PackageSearch
            className="mx-auto h-10 w-10 text-tinta-suave"
            aria-hidden
          />
          <p className="mt-4 text-tinta-suave">{t("vacio")}</p>
          <Link href="/catalogo" className="boton-principal mt-6">
            {t("vacioBoton")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {pedidos.map((pedido) => {
            const faltaPagar = pedido.estado === "pendiente_pago";
            const enRevision = pedido.estadoPago === "pendiente";
            const rechazado = pedido.estadoPago === "rechazado";

            return (
              <li
                key={pedido.numero}
                className="rounded-xl border border-borde p-4 transition-colors hover:border-carga-500 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {pedido.numero}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONO_ESTADO[pedido.estado] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {tp(`estado.${pedido.estado}`)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-tinta-suave">
                      {fechaCorta(pedido.creadoEn, idioma)} ·{" "}
                      {t("articulos", { n: Number(pedido.articulos) })}
                    </p>
                  </div>

                  <p className="text-lg font-extrabold tabular-nums">
                    {formatearPrecio(
                      pedido.totalCentavos,
                      idioma,
                      pedido.moneda,
                    )}
                  </p>
                </div>

                {/* Como va el pago. Solo se dice cuando hay algo que hacer. */}
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

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/pedido/${pedido.numero}`}
                    className={
                      faltaPagar && !enRevision
                        ? "boton-principal gap-2 text-xs"
                        : "inline-flex items-center gap-2 rounded-lg border border-borde px-4 py-2 text-xs font-semibold transition-colors hover:border-carga-500"
                    }
                  >
                    {faltaPagar && !enRevision ? t("pagar") : t("ver")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
