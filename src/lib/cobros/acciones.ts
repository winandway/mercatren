"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { idDeRegistro, revisar } from "@/lib/validacion/acciones";
import { sePuedePagar, type EstadoCobro } from "@/lib/cobros/reglas";
import { getDb } from "@/lib/db";
import {
  billeteras,
  cobrosSolicitados,
  movimientosBilletera,
  tiendas,
} from "@/lib/db/schema";
import { calcularComisionCentavos, COMISION_TARJETA_PB } from "@/lib/dinero";
import { getStripe, stripeConfigurado } from "@/lib/stripe";
import { sufijoDelExtracto } from "@/lib/pagos/descriptor";

/**
 * PAGAR UN COBRO PEDIDO POR UN COMERCIO.
 *
 * ══ POR QUÉ NO SE REUSA `crearIntentoDePago` ══
 *
 * Ese exige sesión y un pedido con renglones de catálogo. Aquí no hay ni una
 * cosa ni la otra: la venta ya ocurrió en el mostrador del comercio, y quien
 * paga muchas veces ni siquiera es su cliente — es su hijo en Estados Unidos,
 * a quien le reenviaron el correo. Pedirle que se registre antes de pagar es
 * justo el paso donde se pierde la venta.
 *
 * El secreto del enlace es lo que autoriza. Es de 24 bytes al azar y solo
 * viaja en ese correo.
 */

export type IntentoDeCobro =
  | { ok: true; clientSecret: string; clavePublica: string }
  | { ok: false; motivo: "sin_configurar" | "no_pagable" | "no_existe" };

export async function intentoParaCobro(
  enlace: string,
): Promise<IntentoDeCobro> {
  if (!stripeConfigurado()) return { ok: false, motivo: "sin_configurar" };

  /* El enlace llega por la dirección del navegador y es lo único que protege
     este cobro: se comprueba su forma antes de buscarlo. */
  const revisado = revisar(idDeRegistro, enlace);
  if (!revisado.ok) return { ok: false, motivo: "no_existe" };
  enlace = revisado.datos;

  const db = getDb();

  const [cobro] = await db
    .select({
      id: cobrosSolicitados.id,
      montoCentavos: cobrosSolicitados.montoCentavos,
      estado: cobrosSolicitados.estado,
      venceEn: cobrosSolicitados.venceEn,
      referencia: cobrosSolicitados.referencia,
      tiendaId: cobrosSolicitados.tiendaId,
    })
    .from(cobrosSolicitados)
    .where(eq(cobrosSolicitados.enlace, enlace))
    .limit(1);

  if (!cobro) return { ok: false, motivo: "no_existe" };

  /* El vencimiento se comprueba AQUÍ, contra el reloj, y no confiando en el
     estado guardado. Un enlace caducado que siga cobrando es cobrarle a
     alguien por una venta que el comercio ya dio por perdida. */
  if (!sePuedePagar(cobro.estado as EstadoCobro, cobro.venceEn, new Date())) {
    return { ok: false, motivo: "no_pagable" };
  }

  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();

  const intento = await getStripe().paymentIntents.create({
    amount: cobro.montoCentavos,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { cobroId: cobro.id, referencia: cobro.referencia },
    description: `Mercatren · ${cobro.referencia}`,
    /* Lo que ve en su estado de cuenta, junto al prefijo de la cuenta. Va la
       referencia de la factura del comercio: quien paga suele ser un familiar
       en Estados Unidos, y semanas después es lo único que le permite atar ese
       cargo a la compra que le pidieron. La referencia la escribe una persona
       en un mostrador, así que se limpia antes: con un acento o una comilla
       dentro, Stripe rechaza el cobro completo. */
    statement_descriptor_suffix: sufijoDelExtracto(cobro.referencia),
  });

  if (!intento.client_secret) return { ok: false, motivo: "no_pagable" };

  /**
   * AQUÍ NO SE ESCRIBE EN `pagos`, Y NO ES UN OLVIDO.
   *
   * `pagos.pedido_id` tiene llave foránea contra `pedidos`, y un cobro por
   * enlace NO es un pedido: el insert revienta con FOREIGN KEY constraint
   * failed — probado contra la base el 15 ago 2026 — y le tumbaba la pantalla
   * de pago al pagador en el momento exacto de meter la tarjeta.
   *
   * El rastro del cobro no se pierde: el intento (`pi_…`) queda guardado en
   * `cobros_solicitados.pago_id` al acreditarse, que es donde este dinero se
   * consulta de verdad.
   */
  return {
    ok: true,
    clientSecret: intento.client_secret,
    clavePublica: env.STRIPE_CLAVE_PUBLICA!,
  };
}

/**
 * ACREDITAR UN COBRO QUE YA SE PAGÓ.
 *
 * Lo llama el webhook de Stripe cuando el intento trae `cobroId` en su
 * metadata, y también la propia página cuando el comprador vuelve — el mismo
 * respaldo que los pedidos, por si el aviso de Stripe no llega.
 *
 * ══ ES IDEMPOTENTE ══
 *
 * El cobro solo se toca si sigue `abierto`, y ese estado va DENTRO del WHERE.
 * Si el webhook y el respaldo entran a la vez, uno de los dos no encuentra
 * nada que hacer y se va sin mover un centavo.
 */
