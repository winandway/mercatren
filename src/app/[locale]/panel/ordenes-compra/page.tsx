import { FileCheck2, FileWarning } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SelloMetodoPago } from "@/components/panel/como-se-pago";
import { AdjuntarFactura } from "@/components/panel/facturas/adjuntar-factura";
import { Link } from "@/i18n/navigation";
import { obtenerAlcance } from "@/lib/autorizacion";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import {
  cuantasSinFactura,
  listarOrdenesCompra,
} from "@/lib/facturas/consultas";
import { fechaCorta } from "@/lib/fechas";
import type { MetodoPago } from "@/lib/pagos/rastro";
import { esTiendaDeLaCasa } from "@/lib/facturas/de-la-casa";
import { RUTA_MEDIA } from "@/lib/rutas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Ante un método desconocido, null: mejor no decir nada que decir de más. */
function metodoValido(valor: string | null): MetodoPago | null {
  return valor === "stripe" || valor === "zelle" || valor === "billetera"
    ? valor
    : null;
}

/**
 * LAS ÓRDENES DE COMPRA, vistas desde las dos puntas.
 *
 * La misma pantalla sirve al comercio y al equipo porque es la misma
 * conversación: el comercio ve las suyas y sube su factura; el equipo las ve
 * todas y sabe cuáles siguen sin respaldo.
 *
 * ══ POR QUÉ EL CONTADOR DE PENDIENTES VA ARRIBA Y GRANDE ══
 *
 * Sin la factura del comercio queda una compra sin documento que la respalde,
 * y la figura de reventa se sostiene precisamente sobre ese par. Es un hueco
 * que no duele hoy y duele mucho el día de una revisión — así que tiene que
 * verse antes que nada, no descubrirse contando filas.
 *
 * ══ EL ALCANCE ══
 *
 * `listarOrdenesCompra` decide qué comercio se consulta con `obtenerAlcance`.
 * Si quien mira es un vendedor, se usa el suyo aunque en la dirección venga
 * pedido otro.
 */
export default async function PaginaOrdenesCompra({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ comercio?: string; pendientes?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const idioma = locale as Idioma;
  const t = await getTranslations("panel.ordenesCompra");
  const tc = await getTranslations("panel.comoSePago");
  const { comercio, pendientes } = await searchParams;

  const alcance = await obtenerAlcance();
  const soloPendientes = pendientes === "1";

  const [ordenes, sinFactura] = await Promise.all([
    listarOrdenesCompra(alcance, { comercio, soloPendientes }),
    cuantasSinFactura(alcance, comercio),
  ]);

  const esEquipo = alcance.tipo === "todos";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{t("titulo")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          {t("entradilla")}
        </p>
      </header>

      <div
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-xl border p-4",
          sinFactura > 0
            ? "border-carga-500/40 bg-carga-500/10"
            : "border-emerald-200 bg-emerald-50",
        )}
      >
        {sinFactura > 0 ? (
          <FileWarning
            className="text-carga-700 h-5 w-5 shrink-0"
            aria-hidden
          />
        ) : (
          <FileCheck2
            className="h-5 w-5 shrink-0 text-emerald-700"
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {t("pendientes", { n: sinFactura })}
          </p>
          {sinFactura > 0 ? (
            <p className="mt-0.5 text-xs text-tinta-suave">{t("porQue")}</p>
          ) : null}
        </div>

        <div className="flex gap-2 text-xs">
          <Link
            href="/panel/ordenes-compra"
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium",
              soloPendientes ? "hover:bg-white/60" : "bg-white shadow-sm",
            )}
          >
            {t("todas")}
          </Link>
          <Link
            href="/panel/ordenes-compra?pendientes=1"
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium",
              soloPendientes ? "bg-white shadow-sm" : "hover:bg-white/60",
            )}
          >
            {t("soloPendientes")}
          </Link>
        </div>
      </div>

      {ordenes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borde px-6 py-12 text-center text-sm text-tinta-suave">
          {t("vacio")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-borde">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-neutral-50 text-left text-xs tracking-wide text-tinta-suave uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {t("columna.orden")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("columna.pedido")}
                </th>
                <th className="px-4 py-3 font-semibold">{tc("columna")}</th>
                {esEquipo ? (
                  <th className="px-4 py-3 font-semibold">
                    {t("columna.comercio")}
                  </th>
                ) : null}
                <th className="px-4 py-3 text-right font-semibold">
                  {t("columna.monto")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("columna.fecha")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("columna.estado")}
                </th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id} className="border-t border-borde align-top">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/panel/ordenes-compra/${o.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {o.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {/* El número del pedido lleva a su ficha. Antes era texto
                        muerto: para ver qué se vendió había que buscarlo a
                        mano en Órdenes. */}
                    <Link
                      href={`/panel/ordenes/${o.pedidoNumero}`}
                      className="text-tinta-suave underline-offset-2 hover:text-tinta hover:underline"
                    >
                      {o.pedidoNumero}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <SelloMetodoPago
                      rastro={{
                        /* La orden de compra solo existe cuando el pago ya se
                           confirmó: por eso el estado es siempre «cobrado». */
                        metodo: metodoValido(o.metodoPago),
                        estado: "confirmado",
                        referencia: null,
                      }}
                    />
                  </td>
                  {esEquipo ? (
                    <td className="px-4 py-3 text-tinta-suave">
                      {o.tiendaNombre}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatearPrecio(o.subtotalCentavos, idioma, o.moneda)}
                  </td>
                  <td className="px-4 py-3 text-tinta-suave">
                    {fechaCorta(o.emitidaEn, idioma)}
                  </td>
                  <td className="px-4 py-3">
                    {o.facturaProveedorClave ? (
                      <div className="space-y-1">
                        <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          {t("estado.facturada")}
                        </span>
                        <p className="text-xs text-tinta-suave">
                          {o.facturaProveedorNumero}
                        </p>
                        <a
                          href={`${RUTA_MEDIA}/${o.facturaProveedorClave}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs font-medium underline"
                        >
                          {t("verArchivo")}
                        </a>
                      </div>
                    ) : esTiendaDeLaCasa(o.tiendaId) ? (
                      /**
                       * UNA TIENDA NUESTRA NO SE FACTURA A SÍ MISMA.
                       *
                       * «Sole & Thread», «Ridgeback Outdoors» y las demás
                       * tiendas del catálogo de EE. UU. son marcas de la casa:
                       * por dentro vende y factura Mercatren LLC. Pedirles una
                       * factura dejaba esa fila para siempre en «Falta tu
                       * factura», y encima hacía creer que faltaba un papel
                       * que no existe.
                       *
                       * El costo de esa mercancía sí tiene su documento: la
                       * factura de CJ, que vive en «Pedidos al proveedor».
                       * Estas órdenes ya emitidas se quedan —son un hecho
                       * pasado y no se borran— pero dicen lo que son.
                       */
                      <span className="inline-block rounded-md bg-riel-100 px-2 py-0.5 text-xs font-medium text-riel-700">
                        {t("estado.noAplica")}
                      </span>
                    ) : (
                      <div className="min-w-[13rem] space-y-2">
                        <span className="text-carga-700 inline-block rounded-md bg-carga-500/15 px-2 py-0.5 text-xs font-medium">
                          {t("estado.emitida")}
                        </span>
                        {/* El equipo no sube la factura de un comercio: la
                            emite él. Aquí solo la ve quien puede emitirla. */}
                        {alcance.tipo === "tienda" ? (
                          <AdjuntarFactura ordenId={o.id} />
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
