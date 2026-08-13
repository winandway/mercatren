"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { idDeRegistro, revisar } from "@/lib/validacion/acciones";
import { sePuedePagar, type EstadoCobro } from "@/lib/cobros/reglas";
import { getDb } from "@/lib/db";
import {
  billeteras,
  cobrosSolicitados,
  movimientosBilletera,
  pagos,
  tiendas,
} from "@/lib/db/schema";
import { calcularComisionCentavos, COMISION_TARJETA_PB } from "@/lib/dinero";
import { getStripe, stripeConfigurado } from "@/lib/stripe";

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
    /* Lo que ve en su estado de cuenta. Un cargo que no se reconoce se
       reclama, y cada contracargo cuesta la venta más $15 de multa. */
    statement_descriptor_suffix: "MERCATREN",
  });

  if (!intento.client_secret) return { ok: false, motivo: "no_pagable" };

  await db.insert(pagos).values({
    id: `pago-${nanoid(12)}`,
    pedidoId: cobro.id,
    metodo: "stripe",
    estado: "pendiente",
    montoCentavos: cobro.montoCentavos,
    referenciaExterna: intento.id,
  });

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

  const marcado = await db
    .update(cobrosSolicitados)
    .set({ estado: "pagado", pagadoEn: ahora, pagoId: intentoId })
    .where(eq(cobrosSolicitados.id, cobroId))
    .returning({
      tiendaId: cobrosSolicitados.tiendaId,
      montoCentavos: cobrosSolicitados.montoCentavos,
      referencia: cobrosSolicitados.referencia,
      estadoPrevio: cobrosSolicitados.estado,
    });

  const cobro = marcado[0];
  if (!cobro) return;

  await db
    .update(pagos)
    .set({ estado: "confirmado", actualizadoEn: ahora })
    .where(eq(pagos.referenciaExterna, intentoId));

  /* Al comercio le toca el neto: el monto menos el margen de Mercatren. El
     costo del procesador ya está dentro de lo que cobró Stripe. */
  const comision = calcularComisionCentavos(
    cobro.montoCentavos,
    COMISION_TARJETA_PB,
  );
  const neto = cobro.montoCentavos - comision;

  const [billetera] = await db
    .select({ id: billeteras.id, saldoCentavos: billeteras.saldoCentavos })
    .from(billeteras)
    .where(eq(billeteras.tiendaId, cobro.tiendaId))
    .limit(1);

  if (billetera) {
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
  }

  // Al comercio se le avisa; si el correo falla, el cobro sigue acreditado.
  try {
    const [duenno] = await db
      .select({ propietarioId: tiendas.propietarioId })
      .from(tiendas)
      .where(eq(tiendas.id, cobro.tiendaId))
      .limit(1);

    if (duenno?.propietarioId) {
      const { contactoDeUsuario } = await import("@/lib/correo/contactos");
      const contacto = await contactoDeUsuario(duenno.propietarioId);
      if (contacto) {
        const { correoVentaAcreditada } = await import("@/lib/correo/correos");
        await correoVentaAcreditada(contacto, {
          montoCentavos: neto,
          referencia: cobro.referencia,
        });
      }
    }
  } catch (fallo) {
    console.error("[cobro] acreditado; el aviso no salio:", fallo);
  }
}
