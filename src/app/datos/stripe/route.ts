import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";

import { getDb } from "@/lib/db";
import { pagos } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";
import { acreditarPagoConTarjeta } from "@/lib/stripe/acreditar";
import { montoDesdeStripe } from "@/lib/stripe/monedas";
import { anotarEnBitacora } from "@/lib/pagos/bitacora";

/**
 * El aviso de Stripe cuando un pago con tarjeta se completó.
 *
 * Va en /datos y no en /api porque en YaDominios Cloud ese prefijo lo
 * capturan los archivos estáticos antes de llegar al código.
 *
 * LA FIRMA SE VERIFICA SIEMPRE. Esta ruta acredita dinero: sin verificar la
 * firma, cualquiera que adivine la dirección podría "aprobar" pedidos con un
 * curl. Si el secreto del webhook no está configurado, la ruta no procesa
 * nada — apagada es inofensiva, abierta sería un agujero.
 *
 * ES IDEMPOTENTE. Stripe reintenta los avisos y puede mandar el mismo dos
 * veces: el pedido solo se acredita si sigue en "pendiente_pago" (el UPDATE
 * lleva el estado en el WHERE). El segundo aviso no encuentra nada que hacer.
 *
 * EL CORREO NUNCA ES REQUISITO: si el aviso al cliente o al comercio falla,
 * el pago queda acreditado igual. Un pago cobrado jamás se deshace porque
 * un correo no salió.
 */
