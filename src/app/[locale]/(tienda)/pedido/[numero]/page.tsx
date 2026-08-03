import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CheckCircle2, Info } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaHora } from "@/lib/fechas";
import { obtenerPedidoPropio } from "@/lib/pedidos/acciones";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; numero: string }>;
}): Promise<Metadata> {
  const { locale, numero } = await params;
  const t = await getTranslations({ locale, namespace: "pedido" });
  return {
    title: t("titulo", { numero }),
    robots: { index: false, follow: false },
  };
}

/**
 * El pedido recien hecho, con las instrucciones para pagarlo.
 *
 * Solo lo ve su dueno: la consulta filtra por el cliente de la sesion.
 */
export default async function PaginaPedido({
  params,
}: {
  params: Promise<{ locale: string; numero: string }>;
}) {
  const { locale, numero } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("pedido");
  const datos = await obtenerPedidoPropio(numero);

  if (!datos) notFound();

  const { pedido, renglones } = datos;
  const direccion = pedido.direccionEntrega as {
    nombre?: string;
    pais?: string;
    ciudad?: string;
    direccion?: string;
    referencia?: string | null;
  } | null;

  // La cuenta que recibe los pagos se configura en el panel, no se inventa.
  const { env } = getCloudflareContext();
  const correoZelle = env.ZELLE_CORREO_RECEPTOR;

  const pasos = t.raw("pasosZelle") as string[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 font-bold text-emerald-900">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
          {t("creado")}
        </p>
        <p className="mt-1 text-sm text-emerald-800">{t("creadoTexto")}</p>
      </div>

      <header className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("titulo", { numero: pedido.numero })}
        </h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
          {t(`estado.${pedido.estado}`)}
        </span>
      </header>
      <p className="mt-1 text-xs text-tinta-suave">
        {fechaHora(pedido.creadoEn, idioma)}
      </p>

      {/* Que se compro */}
      <section className="mt-6 rounded-xl border border-borde">
        <h2 className="border-b border-borde px-4 py-3 text-sm font-bold">
          {t("articulos")}
        </h2>
        <ul className="divide-y divide-borde">
          {renglones.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 px-4 py-3">
              <span className="min-w-0 text-sm">
                <span className="line-clamp-2">{r.titulo}</span>
                <span className="text-xs text-tinta-suave">
                  {r.cantidad} ×{" "}
                  {formatearPrecio(r.precioUnitarioCentavos, idioma)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatearPrecio(r.subtotalCentavos, idioma)}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between border-t border-borde px-4 py-3 text-base font-bold">
          <span>{t("total")}</span>
          <span className="tabular-nums">
            {formatearPrecio(pedido.totalCentavos, idioma, pedido.moneda)}
          </span>
        </p>
      </section>

      {/* A donde va */}
      {direccion ? (
        <section className="mt-4 rounded-xl border border-borde p-4">
          <h2 className="text-sm font-bold">{t("entrega")}</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {direccion.nombre}
            <br />
            {direccion.direccion}
            <br />
            {direccion.ciudad}, {direccion.pais}
            {direccion.referencia ? (
              <>
                <br />
                {direccion.referencia}
              </>
            ) : null}
            {pedido.telefonoContacto ? (
              <>
                <br />
                {pedido.telefonoContacto}
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      {/* Como pagar */}
      {pedido.estado === "pendiente_pago" ? (
        <section className="mt-4 rounded-xl border border-carga-500/40 bg-carga-500/5 p-5">
          <h2 className="text-lg font-bold">{t("comoPagar")}</h2>

          <ol className="mt-3 space-y-2">
            {pasos.map((paso, indice) => (
              <li key={paso} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-riel-900 text-xs font-bold text-white">
                  {indice + 1}
                </span>
                <span>{paso}</span>
              </li>
            ))}
          </ol>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-3">
              <dt className="text-xs text-tinta-suave">{t("montoExacto")}</dt>
              <dd className="text-xl font-bold tabular-nums">
                {formatearPrecio(pedido.totalCentavos, idioma, pedido.moneda)}
              </dd>
            </div>
            <div className="rounded-lg bg-white p-3">
              <dt className="text-xs text-tinta-suave">{t("correoZelle")}</dt>
              <dd className="text-sm font-bold break-all">
                {correoZelle ?? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-tinta-suave">
                    <Info className="h-3.5 w-3.5" aria-hidden />
                    {t("avisoDatosPago")}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs text-tinta-suave">
            {t("referenciaPedido")}
          </p>
        </section>
      ) : null}

      <div className="mt-6">
        <Link
          href="/catalogo"
          className="text-sm font-medium text-tinta-suave hover:text-riel-900"
        >
          ← {t("verPedidos")}
        </Link>
      </div>
    </div>
  );
}
