import "server-only";

import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { getDb } from "@/lib/db";
import { disputas, pagos, pedidos } from "@/lib/db/schema";
import { formatearPrecio } from "@/lib/dinero";
import { SITIO } from "@/lib/sitio";
import { diasParaResponder, estadoDesdeStripe } from "@/lib/pagos/disputa";

/**
 * GUARDAR UN CONTRACARGO Y AVISAR EL MISMO DÍA.
 *
 * ══ LO QUE NO HACE, Y ES DELIBERADO ══
 *
 * **No le quita el saldo al comercio ni deshace la venta.** Quién asume ese
 * dinero es una decisión de negocio: puede tocarle a Mercatren, puede
 * negociarse con el comercio, y la disputa todavía se puede ganar. Un sistema
 * que revierte solo le quitaría a un comercio dinero que a lo mejor recupera
 * en dos semanas, y eso destruye la confianza mucho más rápido que el propio
 * contracargo.
 *
 * Lo que sí hace es que **se sepa hoy**, con el pedido enlazado y el plazo a
 * la vista. Antes de esto, un contracargo pasaba en silencio y solo se veía
 * mirando el extracto del banco.
 */
export async function registrarDisputa(disputa: Stripe.Dispute): Promise<void> {
  const db = getDb();
  const ahora = new Date();

  const intentoId =
    typeof disputa.payment_intent === "string"
      ? disputa.payment_intent
      : (disputa.payment_intent?.id ?? null);

  /* De qué pedido es. Se busca por el intento, que es lo que enlaza el cobro
     de Stripe con nuestra tabla de pagos. */
  const [pago] = intentoId
    ? await db
        .select({ pedidoId: pagos.pedidoId })
        .from(pagos)
        .where(eq(pagos.referenciaExterna, intentoId))
        .limit(1)
    : [];

  const estado = estadoDesdeStripe(disputa.status);
  const respondeHasta = disputa.evidence_details?.due_by
    ? new Date(disputa.evidence_details.due_by * 1000)
    : null;

  const fila = {
    intentoId,
    pedidoId: pago?.pedidoId ?? null,
    estado,
    montoCentavos: disputa.amount,
    moneda: (disputa.currency ?? "usd").toUpperCase(),
    motivo: disputa.reason ?? null,
    respondeHasta,
    actualizadoEn: ahora,
  };

  /* Stripe manda varios avisos de la misma disputa según avanza. Se inserta o
     se actualiza sobre el mismo id: así el panel enseña el estado de hoy y no
     una fila por cada paso. */
  await db
    .insert(disputas)
    .values({ id: disputa.id, ...fila, creadoEn: ahora })
    .onConflictDoUpdate({ target: disputas.id, set: fila });

  // El aviso nunca es requisito: la disputa queda guardada aunque no salga.
  try {
    const [pedido] = fila.pedidoId
      ? await db
          .select({ numero: pedidos.numero })
          .from(pedidos)
          .where(eq(pedidos.id, fila.pedidoId))
          .limit(1)
      : [];

    const dias = diasParaResponder(respondeHasta, ahora);
    const { correoAvisoAlEquipo } = await import("@/lib/correo/correos");

    await correoAvisoAlEquipo({
      asunto: `Contracargo en ${pedido?.numero ?? "un cobro con tarjeta"}`,
      lineas: [
        `Un comprador desconoció un cargo de ${formatearPrecio(disputa.amount, "es", fila.moneda)}.`,
        `Motivo que da el banco: ${disputa.reason ?? "sin especificar"}.`,
        dias === null
          ? "Stripe no dio fecha límite para responder."
          : `Quedan ${dias} días para mandar las pruebas.`,
        "Ese dinero ya salió de la cuenta. La venta NO se deshizo sola: hay que decidir qué se hace.",
      ],
      url: pedido
        ? `${SITIO.url}/es/panel/ordenes/${pedido.numero}`
        : `${SITIO.url}/es/panel/ordenes`,
      boton: "Ver el pedido",
    });
  } catch (fallo) {
    console.error("[disputa] guardada; el aviso no salio:", fallo);
  }
}
