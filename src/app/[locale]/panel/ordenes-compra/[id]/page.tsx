import { eq } from "drizzle-orm";
import { ArrowLeft, FileCheck2, FileWarning } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdjuntarFactura } from "@/components/panel/facturas/adjuntar-factura";
import { Link } from "@/i18n/navigation";
import { comercioEfectivo } from "@/lib/alcance";
import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { ordenesCompra, pedidos, tiendas } from "@/lib/db/schema";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { renglonesDeOrden } from "@/lib/facturas/consultas";
import { fechaCorta } from "@/lib/fechas";
import { RUTA_MEDIA } from "@/lib/rutas";

export const dynamic = "force-dynamic";

/**
 * LA FICHA DE UNA ORDEN DE COMPRA.
 *
 * ══ POR QUÉ HACÍA FALTA ══
 *
 * La lista decía cuánto se le paga al comercio, pero no QUÉ se le compró. Para
 * saberlo había que ir a buscar el pedido a mano y cruzarlo. La consulta de
 * renglones ya existía escrita, sin ninguna pantalla que la usara.
 *
 * ══ EL ALCANCE ══
 *
 * Un comercio solo abre las suyas. Se comprueba contra la sesión, no contra la
 * dirección: aquí se ve cuánto se le paga a un comercio, y eso no es asunto de
 * otro.
 */
export default async function PaginaOrdenDeCompra({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("panel.ordenesCompra");
  const td = await getTranslations("panel.documentos");
  const db = getDb();
  const alcance = await obtenerAlcance();

  const [orden] = await db
    .select({
      id: ordenesCompra.id,
      numero: ordenesCompra.numero,
      tiendaId: ordenesCompra.tiendaId,
      tiendaNombre: tiendas.nombre,
      pedidoNumero: pedidos.numero,
      subtotalCentavos: ordenesCompra.subtotalCentavos,
      moneda: ordenesCompra.moneda,
      emitidaEn: ordenesCompra.emitidaEn,
      facturaNumero: ordenesCompra.facturaProveedorNumero,
      facturaClave: ordenesCompra.facturaProveedorClave,
    })
    .from(ordenesCompra)
    .innerJoin(tiendas, eq(tiendas.id, ordenesCompra.tiendaId))
    .innerJoin(pedidos, eq(pedidos.id, ordenesCompra.pedidoId))
    .where(eq(ordenesCompra.id, id))
    .limit(1);

  if (!orden) notFound();

  /* Un comercio que abre la orden de otro recibe 404, no un «no puedes»: así
     ni siquiera se le confirma que existe. */
  const suComercio = comercioEfectivo(alcance, null);
  if (alcance.tipo === "tienda" && orden.tiendaId !== suComercio) notFound();

  const renglones = await renglonesDeOrden(orden.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/panel/ordenes-compra"
          className="inline-flex items-center gap-1.5 text-sm text-tinta-suave hover:text-tinta"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("titulo")}
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="font-mono text-2xl font-bold">{orden.numero}</h1>
          <span className="text-sm text-tinta-suave">
            {fechaCorta(orden.emitidaEn, idioma)}
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-tinta-suave">
              {t("columna.comercio")}
            </dt>
            <dd className="mt-0.5 text-sm font-medium">{orden.tiendaNombre}</dd>
          </div>
          <div>
            <dt className="text-xs text-tinta-suave">{t("columna.pedido")}</dt>
            <dd className="mt-0.5 text-sm font-medium">
              {/* De la orden al pedido: cierra el círculo en los dos sentidos. */}
              <Link
                href={`/panel/ordenes/${orden.pedidoNumero}`}
                className="underline underline-offset-2"
              >
                {orden.pedidoNumero}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-tinta-suave">{t("columna.monto")}</dt>
            <dd className="mt-0.5 text-sm font-bold tabular-nums">
              {formatearPrecio(orden.subtotalCentavos, idioma, orden.moneda)}
            </dd>
          </div>
        </dl>
      </section>

      {/* QUÉ SE LE COMPRÓ. Es lo que la lista no decía. */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 font-bold">
          {t("loQueSeCompro")}
        </h2>

        <ul className="divide-y divide-slate-100">
          {renglones.map((r, i) => (
            <li key={i} className="flex gap-4 px-5 py-3">
              <span className="w-8 shrink-0 text-sm text-tinta-suave tabular-nums">
                {r.cantidad}×
              </span>
              <span className="min-w-0 flex-1 text-sm">{r.titulo}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatearPrecio(
                  Number(r.subtotalCentavos) - Number(r.comisionCentavos ?? 0),
                  idioma,
                  orden.moneda,
                )}
              </span>
            </li>
          ))}
        </ul>

        <p className="border-t border-slate-100 px-5 py-2 text-xs text-tinta-suave">
          {t("montoEsLoQueSePaga")}
        </p>
      </section>

      {/* LA FACTURA DEL COMERCIO. */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold">
          {orden.facturaClave ? (
            <FileCheck2 className="h-4 w-4 text-emerald-700" aria-hidden />
          ) : (
            <FileWarning className="text-carga-700 h-4 w-4" aria-hidden />
          )}
          {td("deCompra", { comercio: orden.tiendaNombre })}
        </h2>

        {orden.facturaClave ? (
          <p className="mt-2 text-sm">
            <span className="text-tinta-suave">
              {orden.facturaNumero ?? ""}{" "}
            </span>
            <a
              href={`${RUTA_MEDIA}/${orden.facturaClave}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              {td("verArchivo")}
            </a>
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-tinta-suave">{t("porQue")}</p>
            {/* El equipo no emite la factura de un comercio: la emite él. */}
            {alcance.tipo === "tienda" ? (
              <AdjuntarFactura ordenId={orden.id} />
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