export async function acreditarCobro(
  cobroId: string,
  intentoId: string,
): Promise<void> {
  const db = getDb();
  const ahora = new Date();

  /* El estado va DENTRO del WHERE, y esa condición ES el candado: Stripe
     reintenta los webhooks, y el respaldo de la página puede entrar a la vez.
     El segundo en llegar actualiza cero filas y se va sin acreditar nada — un
     reintento que acreditara otra vez sería dinero duplicado en la billetera
     del comercio. */
  const marcado = await db
    .update(cobrosSolicitados)
    .set({ estado: "pagado", pagadoEn: ahora, pagoId: intentoId })
    .where(
      and(
        eq(cobrosSolicitados.id, cobroId),
        eq(cobrosSolicitados.estado, "abierto"),
      ),
    )
    .returning({
      tiendaId: cobrosSolicitados.tiendaId,
      montoCentavos: cobrosSolicitados.montoCentavos,
      referencia: cobrosSolicitados.referencia,
      contactoCorreo: cobrosSolicitados.contactoCorreo,
      contactoNombre: cobrosSolicitados.contactoNombre,
    });

  const cobro = marcado[0];
  if (!cobro) return;

  /* Al comercio le toca el neto: el monto menos el margen de Mercatren. El
     costo del procesador ya está dentro de lo que cobró Stripe. */
  const comision = calcularComisionCentavos(
    cobro.montoCentavos,
    COMISION_TARJETA_PB,
  );
  const neto = cobro.montoCentavos - comision;

  let [billetera] = await db
    .select({ id: billeteras.id, saldoCentavos: billeteras.saldoCentavos })
    .from(billeteras)
    .where(eq(billeteras.tiendaId, cobro.tiendaId))
    .limit(1);

  /* Sin billetera se CREA, no se salta: saltarla dejaba el cobro pagado sin
     su movimiento, y ese movimiento es de donde la posición del comercio lee
     el neto exacto. Un dinero cobrado que no aparece en ninguna pantalla es
     el fallo más caro de todos. */
  if (!billetera) {
    billetera = { id: `billetera-${nanoid(10)}`, saldoCentavos: 0 };
    await db
      .insert(billeteras)
      .values({ id: billetera.id, tiendaId: cobro.tiendaId })
      .catch(() => undefined);
  }

  await db.insert(movimientosBilletera).values({
    id: `mov-${nanoid(12)}`,
    billeteraId: billetera.id,
    tipo: "recarga",
    montoCentavos: neto,
    saldoResultanteCentavos: billetera.saldoCentavos + neto,
    referencia: intentoId,
    nota: `Cobro por enlace · ${cobro.referencia}`,
    creadoEn: ahora,
  });

  /* Los tres avisos van en su propio try: si un correo falla, el cobro sigue
     acreditado. Un pago no se deshace porque un aviso no salió. */
  try {
    const [duenno] = await db
      .select({ propietarioId: tiendas.propietarioId, nombre: tiendas.nombre })
      .from(tiendas)
      .where(eq(tiendas.id, cobro.tiendaId))
      .limit(1);

    const correos = await import("@/lib/correo/correos");

    /* 1. Al comercio: le entró su dinero. */
    if (duenno?.propietarioId) {
      const { contactoDeUsuario } = await import("@/lib/correo/contactos");
      const contacto = await contactoDeUsuario(duenno.propietarioId);
      if (contacto) {
        await correos.correoVentaAcreditada(contacto, {
          montoCentavos: neto,
          referencia: cobro.referencia,
        });
      }
    }

    /* 2. Al pagador: su recibo. Semanas después, cuando vea el cargo en su
       estado de cuenta, este correo es lo que le recuerda qué pagó — y el
       primer paso de un contracargo es justamente no reconocer un cargo. */
    if (cobro.contactoCorreo) {
      await correos.correoReciboDeCobro(
        {
          email: cobro.contactoCorreo,
          name: cobro.contactoNombre ?? "",
          idioma: "es",
        },
        {
          comercio: duenno?.nombre ?? "",
          referencia: cobro.referencia,
          montoCentavos: cobro.montoCentavos,
        },
      );
    }

    /* 3. Al equipo: dinero que entró, igual que en cada venta con tarjeta. */
    await correos.correoAvisoAlEquipo({
      asunto: `Cobro por enlace pagado · ${cobro.referencia}`,
      lineas: [
        `${duenno?.nombre ?? cobro.tiendaId} cobró ${(cobro.montoCentavos / 100).toFixed(2)} USD por enlace (factura ${cobro.referencia}).`,
        `Neto acreditado al comercio: ${(neto / 100).toFixed(2)} USD.`,
      ],
      url: "https://mercatren.com/es/panel/cobros/enlaces",
      boton: "Ver los enlaces de cobro",
    });
  } catch (fallo) {
    console.error("[cobro] acreditado; el aviso no salio:", fallo);
  }
}
