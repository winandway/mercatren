"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  itemsPedido,
  pagosZelle,
  pedidos,
  productos,
  tiendas,
} from "@/lib/db/schema";
import { calcularComisionCentavos } from "@/lib/dinero";
import { esquemaPedido, type DatosPedido } from "@/lib/pedidos/esquemas";

/**
 * Cierre de la compra.
 *
 * REGLA: lo que manda el navegador se usa SOLO para saber que quiere comprar
 * (que producto y cuantos). El precio, la disponibilidad y la comision se
 * vuelven a leer de la base. Si alguien manipula el carrito para ponerse un
 * precio de un dolar, aqui no le sirve de nada.
 *
 * Las existencias NO se descuentan todavia: se descuentan cuando el pago queda
 * confirmado. Asi un carrito abandonado no deja mercancia bloqueada. A cambio,
 * el validador tiene que mirar que quede stock antes de aprobar.
 */

export type ResultadoPedido =
  { ok: true; numero: string } | { ok: false; mensaje: string };

/** Numero corto y legible para el cliente: MT-000124. */
async function siguienteNumero(db: ReturnType<typeof getDb>) {
  const [fila] = await db
    .select({ cuantos: sql<number>`COUNT(*)` })
    .from(pedidos);
  const siguiente = Number(fila?.cuantos ?? 0) + 1;
  return `MT-${String(siguiente).padStart(6, "0")}`;
}

export async function crearPedido(
  entrada: DatosPedido,
): Promise<ResultadoPedido> {
  const usuario = await obtenerUsuario();
  if (!usuario) {
    return {
      ok: false,
      mensaje: "Entra con tu cuenta para terminar la compra.",
    };
  }

  const revisado = esquemaPedido.safeParse(entrada);
  if (!revisado.success) {
    return {
      ok: false,
      mensaje:
        revisado.error.issues[0]?.message ?? "Faltan datos para el pedido.",
    };
  }

  const { entrega, metodoPago, lineas } = revisado.data;

  if (metodoPago !== "zelle") {
    return {
      ok: false,
      mensaje: "Por ahora solo está habilitado el pago por Zelle.",
    };
  }

  const db = getDb();

  // Se leen de la base los productos pedidos, con su precio y su comercio.
  const encontrados = await db
    .select({
      id: productos.id,
      tituloEs: productos.tituloEs,
      precioCentavos: productos.precioCentavos,
      moneda: productos.moneda,
      existencias: productos.existencias,
      controlaExistencias: productos.controlaExistencias,
      estado: productos.estado,
      tiendaId: productos.tiendaId,
      tiendaEstado: tiendas.estado,
      comisionPuntosBase: tiendas.comisionPuntosBase,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      inArray(
        productos.id,
        lineas.map((l) => l.productoId),
      ),
    );

  const porId = new Map(encontrados.map((p) => [p.id, p]));

  const items: (typeof itemsPedido.$inferInsert)[] = [];
  let subtotal = 0;

  for (const linea of lineas) {
    const producto = porId.get(linea.productoId);

    if (!producto) {
      return {
        ok: false,
        mensaje:
          "Uno de los productos del carrito ya no está en el catálogo. Quítalo y vuelve a intentar.",
      };
    }
    if (producto.estado !== "publicado" || producto.tiendaEstado !== "activa") {
      return {
        ok: false,
        mensaje: `"${producto.tituloEs}" ya no está a la venta. Quítalo del carrito.`,
      };
    }
    if (producto.controlaExistencias && producto.existencias < linea.cantidad) {
      return {
        ok: false,
        mensaje: `De "${producto.tituloEs}" solo quedan ${producto.existencias}.`,
      };
    }

    // El precio sale de la base, NO del carrito.
    const subtotalLinea = producto.precioCentavos * linea.cantidad;
    subtotal += subtotalLinea;

    items.push({
      id: nanoid(),
      pedidoId: "",
      productoId: producto.id,
      tiendaId: producto.tiendaId,
      titulo: producto.tituloEs,
      precioUnitarioCentavos: producto.precioCentavos,
      cantidad: linea.cantidad,
      subtotalCentavos: subtotalLinea,
      comisionCentavos: calcularComisionCentavos(
        subtotalLinea,
        producto.comisionPuntosBase,
      ),
    });
  }

  if (subtotal <= 0) {
    return { ok: false, mensaje: "El pedido no tiene monto que cobrar." };
  }

  const pedidoId = nanoid();
  const numero = await siguienteNumero(db);
  const ahora = new Date();

  // El envio y los impuestos quedan en cero por ahora: se acuerdan con el
  // comercio. Cuando se definan, entran aqui y en el total.
  await db.batch([
    db.insert(pedidos).values({
      id: pedidoId,
      numero,
      clienteId: usuario.id,
      estado: "pendiente_pago",
      subtotalCentavos: subtotal,
      envioCentavos: 0,
      impuestosCentavos: 0,
      totalCentavos: subtotal,
      moneda: encontrados[0]?.moneda ?? "USD",
      metodoPago,
      direccionEntrega: {
        nombre: entrega.nombre,
        pais: entrega.pais,
        ciudad: entrega.ciudad,
        direccion: entrega.direccion,
        referencia: entrega.referencia ?? null,
      },
      paisDestino: entrega.pais,
      telefonoContacto: entrega.telefono,
      notasCliente: entrega.notas ?? null,
      creadoEn: ahora,
      actualizadoEn: ahora,
    }),
    ...items.map((item) =>
      db.insert(itemsPedido).values({ ...item, pedidoId }),
    ),
  ]);

  return { ok: true, numero };
}

/** El pedido de este cliente, con sus renglones. */
export async function obtenerPedidoPropio(numero: string) {
  const usuario = await obtenerUsuario();
  if (!usuario) return null;

  const db = getDb();

  const [pedido] = await db
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.numero, numero), eq(pedidos.clienteId, usuario.id)))
    .limit(1);

  if (!pedido) return null;

  const renglones = await db
    .select()
    .from(itemsPedido)
    .where(eq(itemsPedido.pedidoId, pedido.id));

  // Si ya subio el comprobante, se muestra en que va en vez del formulario.
  const [pago] = await db
    .select({
      id: pagosZelle.id,
      estado: pagosZelle.estado,
      subidoEn: pagosZelle.subidoEn,
      motivoRechazo: pagosZelle.motivoRechazo,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.pedidoId, pedido.id))
    .orderBy(desc(pagosZelle.creadoEn))
    .limit(1);

  return { pedido, renglones, pago: pago ?? null };
}
