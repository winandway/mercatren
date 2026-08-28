import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { SITIO } from "@/lib/sitio";
import { getDb } from "@/lib/db";
import { anotarHito } from "@/lib/pedidos/hitos";
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

/**
 * ACREDITAR UNA VENTA COBRADA CON TARJETA.
 *
 * ══ POR QUÉ ESTO VIVE EN SU PROPIO ARCHIVO ══
 *
 * Antes estaba dentro del webhook de Stripe, que era el único que la llamaba.
 * Ahora la llaman DOS: el webhook, y el respaldo que le pregunta a Stripe
 * cuando el aviso no llegó (`conciliar.ts`).
 *
 * Duplicarla habría sido lo fácil y lo peor: son cien líneas que descuentan
 * stock, acreditan billeteras y emiten facturas. Dos copias se separan al
 * primer arreglo que alguien haga en una sola, y el día que eso pase el
 * comercio va a cobrar distinto según por dónde entró el aviso.
 *
 * ══ ES IDEMPOTENTE, Y ESO ES LO QUE LA HACE SEGURA ══
 *
 * El pedido solo se acredita si sigue en `pendiente_pago` — el estado va
 * DENTRO del WHERE del UPDATE, así que la comprobación y el cambio son una
 * sola operación. Si el webhook y el respaldo entran a la vez, uno de los dos
 * no encuentra nada que hacer y se va sin tocar un centavo.
 */

/**
 * La acreditación: el espejo con tarjeta de lo que hace aprobarPago con
 * Zelle, pero sin validador — aquí el banco ya confirmó el dinero.
 *
 * UN PEDIDO PUEDE MEZCLAR COMERCIOS: cada tienda recibe el subtotal de SUS
 * renglones menos el 2% de la tarjeta. El saldo se suma con una operación
 * relativa (saldo = saldo + X) para que dos avisos a la vez no se pisen.
 */
