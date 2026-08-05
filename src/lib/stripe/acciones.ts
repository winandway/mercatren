"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pagos, pedidos } from "@/lib/db/schema";
import { getStripe, stripeConfigurado } from "@/lib/stripe";

/**
 * El intento de pago con tarjeta de un pedido.
 *
 * SE REUTILIZA, NO SE DUPLICA. Si el cliente recarga la página o vuelve
 * mañana, se le devuelve el mismo intento en vez de crear uno nuevo: cada
 * intento suelto en Stripe es un cobro fantasma esperando confirmarse dos
 * veces. La referencia vive en la tabla `pagos`.
 *
 * EL MONTO SALE DEL PEDIDO EN LA BASE, jamás del navegador. Y el intento
 * guarda el pedido en su metadata: es lo que el webhook usa después para
 * saber qué acreditar.
 */
export type IntentoDePago =
  | { ok: true; clientSecret: string; clavePublica: string }
  | { ok: false; sinConfigurar?: boolean };

export async function crearIntentoDePago(
  numero: string,
): Promise<IntentoDePago> {
  if (!stripeConfigurado()) return { ok: false, sinConfigurar: true };

  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return { ok: false };

  const db = getDb();
  const { env } = getCloudflareContext();

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      totalCentavos: pedidos.totalCentavos,
      estado: pedidos.estado,
      clienteId: pedidos.clienteId,
      metodoPago: pedidos.metodoPago,
    })
    .from(pedidos)
    .where(eq(pedidos.numero, numero))
    .limit(1);

  // Solo el dueño del pedido, solo si sigue por pagar, solo si es de tarjeta.
  if (
    !pedido ||
    pedido.clienteId !== usuario.id ||
    pedido.estado !== "pendiente_pago" ||
    pedido.metodoPago !== "stripe" ||
    pedido.totalCentavos <= 0
  ) {
    return { ok: false };
  }

  const stripe = getStripe();

  // ¿Ya hay un intento vivo para este pedido? Se devuelve ese.
  const [previo] = await db
    .select({ referenciaExterna: pagos.referenciaExterna })
    .from(pagos)
    .where(
      and(
        eq(pagos.pedidoId, pedido.id),
        eq(pagos.metodo, "stripe"),
        eq(pagos.estado, "pendiente"),
      ),
    )
    .limit(1);

  if (previo?.referenciaExterna) {
    const intento = await stripe.paymentIntents
      .retrieve(previo.referenciaExterna)
      .catch(() => null);

    if (
      intento?.client_secret &&
      intento.amount === pedido.totalCentavos &&
      (intento.status === "requires_payment_method" ||
        intento.status === "requires_confirmation" ||
        intento.status === "requires_action")
    ) {
      return {
        ok: true,
        clientSecret: intento.client_secret,
        clavePublica: env.STRIPE_CLAVE_PUBLICA!,
      };
    }
  }

  const intento = await stripe.paymentIntents.create({
    amount: pedido.totalCentavos,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    // El webhook lee esto para saber qué pedido acreditar.
    metadata: { pedidoId: pedido.id, numero: pedido.numero },
    description: `Mercatren · ${pedido.numero}`,
  });

  if (!intento.client_secret) return { ok: false };

  await db.insert(pagos).values({
    id: `pago-${nanoid(12)}`,
    pedidoId: pedido.id,
    metodo: "stripe",
    estado: "pendiente",
    montoCentavos: pedido.totalCentavos,
    referenciaExterna: intento.id,
  });

  return {
    ok: true,
    clientSecret: intento.client_secret,
    clavePublica: env.STRIPE_CLAVE_PUBLICA!,
  };
}
