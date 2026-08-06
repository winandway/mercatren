import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import Stripe from "stripe";

import { getDb } from "@/lib/db";
import {
  billeteras,
  itemsPedido,
  itemsVariante,
  movimientosBilletera,
  pagos,
  pedidos,
  productos,
  tiendas,
  user,
  variantesProducto,
} from "@/lib/db/schema";
import { COMISION_TARJETA_PB, calcularComisionCentavos } from "@/lib/dinero";
import { getStripe } from "@/lib/stripe";

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

  if (evento.type === "payment_intent.succeeded") {
    const intento = evento.data.object;
    const pedidoId = intento.metadata?.pedidoId;
    if (pedidoId) {
      await acreditarPagoConTarjeta(pedidoId, intento.id, intento.amount);
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

  // A Stripe solo le importa el 200: con otra cosa, reintenta.
  return Response.json({ recibido: true });
}

/**
 * La acreditación: el espejo con tarjeta de lo que hace aprobarPago con
 * Zelle, pero sin validador — aquí el banco ya confirmó el dinero.
 *
 * UN PEDIDO PUEDE MEZCLAR COMERCIOS: cada tienda recibe el subtotal de SUS
 * renglones menos el 2% de la tarjeta. El saldo se suma con una operación
 * relativa (saldo = saldo + X) para que dos avisos a la vez no se pisen.
 */
async function acreditarPagoConTarjeta(
  pedidoId: string,
  intentoId: string,
  montoCentavos: number,
) {
  const db = getDb();
  const ahora = new Date();

  // La barrera de idempotencia: solo el primer aviso pasa de aquí.
  const marcado = await db
    .update(pedidos)
    .set({ estado: "pagado", actualizadoEn: ahora })
    .where(and(eq(pedidos.id, pedidoId), eq(pedidos.estado, "pendiente_pago")))
    .returning({ numero: pedidos.numero, clienteId: pedidos.clienteId });

  if (marcado.length === 0) return;
  const pedido = marcado[0];

  await db
    .update(pagos)
    .set({ estado: "confirmado", actualizadoEn: ahora })
    .where(eq(pagos.referenciaExterna, intentoId));

  const renglones = await db
    .select({
      productoId: itemsPedido.productoId,
      tiendaId: itemsPedido.tiendaId,
      cantidad: itemsPedido.cantidad,
      subtotalCentavos: itemsPedido.subtotalCentavos,
      /* Qué variante se vendió, si el producto tenía tallas o colores. Sin
         esto el stock se le descontaría al padre y la talla vendida seguiría
         figurando disponible. */
      varianteId: itemsVariante.varianteId,
    })
    .from(itemsPedido)
    .leftJoin(itemsVariante, eq(itemsVariante.itemPedidoId, itemsPedido.id))
    .where(eq(itemsPedido.pedidoId, pedidoId));

  // El stock baja al confirmarse el pago, igual que al aprobar un Zelle.
  for (const r of renglones) {
    // Con variante, el stock que baja es el SUYO, no el del padre.
    if (r.varianteId) {
      await db
        .update(variantesProducto)
        .set({
          existencias: sql`MAX(0, ${variantesProducto.existencias} - ${r.cantidad})`,
          actualizadoEn: ahora,
        })
        .where(eq(variantesProducto.id, r.varianteId));
      continue;
    }
    if (!r.productoId) continue;
    await db
      .update(productos)
      .set({
        existencias: sql`MAX(0, ${productos.existencias} - ${r.cantidad})`,
        actualizadoEn: ahora,
      })
      .where(eq(productos.id, r.productoId));
  }

  // Lo de cada comercio, junto.
  const porTienda = new Map<string, number>();
  for (const r of renglones) {
    if (!r.tiendaId) continue;
    porTienda.set(
      r.tiendaId,
      (porTienda.get(r.tiendaId) ?? 0) + Number(r.subtotalCentavos),
    );
  }

  for (const [tiendaId, brutoCentavos] of porTienda) {
    const comision = calcularComisionCentavos(
      brutoCentavos,
      COMISION_TARJETA_PB,
    );
    const neto = brutoCentavos - comision;

    const [billetera] = await db
      .select({ id: billeteras.id, saldoCentavos: billeteras.saldoCentavos })
      .from(billeteras)
      .where(eq(billeteras.tiendaId, tiendaId))
      .limit(1);

    if (!billetera) continue;

    await db.batch([
      db.insert(movimientosBilletera).values({
        id: `mov-${nanoid(12)}`,
        billeteraId: billetera.id,
        tipo: "recarga",
        montoCentavos: neto,
        saldoResultanteCentavos: billetera.saldoCentavos + neto,
        referencia: intentoId,
        nota: `Venta con tarjeta · ${pedido.numero}`,
        creadoEn: ahora,
      }),
      db
        .update(billeteras)
        .set({ saldoCentavos: sql`${billeteras.saldoCentavos} + ${neto}` })
        .where(eq(billeteras.id, billetera.id)),
    ]);
  }

  // Los avisos, al final y sin que puedan tumbar nada.
  try {
    const [cliente] = await db
      .select({ email: user.email, name: user.name, idioma: user.idioma })
      .from(user)
      .where(eq(user.id, pedido.clienteId))
      .limit(1);

    const { correoCompraAprobada, correoVentaAcreditada } =
      await import("@/lib/correo/correos");

    if (cliente) {
      await correoCompraAprobada(cliente, {
        numero: pedido.numero,
        totalCentavos: montoCentavos,
      });
    }

    for (const [tiendaId, brutoCentavos] of porTienda) {
      const [duenno] = await db
        .select({ email: user.email, name: user.name, idioma: user.idioma })
        .from(tiendas)
        .innerJoin(user, eq(user.id, tiendas.propietarioId))
        .where(eq(tiendas.id, tiendaId))
        .limit(1);

      if (duenno) {
        await correoVentaAcreditada(duenno, {
          montoCentavos:
            brutoCentavos -
            calcularComisionCentavos(brutoCentavos, COMISION_TARJETA_PB),
          referencia: pedido.numero,
        });
      }
    }

    // Lo mismo que al aprobar un Zelle: si la venta dejó algo en cero, el
    // comercio se entera hoy y no cuando note que dejó de vender.
    const { avisarAgotados } = await import("@/lib/productos/agotados");
    await avisarAgotados(renglones);
  } catch (e) {
    console.error("[stripe] pago acreditado; el aviso no salio:", e);
  }
}
