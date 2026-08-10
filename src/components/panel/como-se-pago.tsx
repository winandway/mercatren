import { CreditCard, HelpCircle, Landmark, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { EstadoRastro, MetodoPago, Rastro } from "@/lib/pagos/rastro";
import { cn } from "@/lib/utils";

/**
 * CÓMO SE PAGÓ UNA VENTA, en pantalla.
 *
 * ══ POR QUÉ EXISTE ══
 *
 * El método de pago se guardaba desde el primer pedido y ninguna pantalla lo
 * enseñaba. Para saber si una venta entró por tarjeta o por Zelle había que
 * abrir «Pagos Zelle» y, si no estaba ahí, deducir que fue con tarjeta.
 * Averiguar por descarte cómo entró el dinero es como se pierde la pista de un
 * cobro.
 *
 * ══ EL SELLO Y EL BLOQUE SON LA MISMA VERDAD ══
 *
 * El sello va en las listas —de un vistazo, sin abrir nada— y el bloque en la
 * ficha, donde además hace falta la referencia para ir a buscar el cobro. Los
 * dos leen el mismo `Rastro`, así que no pueden contradecirse.
 */

const ICONO: Record<MetodoPago, typeof CreditCard> = {
  stripe: CreditCard,
  zelle: Landmark,
  billetera: Wallet,
};

/**
 * El color dice el estado, no el método.
 *
 * Lo que quiere saber quien mira una lista de treinta ventas es cuáles ya
 * están cobradas. Pintar por método (una tarjeta azul, un Zelle verde) haría
 * bonito y no contestaría esa pregunta.
 */
const TONO: Record<EstadoRastro, string> = {
  confirmado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  en_revision: "bg-blue-50 text-blue-800 ring-blue-200",
  rechazado: "bg-red-50 text-red-800 ring-red-200",
  reembolsado: "bg-slate-100 text-slate-700 ring-slate-300",
  sin_pago: "bg-amber-50 text-amber-900 ring-amber-200",
};

/** El sello compacto de una lista. */
export async function SelloMetodoPago({ rastro }: { rastro: Rastro }) {
  const t = await getTranslations("panel.comoSePago");
  const Icono = rastro.metodo ? ICONO[rastro.metodo] : HelpCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        TONO[rastro.estado],
      )}
    >
      <Icono className="h-3 w-3" aria-hidden />
      {rastro.metodo ? t(`metodo.${rastro.metodo}`) : t("metodo.sinRegistrar")}
      <span className="font-normal opacity-80">
        · {t(`estado.${rastro.estado}`)}
      </span>
    </span>
  );
}

/** El bloque de la ficha, con la referencia y dónde buscarla. */
export async function ComoSePago({ rastro }: { rastro: Rastro }) {
  const t = await getTranslations("panel.comoSePago");
  const Icono = rastro.metodo ? ICONO[rastro.metodo] : HelpCircle;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-bold">
        <Icono className="h-4 w-4 text-carga-500" aria-hidden />
        {t("titulo")}
      </h2>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-tinta-suave">{t("etiquetaMetodo")}</dt>
          <dd className="mt-0.5 text-sm font-medium">
            {rastro.metodo
              ? t(`metodo.${rastro.metodo}`)
              : t("metodo.sinRegistrar")}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-tinta-suave">{t("etiquetaEstado")}</dt>
          <dd className="mt-0.5">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                TONO[rastro.estado],
              )}
            >
              {t(`estado.${rastro.estado}`)}
            </span>
          </dd>
        </div>
      </dl>

      {rastro.referencia ? (
        <div className="mt-4">
          <p className="text-xs text-tinta-suave">{t("etiquetaReferencia")}</p>
          {/* Se puede seleccionar y copiar: es lo que se pega en el buscador
              del banco o del procesador. */}
          <p className="mt-0.5 font-mono text-sm break-all select-all">
            {rastro.referencia}
          </p>
          <p className="mt-1 text-xs text-tinta-suave">
            {rastro.metodo === "zelle" ? t("dondeZelle") : t("dondeTarjeta")}
          </p>
        </div>
      ) : (
        /* Sin referencia se dice por qué. Un hueco callado se lee como un
           fallo del sistema, y casi siempre es que aún no se ha cobrado. */
        <p className="mt-4 text-xs text-tinta-suave">
          {rastro.estado === "sin_pago"
            ? t("aunSinCobrar")
            : t("sinReferencia")}
        </p>
      )}
    </section>
  );
}
