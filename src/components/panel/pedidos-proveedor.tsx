"use client";

import {
  AlertTriangle,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { ElegirVariantes } from "@/components/panel/elegir-variantes";
import {
  marcarCompraPagada,
  type CompraAlProveedor,
} from "@/lib/cj/proveedor-acciones";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * LA LISTA DE PEDIDOS EN EL PANEL DE CJ.
 *
 * ══ ESTA DIRECCIÓN ESTÁ COMPROBADA, NO ADIVINADA (18 ago 2026) ══
 *
 * La primera versión decía `app.cjdropshipping.com/dashboard/order/list`, que
 * me inventé. **Redirige a una ruta que no existe y CJ contesta con su 404**,
 * que además se va solo a su portada a los cuatro segundos. El dueño la abrió
 * dos veces, en dos navegadores, creyendo que era cosa de su sesión.
 *
 * Comprobado con peticiones de verdad: esta devuelve **200**, la inventada
 * devolvía **302** hacia el 404, y una ruta falsa a propósito también daba 302.
 * Si CJ vuelve a cambiar su panel, esto es una línea — pero se cambia
 * comprobando, no a ojo.
 */
const PEDIDOS_EN_CJ =
  "https://www.cjdropshipping.com/mine/dropshipping/orderList?orderType=6";

/**
 * LA COLA DE COMPRAS AL PROVEEDOR.
 *
 * Arriba las ventas que todavía no se le pidieron a nadie —cada una es un
 * comprador esperando una caja que no existe— y debajo lo ya pedido, con su
 * botón de pagar.
 *
 * El botón de pagar es un enlace de verdad a la pasarela del proveedor y abre
 * en pestaña nueva: se paga allá y se vuelve aquí a marcarlo. Marcar y pagar
 * son dos actos separados a propósito — el pago ocurre fuera de este sistema y
 * fingir que lo sabemos sería inventar un dato.
 */
export function PedidosProveedor({
  sinComprar,
  compras,
}: {
  /* Los montos llegan YA FORMATEADOS, no como centavos con una función que
     los pinte: una función no cruza la frontera del servidor al navegador, y
     formatear en dos sitios distintos es como se acaban viendo dos cifras
     distintas del mismo dinero. */
  sinComprar: Array<{ id: string; numero: string; montoTexto: string }>;
  compras: Array<CompraAlProveedor & { costoTexto: string | null }>;
}) {
  const t = useTranslations("panel.proveedor");

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-bold">{t("sinComprar")}</h2>
        {sinComprar.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">
            {t("sinComprarVacio")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sinComprar.map((v) => (
              <FilaSinComprar key={v.id} venta={v} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-bold">{t("cola")}</h2>
        {compras.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">{t("colaVacia")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {compras.map((c) => (
              <FilaCompra key={c.id} compra={c} monto={c.costoTexto} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilaSinComprar({
  venta,
}: {
  venta: { id: string; numero: string; montoTexto: string };
}) {
  const t = useTranslations("panel.proveedor");

  return (
    <li className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-sm font-bold">{venta.numero}</span>
        <span className="text-sm text-tinta-suave">{venta.montoTexto}</span>

        {/* NO compra al primer clic: abre la lista de tallas y colores. El
            dueño pulsó «crear el pedido» y la talla le apareció después, con el
            pedido ya creado en CJ y sin forma de cambiarla. */}
        <span className="ml-auto">
          <ElegirVariantes pedidoId={venta.id} etiqueta={t("comprar")} />
        </span>
      </div>
    </li>
  );
}

function FilaCompra({
  compra,
  monto,
}: {
  compra: CompraAlProveedor & { costoTexto: string | null };
  monto: string | null;
}) {
  const t = useTranslations("panel.proveedor");
  const router = useRouter();
  const [aviso, setAviso] = useState<string | null>(null);
  const [marcando, iniciar] = useTransition();

  const porPagar = compra.estado === "por_pagar";
  const conError = compra.estado === "con_error";

  return (
    <li
      className={cn(
        "rounded-lg border px-3 py-2.5",
        conError
          ? "border-red-200 bg-red-50"
          : porPagar
            ? "border-carga-500/40 bg-white"
            : "border-borde bg-white",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-sm font-bold">{compra.numero}</span>

        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            conError
              ? "bg-red-100 text-red-800"
              : porPagar
                ? "text-carga-700 bg-carga-500/15"
                : "bg-emerald-50 text-precio-600",
          )}
        >
          {t(`estados.${compra.estado}`)}
        </span>

        <span className="text-sm text-tinta-suave">
          {monto ? `${t("costo")} ${monto}` : t("sinCosto")}
        </span>

        {compra.externoNumero ? (
          <span className="text-xs text-tinta-suave">
            {t("suPedido")} {compra.externoNumero}
          </span>
        ) : null}

        {compra.guia ? (
          <span className="text-xs font-semibold">
            {t("guia")} {compra.guia}
          </span>
        ) : null}

        {porPagar && compra.urlPago ? (
          <span className="ml-auto flex flex-wrap items-center gap-2">
            {/* Enlace de verdad a la pasarela del proveedor, en pestaña nueva:
                se paga allá y se vuelve aquí a dejar la constancia. */}
            <a
              href={compra.urlPago}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-principal gap-2 text-sm"
            >
              <CreditCard className="h-4 w-4" aria-hidden />
              {t("pagar")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>

            <button
              type="button"
              disabled={marcando}
              onClick={() =>
                iniciar(async () => {
                  const r = await marcarCompraPagada(compra.id);
                  setAviso(r.mensaje);
                  router.refresh();
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-borde px-3 py-2 text-sm font-semibold hover:border-carga-500 disabled:opacity-60"
            >
              {marcando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              {t("yaPague")}
            </button>
          </span>
        ) : null}
      </div>

      {conError && compra.ultimoError ? (
        <p className="mt-2 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {/* El motivo del proveedor, entero: un «no se pudo» obliga a
              adivinar entre el transporte, el SKU y la dirección. */}
          {compra.ultimoError}
        </p>
      ) : null}

      {/**
       * REINTENTAR, QUE ES LO QUE FALTABA.
       *
       * Una compra con error no tenía ningún botón, y a la vez desaparecía de
       * «ventas esperando» porque su fila ya existía. El pedido quedaba en un
       * callejón sin salida: el comprador había pagado y no había forma de
       * volver a intentarlo sin meter mano en la base.
       */}
      {conError ? (
        <div className="mt-2">
          <ElegirVariantes
            pedidoId={compra.pedidoId}
            etiqueta={t("reintentar")}
          />
        </div>
      ) : null}

      {/**
       * «POR PAGAR» PERO SIN ENLACE: EL OTRO CALLEJÓN SIN SALIDA (18 ago 2026).
       *
       * Con `createOrderV3` el pedido se creaba bien y CJ **no devolvía el
       * enlace de pago**. La fila quedaba en «Por pagar», con el aviso de que no
       * hubo enlace, y **sin un solo botón**: ni pagar, ni reintentar, porque
       * reintentar solo salía con error. El dueño se quedó mirando una pantalla
       * que no le dejaba hacer nada, con el comprador ya cobrado.
       *
       * El fondo se arregló pasando a `createOrderV2`, que sí lo devuelve. Esto
       * es la salida para las filas que quedaron atrapadas antes: se vuelve a
       * pedir —ahora por V2— o se abre el panel de CJ a pagarlo a mano.
       */}
      {porPagar && !compra.urlPago ? (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t("sinEnlace")}
          </p>
          <div className="mt-2 flex flex-wrap items-start gap-2">
            <ElegirVariantes
              pedidoId={compra.pedidoId}
              etiqueta={t("pedirEnlace")}
            />
            <a
              href={PEDIDOS_EN_CJ}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-borde bg-white px-3 py-2 text-sm font-semibold hover:border-carga-500"
            >
              {t("abrirPanelCj")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      ) : null}

      {/**
       * QUÉ SE PIDIÓ EXACTAMENTE, ANTES DE PAGAR.
       *
       * Cuando un producto de CJ tiene tallas o colores, el comprador nunca
       * eligió —nuestra ficha lo publica como una sola cosa— así que la eligió
       * el sistema. Aquí se ve, y por eso el pago sigue siendo un botón que
       * pulsa una persona: es la única oportunidad de cancelar si el color no
       * era ese.
       */}
      {compra.renglones.length > 0 ? (
        <ul className="mt-2 space-y-1 border-t border-borde/60 pt-2">
          {compra.renglones.map((r) => (
            <li key={r.id} className="text-xs">
              <span className="text-tinta-suave">
                {r.cantidad} × {r.titulo ?? "—"}
              </span>
              {r.varianteNombre ? (
                <span
                  className={cn(
                    "ml-1.5 rounded px-1.5 py-0.5 font-semibold",
                    r.varianteAutomatica
                      ? "bg-amber-100 text-amber-900"
                      : "bg-slate-100",
                  )}
                >
                  {r.varianteNombre}
                </span>
              ) : null}
              {r.varianteAutomatica ? (
                <span className="ml-1.5 text-amber-800">
                  {t("varianteAutomatica", { total: r.variantesTotales ?? 0 })}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {aviso ? (
        <p role="status" className="mt-2 text-sm font-medium text-precio-600">
          {aviso}
        </p>
      ) : null}
    </li>
  );
}
