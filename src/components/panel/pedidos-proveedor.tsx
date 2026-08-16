"use client";

import {
  AlertTriangle,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  comprarPedidoAlProveedor,
  marcarCompraPagada,
  type CompraAlProveedor,
} from "@/lib/cj/proveedor-acciones";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const [creando, iniciar] = useTransition();

  return (
    <li className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-sm font-bold">{venta.numero}</span>
        <span className="text-sm text-tinta-suave">{venta.montoTexto}</span>

        <button
          type="button"
          disabled={creando}
          onClick={() =>
            iniciar(async () => {
              const r = await comprarPedidoAlProveedor(venta.id);
              setAviso({ ok: r.ok, texto: r.mensaje });
              router.refresh();
            })
          }
          className="boton-principal ml-auto gap-2 text-sm disabled:opacity-60"
        >
          {creando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ShoppingCart className="h-4 w-4" aria-hidden />
          )}
          {creando ? t("creando") : t("comprar")}
        </button>
      </div>

      {aviso ? (
        <p
          role="status"
          className={cn(
            "mt-2 text-sm font-medium",
            aviso.ok ? "text-precio-600" : "text-red-700",
          )}
        >
          {aviso.texto}
        </p>
      ) : null}
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

      {aviso ? (
        <p role="status" className="mt-2 text-sm font-medium text-precio-600">
          {aviso}
        </p>
      ) : null}
    </li>
  );
}
