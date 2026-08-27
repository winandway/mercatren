import { eq } from "drizzle-orm";
import { CheckCircle2, Clock, Store } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AvisoNavegador } from "@/components/cobro/aviso-navegador";
import { MetodosDeCobro } from "@/components/cobro/metodos-de-cobro";
import { aceptaMetodo } from "@/lib/cobros/reparto";
import { comoSePago } from "@/lib/cobros/como-se-pago";
import { estadoParaMostrar, sePuedePagar } from "@/lib/cobros/reglas";
import { queSeEnsena } from "@/lib/cobros/presentacion";
import { getDb } from "@/lib/db";
import { cobrosCadena, cobrosSolicitados, tiendas } from "@/lib/db/schema";
import { formatearPrecio, type Idioma } from "@/lib/dinero";
import { fechaCorta } from "@/lib/fechas";
import {
  abiertoDentroDeUnaApp,
  appQueLoAbrio,
} from "@/lib/navegador/dentro-de-app";
import { SITIO } from "@/lib/sitio";

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
      /* Para deducir con qué se pagó: un `pi_`/`ch_` es Stripe. */
      pagoId: cobrosSolicitados.pagoId,
      tiendaId: cobrosSolicitados.tiendaId,
      comercio: tiendas.nombre,
      /* El modo vive en una tabla aparte y casi ningún cobro la tiene: por eso
         `leftJoin`. Sin fila = modo de siempre, que es lo correcto para los
         cientos de cobros que ya existen. */
      modo: cobrosCadena.modo,
    })
    .from(cobrosSolicitados)
    .innerJoin(tiendas, eq(tiendas.id, cobrosSolicitados.tiendaId))
    .leftJoin(cobrosCadena, eq(cobrosCadena.cobroId, cobrosSolicitados.id))
    .where(eq(cobrosSolicitados.enlace, enlace))
    .limit(1);

  /* Un enlace que no existe da 404, no un «no encontrado» explicado: así no se
     puede saber si un enlace inventado casi acierta. */
  if (!cobro) notFound();

  /* Qué nombre se enseña. Se decide ANTES de dibujar nada: así el nombre del
     comercio no llega al navegador ni escondido en el HTML de la página. */
  const presentacion = queSeEnsena(cobro.modo, cobro.comercio);

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
  /* El desglose del cobro, si lo lleva. En su propio `catch`: la tabla es
     nueva y una base que todavía no la tenga no puede tumbar una página donde
     alguien está a punto de pagar. */
  const { cargosCobro } = await import("@/lib/db/schema");
  const cargos = await getDb()
    .select({
      id: cargosCobro.id,
      tipo: cargosCobro.tipo,
      concepto: cargosCobro.concepto,
      montoCentavos: cargosCobro.montoCentavos,
    })
    .from(cargosCobro)
    .where(eq(cargosCobro.cobroId, cobro.id))
    .catch(() => []);

  /**
   * ¿SE LE CORRIGIÓ EL MONTO A ESTE COBRO?
   *
   * ══ POR QUÉ SE LE ENSEÑA A QUIEN PAGÓ (27 ago 2026) ══
   *
   * Un cobro de $2.774,04 recibió una transferencia de $500,00 porque quien
   * pagaba se equivocó de monto. Se le acredita al comercio lo que entró y sale
   * un correo diciéndolo — pero ese correo no sirve si termina en «confía en
   * nosotros». Aquí ve **su propia captura**, la que él mismo mandó, y los dos
   * montos al lado.
   *
   * La captura se abre con `?cobro=<enlace>`: el permiso lo da el mismo secreto
   * que ya tiene en su correo, no una sesión. Ver `esSuPropioComprobante` en la
   * ruta de `/media`.
   *
   * En su propio `catch`: la tabla es nueva y una base que todavía no la tenga
   * no puede tumbar la página donde alguien está a punto de pagar.
   */
  const correccion = await (async () => {
    try {
      const { correccionesPago, cobrosZelle, pagosZelle } =
        await import("@/lib/db/schema");
      const [fila] = await getDb()
        .select({
          montoDeclaradoCentavos: correccionesPago.montoDeclaradoCentavos,
          montoRealCentavos: correccionesPago.montoRealCentavos,
          reciboUrl: pagosZelle.reciboUrl,
          estadoPago: pagosZelle.estado,
        })
        .from(correccionesPago)
        .innerJoin(pagosZelle, eq(pagosZelle.id, correccionesPago.pagoZelleId))
        .innerJoin(cobrosZelle, eq(cobrosZelle.pagoZelleId, pagosZelle.id))
        .where(eq(cobrosZelle.cobroId, cobro.id))
        .limit(1);
      /* Solo si el pago se APROBÓ. Un monto corregido que todavía nadie
         revisó no es un hecho: enseñarlo haría creer que ya se resolvió. */
      return fila && fila.estadoPago === "aprobado" ? fila : null;
    } catch {
      return null;
    }
  })();

  /**
   * ¿SE ABRIÓ DESDE WHATSAPP?
   *
   * Ahí dentro **el pago con la cuenta del banco no aparece**, y no es un
   * fallo: un navegador dentro de una app no puede abrir la ventana del banco
   * para identificarse, así que Stripe directamente no ofrece ese método.
   *
   * Sin avisar, el comercio manda el enlace, quien paga no ve los bancos, y
   * nadie entiende por qué — desde nuestro lado la página se ve perfecta.
   */
  const { headers } = await import("next/headers");
  const ua = (await headers()).get("user-agent");
  const dentroDeApp = abiertoDentroDeUnaApp(ua);
  const urlDelCobro = `${SITIO.url}/${locale}/cobro/${enlace}`;
  const nombreApp = appQueLoAbrio(ua);

  /* CÓMO SE PAGÓ, para el aviso de «ya está pagada». Solo se consulta si
     hace falta: en un cobro abierto esta pregunta no tiene sentido. */
  const metodoDelPago =
    cobro.estado === "pagado"
      ? await (async () => {
          const { cobrosZelle } = await import("@/lib/db/schema");
          const [z] = await getDb()
            .select({ id: cobrosZelle.cobroId })
            .from(cobrosZelle)
            .where(eq(cobrosZelle.cobroId, cobro.id))
            .limit(1)
            .catch(() => []);
          return comoSePago({ pagoId: cobro.pagoId, tieneZelle: Boolean(z) });
        })()
      : "desconocido";

  let zelle: {
    receptor: string;
    concepto: string;
    nombreReceptor: string | null;
  } | null = null;
  let transferencia: {
    datos: import("@/lib/cobros/transferencia").DatosDeTransferencia;
    concepto: string;
  } | null = null;
  let enRevision = false;

  /**
   * QUÉ MÉTODOS ACEPTA ESTE COBRO.
   *
   * El comercio lo eligió al crearlo: si calculó su factura para cobrar por
   * transferencia, dejar la tarjeta abierta le regala el 2,9% + $0.30 a
   * Stripe. **Sin filas se aceptan todos**, que es como se comportan los
   * cobros creados antes de que esto existiera.
   */
  /* Si esta factura se cobra en partes, cuál es esta. Sin fila es un cobro
     normal, que es lo que han sido siempre. */
  const { partesDelCobro } = await import("@/lib/db/schema");
  const [parte] = await getDb()
    .select({
      numero: partesDelCobro.numero,
      total: partesDelCobro.total,
      totalFacturaCentavos: partesDelCobro.totalFacturaCentavos,
    })
    .from(partesDelCobro)
    .where(eq(partesDelCobro.cobroId, cobro.id))
    .limit(1)
    .catch(() => []);

  const { metodosDelCobro } = await import("@/lib/db/schema");
  const metodosAceptados = await getDb()
    .select({ metodo: metodosDelCobro.metodo })
    .from(metodosDelCobro)
    .where(eq(metodosDelCobro.cobroId, cobro.id))
    .then((f) => f.map((x) => x.metodo))
    .catch(() => [] as string[]);

  if (pagable) {
    const { zelleDelCobro, comprobantePendienteDeCobro } =
      await import("@/lib/cobros/consultas");
    const { conceptoDelPago } = await import("@/lib/pedidos/concepto");
    const decision = await zelleDelCobro(cobro.tiendaId, cobro.montoCentavos);
    const concepto = conceptoDelPago(cobro.referencia);
    if (decision.disponible && concepto) {
      /* EL NOMBRE DEL TITULAR, no solo el correo.
         Al mandar un Zelle, el banco enseña a nombre de quién está la cuenta
         ANTES de confirmar. Si ahí sale un nombre que quien paga no reconoce,
         cancela — y con razón. La variable existía y se usaba en la página del
         pedido, pero aquí no se pasaba. */
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const nombreReceptor =
        getCloudflareContext().env.ZELLE_NOMBRE_RECEPTOR ?? null;
      zelle = { receptor: decision.receptor, concepto, nombreReceptor };
    }
    if (!aceptaMetodo(metodosAceptados, "zelle")) zelle = null;

    /* ══ LA TRANSFERENCIA ACH DIRECTA (26 ago 2026) ══

       Una factura de siete mil dólares con tarjeta deja más de $200 en
       comisiones del procesador; por ACH a la cuenta de Mercatren LLC, cero.
       Los datos salen de las variables del entorno —el código no tiene ni un
       número de cuenta escrito— y si falta cualquiera de los cuatro, el
       método no se ofrece: media instrucción bancaria manda el dinero a otra
       parte o lo deja sin salir.

       Se cobra por el mismo mínimo que Zelle porque cuesta lo mismo: las dos
       las valida una persona contra el banco. */
    if (concepto) {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const { decidirTransferencia } =
        await import("@/lib/cobros/transferencia");
      const { env } = getCloudflareContext();
      const { ZELLE_MINIMO_CENTAVOS } = await import("@/lib/dinero");
      const minimo = decision.disponible
        ? decision.minimoCentavos
        : ZELLE_MINIMO_CENTAVOS;
      const posible = decidirTransferencia(
        {
          beneficiario: env.PAGO_BENEFICIARIO,
          banco: env.PAGO_BANCO,
          cuenta: env.PAGO_CUENTA,
          rutaAch: env.PAGO_RUTA_ACH,
        },
        cobro.montoCentavos,
        minimo,
      );
      if (
        posible.disponible &&
        aceptaMetodo(metodosAceptados, "transferencia")
      ) {
        transferencia = { datos: posible.datos, concepto };
      }
    }

    enRevision = await comprobantePendienteDeCobro(cobro.id).catch(() => false);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="rounded-2xl border border-borde bg-white p-6 shadow-sm sm:p-8">
        {/**
         * EL NOMBRE DEL COMERCIO NO SIEMPRE SALE.
         *
         * Cuando quien paga no conoce al comercio —le compró a otro que a su
         * vez le compra a este— nombrarlo le enseña un negocio ajeno. Solo se
         * ve Mercatren, que es quien cobra y quien factura. La decisión vive
         * en `cobros/presentacion.ts`, con sus pruebas.
         */}
        {presentacion.comercio ? (
          <p className="flex items-center gap-2 text-sm text-tinta-suave">
            <Store className="h-4 w-4" aria-hidden />
            {presentacion.comercio}
          </p>
        ) : null}

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          {t("titulo")}
        </h1>

        {/* ══ QUÉ PARTE ES, SI LA FACTURA SE COBRA EN ABONOS ══

            Sin esto, quien recibe el segundo enlace ve un monto que no es el
            de su factura y no entiende qué está pagando — o cree que le
            cobran dos veces. Se dice antes del monto, que es lo primero que
            mira. */}
        {parte && parte.total > 1 ? (
          <p className="text-carga-700 mt-6 inline-flex items-center gap-2 rounded-full bg-carga-500/10 px-3 py-1.5 text-sm font-bold">
            {t("parteDe", { n: parte.numero, total: parte.total })}
          </p>
        ) : null}

        <p className="mt-2 text-4xl font-extrabold tabular-nums">
          {formatearPrecio(cobro.montoCentavos, idioma, cobro.moneda)}
        </p>

        {parte && parte.total > 1 ? (
          <p className="mt-1 text-sm text-tinta-suave">
            {t("deUnTotalDe", {
              monto: formatearPrecio(
                parte.totalFacturaCentavos,
                idioma,
                cobro.moneda,
              ),
            })}
          </p>
        ) : null}

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

          {/**
           * EL DESGLOSE, CUANDO HAY FLETE O MANEJO.
           *
           * Quien paga tiene que leer «mercancía $540 · flete $40 · manejo
           * $20» y no un $600 sin explicar. Un cargo que aparece sin decir qué
           * es, es la primera línea de un contracargo — y aquí quien paga
           * muchas veces NO es quien compró, así que ni siquiera estuvo en el
           * mostrador cuando se acordó el precio.
           */}
          {cargos.length > 0 ? (
            <>
              <div className="flex justify-between gap-3 border-t border-borde/60 pt-2">
                <dt className="text-tinta-suave">{t("mercancia")}</dt>
                <dd className="font-medium tabular-nums">
                  {formatearPrecio(
                    cobro.montoCentavos -
                      cargos.reduce((s, c) => s + c.montoCentavos, 0),
                    idioma,
                    cobro.moneda,
                  )}
                </dd>
              </div>
              {cargos.map((c) => (
                <div key={c.id} className="flex justify-between gap-3">
                  <dt className="text-tinta-suave">
                    {t(c.tipo === "flete" ? "flete" : "manejo")}
                    {c.concepto ? (
                      <span className="block text-xs">{c.concepto}</span>
                    ) : null}
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {formatearPrecio(c.montoCentavos, idioma, cobro.moneda)}
                  </dd>
                </div>
              ))}
            </>
          ) : null}
        </dl>

        {/**
         * EL AVISO DE «ÁBRELO EN EL NAVEGADOR».
         *
         * Va ANTES de los métodos, no después: quien ya eligió tarjeta porque
         * era lo único que veía, no vuelve a subir a leer un aviso.
         *
         * No se puede sacar la página del webview por código —eso lo decide la
         * app—, así que lo único útil es decirlo y dejar el enlace a un toque.
         */}
        {dentroDeApp && estado === "abierto" ? (
          <AvisoNavegador url={urlDelCobro} app={nombreApp} />
        ) : null}

        {/* EL MONTO SE CORRIGIÓ: los dos números y la captura, arriba del todo.
            Quien abre esto después de que le dijeran que su pago no cubrió la
            factura viene con una pregunta: «¿cuánto llegó de verdad?». Se
            contesta antes que nada, y con la prueba al lado. */}
        {correccion ? (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-base font-extrabold text-amber-900">
              {t("corregidoTitulo")}
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-amber-900">{t("corregidoFactura")}</dt>
                <dd className="font-semibold text-amber-900 tabular-nums">
                  {formatearPrecio(
                    correccion.montoDeclaradoCentavos,
                    idioma,
                    cobro.moneda,
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-amber-900">{t("corregidoRecibido")}</dt>
                <dd className="font-extrabold text-amber-900 tabular-nums">
                  {formatearPrecio(
                    correccion.montoRealCentavos,
                    idioma,
                    cobro.moneda,
                  )}
                </dd>
              </div>
              {correccion.montoRealCentavos <
              correccion.montoDeclaradoCentavos ? (
                <div className="flex justify-between gap-3 border-t border-amber-300 pt-1.5">
                  <dt className="font-bold text-amber-900">
                    {t("corregidoFalta")}
                  </dt>
                  <dd className="font-extrabold text-amber-900 tabular-nums">
                    {formatearPrecio(
                      correccion.montoDeclaradoCentavos -
                        correccion.montoRealCentavos,
                      idioma,
                      cobro.moneda,
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>

            {/* LA CAPTURA, no una promesa de que existe. El permiso lo da el
                mismo enlace secreto que trae en su correo. */}
            {correccion.reciboUrl ? (
              <div className="mt-3">
                <p className="text-xs font-semibold text-amber-900">
                  {t("corregidoLaCaptura")}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${correccion.reciboUrl}?cobro=${enlace}`}
                  alt={t("corregidoLaCaptura")}
                  className="mt-2 w-full max-w-sm rounded-lg border border-amber-300 bg-white"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6">
          {estado === "pagado" ? (
            /**
             * ESTE COBRO ESTÁ CERRADO, Y SE DICE CON TODAS LAS LETRAS.
             *
             * Lo pidió el dueño con el caso exacto: el comercio le hace varios
             * cobros al mismo cliente, alguien vuelve a abrir un enlace y no
             * sabe si ese ya se pagó. Un aviso de una línea no basta — hace
             * falta el monto, el método y la fecha, que es lo que se compara
             * contra el extracto del banco.
             *
             * Y en verde, grande y arriba del todo: quien abre esto quiere
             * saber en un golpe de vista si tiene que pagar o no.
             */
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-base font-extrabold text-emerald-900">
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                {t("pagadaTitulo", {
                  monto: formatearPrecio(
                    cobro.montoCentavos,
                    idioma,
                    cobro.moneda,
                  ),
                })}
              </p>
              <dl className="mt-2 space-y-1 text-sm text-emerald-900">
                <div className="flex justify-between gap-3">
                  <dt>{t("pagadaMetodo")}</dt>
                  <dd className="font-semibold">
                    {t(`pagadaCon.${metodoDelPago}` as never)}
                  </dd>
                </div>
                {cobro.pagadoEn ? (
                  <div className="flex justify-between gap-3">
                    <dt>{t("pagadaFecha")}</dt>
                    <dd className="font-semibold">
                      {fechaCorta(cobro.pagadoEn, idioma)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <dt>{t("referencia")}</dt>
                  <dd className="font-mono font-semibold">
                    {cobro.referencia}
                  </dd>
                </div>
              </dl>
              {/* Que no quede duda de que no hay nada más que hacer aquí. */}
              <p className="mt-2 text-xs text-emerald-800">
                {t("pagadaCerrada")}
              </p>
            </div>
          ) : estado === "vencido" ? (
            /* Vencer no pierde la venta: se le dice que pida otro y sale otro
               correo al instante. Un «caducado» a secas deja a la persona sin
               saber qué hacer y con la compra a medias. */
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">{t("vencido")}</p>
              <p className="mt-1">{t("vencidoQueHacer")}</p>
            </div>
          ) : estado === "devuelto" ? (
            /* Devuelto: se le dice a quien pagó que su dinero ya va de vuelta.
               Sin esto, abre el enlace, ve «cancelado» o nada, y llama al
               banco — que es como empieza un contracargo sobre un dinero que
               ya se le devolvió. */
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <p className="font-semibold">{t("devuelto")}</p>
              <p className="mt-1">{t("devueltoQueHacer")}</p>
            </div>
          ) : estado === "cancelado" ? (
            /**
             * UN COBRO CANCELADO NO ENSEÑA EL FORMULARIO DE PAGO, Y EL TEXTO
             * CAMBIA SEGÚN SI SE PUEDE NOMBRAR AL COMERCIO.
             *
             * `presentacion.comercio` ya viene en `null` cuando el cobro se
             * creó en modo sin nombre, así que aquí no hace falta volver a
             * decidir nada: se nombra si hay a quién nombrar, y si no, no.
             *
             * Eso no es cosmético. Ese enlace le llega al cliente de una
             * ferretería que revende: si ahí aparece quién le surte, le compra
             * directo y la ferretería pierde a su cliente. Es la razón entera
             * de que ese modo exista, y filtrarlo justo al cancelar rompería
             * todo lo demás.
             *
             * Y EL MOTIVO NO SALE AQUÍ NUNCA. Lo escribe una persona y puede
             * nombrar al comercio; vive en otra tabla que esta consulta ni
             * siquiera trae, así que no se puede filtrar por descuido.
             */
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold">
                {presentacion.comercio
                  ? t("canceladoPorComercio", {
                      comercio: presentacion.comercio,
                    })
                  : t("cancelado")}
              </p>
              <p className="mt-1">{t("canceladoQueHacer")}</p>
            </div>
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
              transferencia={transferencia}
              aceptaTarjeta={aceptaMetodo(metodosAceptados, "tarjeta")}
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
        {presentacion.nombrarEnElPie
          ? t("quienCobra", { comercio: cobro.comercio })
          : t("quienCobraSolo")}
      </p>
    </main>
  );
}