export async function acreditarPagoConTarjeta(
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
    .returning({
      numero: pedidos.numero,
      clienteId: pedidos.clienteId,
      moneda: pedidos.moneda,
    });

  if (marcado.length === 0) return;
  const pedido = marcado[0];

  await db
    .update(pagos)
    .set({ estado: "confirmado", actualizadoEn: ahora })
    .where(eq(pagos.referenciaExterna, intentoId));

  /* El primer hito lo pone el sistema: sin autor, porque no lo hizo nadie.
     Que el historial arranque en «pagado» y no en «enviado» es lo que hace
     que la línea de tiempo cuente la venta entera. */
  await anotarHito(db, { pedidoId, hito: "pagado" });

  const renglones = await db
    .select({
      productoId: itemsPedido.productoId,
      tiendaId: itemsPedido.tiendaId,
      cantidad: itemsPedido.cantidad,
      subtotalCentavos: itemsPedido.subtotalCentavos,
      /* La comisión GUARDADA, no una recalculada aquí. Ver más abajo. */
      comisionCentavos: itemsPedido.comisionCentavos,
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

  /**
   * Lo de cada comercio, junto.
   *
   * ══ LA COMISIÓN SALE DEL RENGLÓN, NO SE VUELVE A CALCULAR AQUÍ ══
   *
   * Antes este bloque la recalculaba con `COMISION_TARJETA_PB`, mientras la
   * orden de compra usaba la que se había guardado al crear el pedido. Cuando
   * las dos no coincidían —y no coincidían, porque al crear el pedido se
   * guardaba la tarifa de Zelle— el mismo pedido acababa con dos números
   * distintos para lo que se le paga al comercio.
   *
   * Ahora hay UNA sola cifra, la de `items_pedido.comision_centavos`, y todos
   * la leen: la orden de compra, la billetera y este acreditado. Que cuadren
   * deja de depender de que dos sitios hagan la misma cuenta.
   */
  const porTienda = new Map<string, { bruto: number; comision: number }>();
  for (const r of renglones) {
    if (!r.tiendaId) continue;
    const acumulado = porTienda.get(r.tiendaId) ?? { bruto: 0, comision: 0 };
    acumulado.bruto += Number(r.subtotalCentavos);
    acumulado.comision += Number(r.comisionCentavos ?? 0);
    porTienda.set(r.tiendaId, acumulado);
  }

  for (const [tiendaId, { bruto: brutoCentavos, comision }] of porTienda) {
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

  /* LAS DOS FACTURAS. Va aquí, después de acreditar, porque una venta solo
     existe cuando el pago está confirmado. Y en su propio try: si emitir
     falla, el pago queda acreditado igual — un documento se puede volver a
     emitir, un cobro no se puede volver a cobrar. */
  try {
    const { emitirDocumentosDeVenta } = await import("@/lib/facturas/emitir");
    await emitirDocumentosDeVenta(pedidoId);
  } catch (e) {
    console.error("[stripe] pago acreditado; la factura no salio:", e);
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
        moneda: pedido.moneda ?? "USD",
      });
    }

    for (const [tiendaId, { bruto, comision }] of porTienda) {
      const [duenno] = await db
        .select({ email: user.email, name: user.name, idioma: user.idioma })
        .from(tiendas)
        .innerJoin(user, eq(user.id, tiendas.propietarioId))
        .where(eq(tiendas.id, tiendaId))
        .limit(1);

      if (duenno) {
        await correoVentaAcreditada(duenno, {
          /* El MISMO neto que se acreditó arriba. Si el correo hiciera su
             propia cuenta, el comercio leería una cifra en el correo y otra
             distinta en su billetera — y la que se creería es la del correo. */
          montoCentavos: bruto - comision,
          referencia: pedido.numero,
        });
      }
    }

    /**
     * Y AL EQUIPO, QUE HASTA HOY NO SE ENTERABA DE NADA.
     *
     * De una venta con tarjeta solo recibían correo el comprador y el
     * comercio. Nadie de Mercatren sabía que había entrado dinero hasta que
     * alguien abriera el panel — y hay cosas que dependen de mirarlo pronto:
     * que el comercio despache, que el pedido no se quede parado, que un
     * primer cobro de un comercio nuevo no pase inadvertido.
     *
     * Va DESPUÉS de acreditar y dentro del `try` de los avisos, como todo lo
     * demás: un correo que no sale jamás puede deshacer un cobro.
     */
    const { correoAvisoAlEquipo } = await import("@/lib/correo/correos");
    const { fichaDeVenta, lineasDeLaVenta } =
      await import("@/lib/pedidos/ficha-para-el-equipo");

    /* La ficha completa: qué comercio vendió, quién compró, qué se llevó, quién
       tiene que entregarlo y con qué números. Si por lo que sea no se puede
       armar, sale el aviso corto de siempre — mejor escueto que ninguno. */
    const ficha = await fichaDeVenta(pedidoId).catch(() => null);

    await correoAvisoAlEquipo({
      asunto: `Venta con tarjeta ${pedido.numero}`,
      lineas: ficha
        ? lineasDeLaVenta(ficha)
        : [
            `Entró un cobro con tarjeta del pedido ${pedido.numero}.`,
            `Total: ${(montoCentavos / 100).toFixed(2)} USD.`,
          ],
      url: `${SITIO.url}/es/panel/ordenes/${pedido.numero}`,
      boton: "Ver el pedido",
    });

    // Lo mismo que al aprobar un Zelle: si la venta dejó algo en cero, el
    // comercio se entera hoy y no cuando note que dejó de vender.
    const { avisarAgotados } = await import("@/lib/productos/agotados");
    await avisarAgotados(renglones);
  } catch (e) {
    console.error("[stripe] pago acreditado; el aviso no salio:", e);
  }

  /**
   * Y SI LA VENTA ES DE ESTADOS UNIDOS, SE LE PIDE AL PROVEEDOR.
   *
   * Va en su propio try y al final de todo: el cobro ya está acreditado y el
   * stock descontado. Si el proveedor no contesta, la venta sigue en pie y la
   * compra queda pendiente EN EL PANEL con su motivo — nunca al revés. Un
   * cobro no se deshace porque el proveedor tuviera un mal minuto.
   *
   * Crea el pedido con la dirección del comprador y deja el enlace de pago
   * listo. Pagarlo sigue siendo un acto humano: la API del proveedor no puede
   * cobrar una tarjeta guardada, y por eso el correo trae el botón.
   */
  try {
    const { esDeEstadosUnidos } = await import("@/lib/cj/pedidos");
    if (await esDeEstadosUnidos(pedidoId)) {
      const { comprarAlProveedor } = await import("@/lib/cj/pedidos");
      await comprarAlProveedor(pedidoId);
    }
  } catch (e) {
    console.error("[stripe] acreditado; la compra al proveedor no salio:", e);
  }
}