export async function POST(peticion: Request) {
  const { env } = getCloudflareContext();

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("sin configurar", { status: 503 });
  }

  const firma = peticion.headers.get("stripe-signature");
  if (!firma) return new Response("sin firma", { status: 400 });

  const cuerpo = await peticion.text();
  const stripe = getStripe();

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(
      cuerpo,
      firma,
      env.STRIPE_WEBHOOK_SECRET,
      undefined,
      // En el runtime de Cloudflare la criptografía es la del navegador.
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return new Response("firma invalida", { status: 400 });
  }

  /* ══ EL PAGO FALLIDO SE ESCUCHA Y SE ANOTA (30 ago 2026) ══
     Hasta hoy este webhook solo procesaba el éxito: una tarjeta rebotada
     (fondos, banco, 3DS abandonado) no dejaba NINGÚN rastro y la pregunta
     «¿por qué no compró?» no tenía dónde mirarse. El motivo de Stripe queda
     entero en la bitácora del pedido. */
  if (evento.type === "payment_intent.payment_failed") {
    const intento = evento.data.object;
    const pedidoId = intento.metadata?.pedidoId;
    if (pedidoId) {
      const error = intento.last_payment_error;
      await anotarEnBitacora({
        pedidoId,
        metodo: "stripe",
        paso: "pago_fallido",
        detalle: [error?.code, error?.decline_code, error?.message]
          .filter(Boolean)
          .join(" · "),
      });
    }
  }

  if (evento.type === "payment_intent.succeeded") {
    const intento = evento.data.object;
    const pedidoId = intento.metadata?.pedidoId;
    if (pedidoId) {
      await anotarEnBitacora({
        pedidoId,
        metodo: "stripe",
        paso: "pago_confirmado",
        detalle: `${intento.id} · webhook`,
      });
      await acreditarPagoConTarjeta(
        pedidoId,
        intento.id,
        montoDesdeStripe(intento.amount, intento.currency),
      );
    }

    /* Los cobros que pide un comercio desde SU sistema traen `cobroId` en vez
       de `pedidoId`: no hay renglones de catálogo que descontar porque la
       venta ya ocurrió en su mostrador. Se acreditan igual. */
    const cobroId = intento.metadata?.cobroId;
    if (cobroId) {
      const { acreditarCobro } = await import("@/lib/cobros/acciones");
      await acreditarCobro(cobroId, intento.id);
    }
  }

  if (evento.type === "payment_intent.payment_failed") {
    const intento = evento.data.object;
    // El intento fallido se marca para que no se reutilice; el cliente puede
    // volver a intentar y se le crea uno nuevo.
    await getDb()
      .update(pagos)
      .set({ estado: "rechazado", actualizadoEn: new Date() })
      .where(
        and(
          eq(pagos.referenciaExterna, intento.id),
          eq(pagos.estado, "pendiente"),
        ),
      );
  }

  /**
   * LAS DEVOLUCIONES HECHAS DESDE EL PANEL DE STRIPE.
   *
   * Devolver desde `/panel/ordenes` ya deja el rastro escrito. Pero el botón de
   * devolver también está dentro de Stripe, y es el que uno pulsa cuando está
   * mirando la venta ahí. Sin este aviso, el dinero salía de la cuenta y en
   * Mercatren el pedido seguía diciendo «pagado»: el comercio con su venta
   * acreditada, el equipo con una entrega pendiente de despachar, y la factura
   * en pie. No se veía hasta cuadrar el mes.
   */
  if (evento.type === "charge.refunded") {
    const { registrarReembolsoExterno } =
      await import("@/lib/stripe/reembolso-externo");
    await registrarReembolsoExterno(evento.data.object);
  }

  /**
   * EL AVISO TEMPRANO DE FRAUDE.
   *
   * La red de la tarjeta nos dice que ese cargo fue reportado como fraude
   * ANTES de que se convierta en contracargo. Es la única ventana que hay para
   * devolver por decisión propia y evitar la disputa entera con su multa — y
   * sobre todo, para no despachar mercancía que ya se sabe que no se cobró.
   *
   * Solo avisa. Devolver o no es del equipo: hay avisos que no terminan en
   * nada, y devolver solo le quitaría al comercio una venta buena.
   */
  if (evento.type === "radar.early_fraud_warning.created") {
    try {
      const aviso = evento.data.object;
      const cargoId =
        typeof aviso.charge === "string" ? aviso.charge : aviso.charge.id;

      const { correoAvisoAlEquipo } = await import("@/lib/correo/correos");
      const { SITIO } = await import("@/lib/sitio");
      await correoAvisoAlEquipo({
        asunto: "Aviso temprano de fraude en un cobro con tarjeta",
        lineas: [
          `La red de la tarjeta reportó el cargo ${cargoId} como fraude. Motivo: ${aviso.fraud_type}.`,
          "Todavía NO es un contracargo, y esa es la diferencia: aún se puede devolver por decisión propia y evitar la disputa con su multa.",
          "Lo urgente es la mercancía: si todavía no salió, no la despaches hasta decidir.",
        ],
        url: `${SITIO.url}/es/panel/cobros`,
        boton: "Ver los cobros",
      });
    } catch (fallo) {
      /* Un correo que no sale nunca puede tumbar el aviso: si esta ruta
         devuelve error, Stripe reintenta y reprocesa TODO lo de arriba. */
      console.error("[stripe] aviso de fraude; el correo no salio:", fallo);
    }
  }

  /**
   * LOS CONTRACARGOS.
   *
   * Un comprador desconoce el cargo, el banco le devuelve el dinero
   * quitándolo de nuestra cuenta, y puede pasar hasta 120 días después de la
   * venta. Hasta hoy este aviso no se escuchaba: el dinero salía y nadie se
   * enteraba hasta mirar el extracto.
   *
   * Se escuchan los tres momentos —se abre, se actualiza y se cierra— sobre
   * la misma fila, para que el panel enseñe el estado de hoy.
   */
  if (
    evento.type === "charge.dispute.created" ||
    evento.type === "charge.dispute.updated" ||
    evento.type === "charge.dispute.closed"
  ) {
    const { registrarDisputa } = await import("@/lib/pagos/disputas-registro");
    await registrarDisputa(evento.data.object);
  }

  // A Stripe solo le importa el 200: con otra cosa, reintenta.
  return Response.json({ recibido: true });
}
