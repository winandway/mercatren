import "server-only";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type Stripe from "stripe";

import { getDb } from "@/lib/db";
import { hitosPedido, pagos, pedidos } from "@/lib/db/schema";

/**
 * UNA DEVOLUCION HECHA DESDE EL PANEL DE STRIPE, NO DESDE EL NUESTRO.
 *
 * ══ EL HUECO QUE ESTO TAPA (13 ago 2026) ══
 *
 * Devolver desde `/panel/ordenes` ya deja todo escrito: el pedido pasa a
 * `reembolsado` y el hito guarda quien lo autorizo. Pero devolver **desde
 * Stripe** es un boton que esta a la vista de cualquiera que entre ahi a mirar
 * una venta, y es lo primero que uno pulsa cuando esta dentro de Stripe.
 *
 * Hasta hoy eso no volvia: el dinero salia de la cuenta y en Mercatren el
 * pedido seguia diciendo «pagado». El comercio veia su venta acreditada, el
 * equipo veia una entrega pendiente de despachar, y la factura seguia en pie.
 * Nadie se enteraba hasta cuadrar el mes.
 *
 * ══ NO REVIERTE EL DINERO DEL COMERCIO, A PROPOSITO ══
 *
 * Misma regla que ya rige para las devoluciones del panel y para los
 * contracargos: quien asume una devolucion es una decision de negocio —puede
 * tocarle a Mercatren, puede negociarse—. El sistema deja constancia; no le
 * quita el dinero a nadie por su cuenta.
 *
 * ══ ES IDEMPOTENTE, Y NO PISA LO QUE HIZO UNA PERSONA ══
 *
 * Stripe reintenta sus avisos, y ademas una devolucion hecha desde NUESTRO
 * panel dispara este mismo evento. Por eso: si el pedido ya esta
 * `reembolsado`, no se hace nada; y el hito solo se anota si no hay ya uno de
 * devolucion. Anotarlo dos veces contaria dos devoluciones de un solo dinero.
 *
 * El hito que escribe esto va SIN AUTOR: no lo hizo nadie de este lado.
 */

/** Los hitos que ya dicen que este pedido tuvo una devolucion. */
const YA_DEVUELTO = ["reembolsado", "reembolso_parcial"];

export async function registrarReembolsoExterno(
  cargo: Stripe.Charge,
): Promise<void> {
  const intentoId =
    typeof cargo.payment_intent === "string"
      ? cargo.payment_intent
      : (cargo.payment_intent?.id ?? null);

  /* Sin el intento no hay forma de saber de que pedido habla. Un cargo suelto
     puede venir de cualquier sitio; no se adivina. */
  if (!intentoId) return;

  const db = getDb();

  const [cobro] = await db
    .select({ pedidoId: pagos.pedidoId })
    .from(pagos)
    .where(
      and(eq(pagos.referenciaExterna, intentoId), eq(pagos.metodo, "stripe")),
    )
    .limit(1);

  if (!cobro?.pedidoId) return;

  const [pedido] = await db
    .select({ id: pedidos.id, estado: pedidos.estado })
    .from(pedidos)
    .where(eq(pedidos.id, cobro.pedidoId))
    .limit(1);

  /* Puede no ser un pedido: los cobros por enlace guardan el id del cobro en
     esa misma columna. Ahi no hay mercancia ni estado que mover. */
  if (!pedido) return;
  if (pedido.estado === "reembolsado") return;

  const ahora = new Date();

  /**
   * COMPLETA O PARCIAL, LA DECIDE STRIPE Y NO NOSOTROS.
   *
   * `refunded` viene en true solo cuando se devolvio el cargo entero. Calcular
   * la diferencia contra el total del pedido daria distinto en cuanto haya un
   * ajuste de centavos, y el que manda es el cargo: es el dinero que de verdad
   * salio.
   */
  const devueltoTodo = cargo.refunded === true;

  if (devueltoTodo) {
    await db
      .update(pedidos)
      .set({ estado: "reembolsado", actualizadoEn: ahora })
      .where(
        /* El estado va en el WHERE: si dos avisos entran a la vez, el segundo
           no encuentra nada que hacer. */
        and(eq(pedidos.id, pedido.id), eq(pedidos.estado, pedido.estado)),
      );
  }

  const previos = await db
    .select({ hito: hitosPedido.hito })
    .from(hitosPedido)
    .where(eq(hitosPedido.pedidoId, pedido.id));

  if (previos.some((h) => YA_DEVUELTO.includes(h.hito))) return;

  await db.insert(hitosPedido).values({
    id: nanoid(),
    pedidoId: pedido.id,
    hito: devueltoTodo ? "reembolsado" : "reembolso_parcial",
    /* Sin autor: lo hizo alguien dentro de Stripe, y ponerle un nombre de aqui
       seria atribuirle a una persona algo que no hizo. */
    hechoPorId: null,
    hechoPorNombre: null,
    creadoEn: ahora,
  });
}
