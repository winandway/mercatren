import { eq } from "drizzle-orm";
import { Clock, Store } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MetodosDeCobro } from "@/components/cobro/metodos-de-cobro";
import { estadoParaMostrar, sePuedePagar } from "@/lib/cobros/reglas";
import { getDb } from "@/lib/db";
import { cobrosSolicitados, tiendas } from "@/lib/db/schema";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";

/** Un enlace de cobro se abre una vez y se paga: nunca se guarda en caché. */
export const dynamic = "force-dynamic";

/**
 * DONDE PAGA QUIEN RECIBIÓ EL ENLACE.
 *
 * ══ NO EXIGE CUENTA, Y ESO ES EL PUNTO ══
 *
 * Quien abre esto muchas veces no es el cliente del comercio, sino su hijo o su
 * socio en Estados Unidos, a quien le reenviaron el correo. Pedirle que se
 * registre antes de pagar es justo el paso donde se pierde la venta que este
 * producto entero existe para salvar.
 *
 * ══ NO SE INDEXA ══
 *
 * Es una dirección con un secreto dentro. Que Google la recorra sería publicar
 * los cobros de los comercios.
 */
export const metadata = { robots: { index: false, follow: false } };

export default async function PaginaDeCobro({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; enlace: string }>;
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { locale, enlace } = await params;
  const { payment_intent: intentoDeVuelta } = await searchParams;
  setRequestLocale(locale);
  const idioma = locale as Idioma;

  const t = await getTranslations("cobro");

  const [cobro] = await getDb()
    .select({
      id: cobrosSolicitados.id,
      referencia: cobrosSolicitados.referencia,
      montoCentavos: cobrosSolicitados.montoCentavos,
      moneda: cobrosSolicitados.moneda,
      estado: cobrosSolicitados.estado,
      concepto: cobrosSolicitados.concepto,
      venceEn: cobrosSolicitados.venceEn,
      pagadoEn: cobrosSolicitados.pagadoEn,
      tiendaId: cobrosSolicitados.tiendaId,
      comercio: tiendas.nombre,
    })
    .from(cobrosSolicitados)
    .innerJoin(tiendas, eq(tiendas.id, cobrosSolicitados.tiendaId))
    .where(eq(cobrosSolicitados.enlace, enlace))
    .limit(1);

  /* Un enlace que no existe da 404, no un «no encontrado» explicado: así no se
     puede saber si un enlace inventado casi acierta. */
  if (!cobro) notFound();

  /**
   * EL RESPALDO DEL WEBHOOK, igual que en los pedidos.
   *
   * Stripe redirige de vuelta aquí con `?payment_intent=pi_…`. Si el aviso de
   * Stripe no llegó —pasa—, sin esto el cobro se quedaba «abierto» para
   * siempre: el pagador ya pagó, y el sistema del comercio preguntando por su
   * factura jamás la vería pagada. El momento en que esto importa es justo
   * cuando la persona está mirando la pantalla.
   *
   * No hace falta cron: se le pregunta a Stripe aquí mismo. Y no se confía en
   * el parámetro — se confía en lo que Stripe responda de ese intento, y solo
   * si su metadata apunta a ESTE cobro: con el id de otro intento pegado en la
   * dirección, la comprobación no encuentra nada que acreditar.
   */
  if (cobro.estado === "abierto" && intentoDeVuelta?.startsWith("pi_")) {
    try {
      const { getStripe, stripeConfigurado } = await import("@/lib/stripe");
      if (stripeConfigurado()) {
        const intento =
          await getStripe().paymentIntents.retrieve(intentoDeVuelta);
        if (
          intento.status === "succeeded" &&
          intento.metadata?.cobroId === cobro.id
        ) {
          const { acreditarCobro } = await import("@/lib/cobros/acciones");
          await acreditarCobro(cobro.id, intento.id);
          cobro.estado = "pagado";
          cobro.pagadoEn = new Date();
        }
      }
    } catch (fallo) {
      /* Si Stripe no contesta, la página se enseña igual: el webhook sigue
         siendo el camino principal y esto es solo el respaldo. */
      console.error("[cobro] no se pudo conciliar al volver:", fallo);
    }
  }

  const ahora = new Date();
  const estado = estadoParaMostrar(cobro.estado, cobro.venceEn, ahora);
  const pagable = sePuedePagar(cobro.estado, cobro.venceEn, ahora);

  /**
   * ¿ZELLE, Y CON QUÉ CONCEPTO? Se decide EN EL SERVIDOR, con la configuración
   * de la tienda y el mínimo del panel. La página solo dibuja lo que ya se
   * decidió — el candado de verdad está en la acción que recibe la captura.
   */
  let zelle: { receptor: string; concepto: string } | null = null;
  let enRevision = false;
  if (pagable) {
    const { zelleDelCobro, comprobantePendienteDeCobro } =
      await import("@/lib/cobros/consultas");
    const { conceptoDelPago } = await import("@/lib/pedidos/concepto");
    const decision = await zelleDelCobro(cobro.tiendaId, cobro.montoCentavos);
    const concepto = conceptoDelPago(cobro.referencia);
    if (decision.disponible && concepto) {
      zelle = { receptor: decision.receptor, concepto };
    }
    enRevision = await comprobantePendienteDeCobro(cobro.id).catch(() => false);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="rounded-2xl border border-borde bg-white p-6 shadow-sm sm:p-8">
        <p className="flex items-center gap-2 text-sm text-tinta-suave">
          <Store className="h-4 w-4" aria-hidden />
          {cobro.comercio}
        </p>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          {t("titulo")}
        </h1>

        <p className="mt-6 text-4xl font-extrabold tabular-nums">
          {formatearPrecio(cobro.montoCentavos, idioma, cobro.moneda)}
        </p>

        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-suave">{t("referencia")}</dt>
            <dd className="font-medium">{cobro.referencia}</dd>
          </div>
          {cobro.concepto ? (
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-suave">{t("concepto")}</dt>
              <dd className="text-right font-medium">{cobro.concepto}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6">
          {estado === "pagado" ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
              {t("yaPagado", {
                fecha:
                  (cobro.pagadoEn && fechaCorta(cobro.pagadoEn, idioma)) || "",
              })}
            </p>
          ) : estado === "vencido" ? (
            /* Vencer no pierde la venta: se le dice que pida otro y sale otro
               correo al instante. Un «caducado» a secas deja a la persona sin
               saber qué hacer y con la compra a medias. */
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">{t("vencido")}</p>
              <p className="mt-1">{t("vencidoQueHacer")}</p>
            </div>
          ) : estado === "cancelado" ? (
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              {t("cancelado")}
            </p>
          ) : enRevision ? (
            /* Con una captura esperando al validador no se ofrece pagar otra
               vez: lo que toca es esperar, y se dice cuánto. */
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
              {t("zEnRevision")}
            </p>
          ) : (
            <MetodosDeCobro
              enlace={enlace}
              montoTexto={formatearPrecio(
                cobro.montoCentavos,
                idioma,
                cobro.moneda,
              )}
              zelle={zelle}
            />
          )}
        </div>

        {pagable && cobro.venceEn ? (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-tinta-suave">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {t("vence", { fecha: fechaCorta(cobro.venceEn, idioma) ?? "" })}
          </p>
        ) : null}
      </div>

      <p className="mt-4 px-2 text-center text-xs text-tinta-suave">
        {t("quienCobra", { comercio: cobro.comercio })}
      </p>
    </main>
  );
}
