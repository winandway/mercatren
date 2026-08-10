import { FileCheck2, FileText, FileWarning } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import type { ParDeFacturas } from "@/lib/facturas/par";
import { RUTA_MEDIA } from "@/lib/rutas";

/**
 * LAS DOS FACTURAS DE ESTA VENTA, EN UN SOLO SITIO.
 *
 * ══ POR QUÉ IMPORTA VERLAS JUNTAS ══
 *
 * El modelo es compra y reventa, y eso se sostiene sobre el par: nuestra
 * factura al comprador y la del comercio a nosotros. Estaban las dos en el
 * sistema pero en pantallas distintas y sin enlace, así que comprobar que una
 * venta estaba completa era abrir dos secciones y cruzarlas a mano.
 *
 * ══ SOLO EL EQUIPO ══
 *
 * La factura de venta es entre Windoce, LLC y el comprador; el comercio no es
 * parte de ese documento. Él ve la suya en «Órdenes de compra», que es donde
 * la sube.
 *
 * Lo que falta se dice en voz alta: una orden sin su factura es una compra sin
 * respaldo, y eso no duele hoy — duele el día de una revisión.
 */
export async function DocumentosDeLaVenta({
  par,
  numeroPedido,
  idioma,
}: {
  par: ParDeFacturas;
  numeroPedido: string;
  idioma: Idioma;
}) {
  const t = await getTranslations("panel.documentos");

  // Sin ningún documento no se dibuja: el pago aún no se ha confirmado.
  if (!par.venta && par.ordenes.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold">
        <FileText className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">{t("bajada")}</p>

      <div className="mt-4 space-y-3">
        {/* 1 · La nuestra al comprador. */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-borde px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("deVenta")}</p>
            <p className="text-xs text-tinta-suave">{t("deVentaQuien")}</p>
          </div>
          {par.venta ? (
            <Link
              href={`/factura/${numeroPedido}`}
              className="text-sm font-semibold underline underline-offset-2"
            >
              {par.venta.numero}
            </Link>
          ) : (
            <span className="text-xs text-tinta-suave">{t("sinEmitir")}</span>
          )}
        </div>

        {/* 2 · La del comercio a nosotros, una por comercio del pedido. */}
        {par.ordenes.map((o) => (
          <div
            key={o.id}
            className="rounded-lg border border-borde px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {t("deCompra", { comercio: o.tiendaNombre })}
                </p>
                <p className="text-xs text-tinta-suave">
                  {o.numero} ·{" "}
                  {formatearPrecio(o.subtotalCentavos, idioma, o.moneda)}
                </p>
              </div>

              {o.facturaClave ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                  <FileCheck2 className="h-3.5 w-3.5" aria-hidden />
                  {t("facturada")}
                </span>
              ) : (
                <span className="text-carga-700 inline-flex items-center gap-1.5 text-xs font-semibold">
                  <FileWarning className="h-3.5 w-3.5" aria-hidden />
                  {t("faltaFactura")}
                </span>
              )}
            </div>

            {o.facturaClave ? (
              <p className="mt-1.5 text-xs">
                <span className="text-tinta-suave">
                  {o.facturaNumero ?? ""}{" "}
                </span>
                <a
                  href={`${RUTA_MEDIA}/${o.facturaClave}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  {t("verArchivo")}
                </a>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
