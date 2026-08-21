import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { comercioEfectivo, type Alcance } from "@/lib/alcance";
import { getDb } from "@/lib/db";
import {
  facturas,
  lineasFactura,
  ordenesCompra,
  pedidos,
  tiendas,
} from "@/lib/db/schema";

/**
 * Lo que se lee de la facturación.
 *
 * REGLA DE CABECERA: toda consulta que devuelva dinero o datos de otro pasa
 * por el ALCANCE. Un comercio solo ve sus órdenes de compra, aunque en la
 * dirección venga pedido otro — de eso se encarga `comercioEfectivo`.
 *
 * Y NUNCA se pide una tabla entera (`select()` sin columnas ni
 * `factura: facturas`). Drizzle listaría TODAS las columnas del esquema,
 * incluidas las que se acaben de agregar, y como `schema.sql` solo trae
 * `CREATE TABLE IF NOT EXISTS`, una base que ya existe no las recibe: la
 * consulta pide una columna que en producción no está y la pantalla revienta
 * con 500. Pasó el 5 ago 2026 y ninguna ficha de producto abría.
 */

export type FacturaConLineas = {
  numero: string;
  emisorNombre: string;
  emisorIdentificacion: string | null;
  emisorDireccion: string | null;
  receptorNombre: string;
  receptorCorreo: string | null;
  receptorDireccion: string | null;
  subtotalCentavos: number;
  impuestosCentavos: number;
  totalCentavos: number;
  moneda: string;
  emitidaEn: Date;
  pedidoNumero: string;
  lineas: {
    descripcion: string;
    cantidad: number;
    precioUnitarioCentavos: number;
    subtotalCentavos: number;
  }[];
};

/**
 * La factura de un pedido, para quien tiene derecho a verla.
 *
 * `puedeVerTodo` es el equipo de Mercatren. Para todos los demás se exige que
 * el pedido sea SUYO: se compara contra `clienteId`, no contra lo que venga en
 * la dirección.
 *
 * Devuelve `null` cuando no existe o no le corresponde, y quien llama contesta
 * 404. No se distingue entre las dos cosas a propósito: un "no puedes" le
 * confirma a un desconocido que ese pedido existe.
 */
export async function facturaDePedido(
  numeroPedido: string,
  usuarioId: string,
  puedeVerTodo: boolean,
): Promise<FacturaConLineas | null> {
  const db = getDb();

  const [fila] = await db
    .select({
      id: facturas.id,
      numero: facturas.numero,
      emisorNombre: facturas.emisorNombre,
      emisorIdentificacion: facturas.emisorIdentificacion,
      emisorDireccion: facturas.emisorDireccion,
      receptorNombre: facturas.receptorNombre,
      receptorCorreo: facturas.receptorCorreo,
      receptorDireccion: facturas.receptorDireccion,
      subtotalCentavos: facturas.subtotalCentavos,
      impuestosCentavos: facturas.impuestosCentavos,
      totalCentavos: facturas.totalCentavos,
      moneda: facturas.moneda,
      emitidaEn: facturas.emitidaEn,
      clienteId: facturas.clienteId,
      pedidoNumero: pedidos.numero,
    })
    .from(facturas)
    .innerJoin(pedidos, eq(pedidos.id, facturas.pedidoId))
    .where(eq(pedidos.numero, numeroPedido))
    .limit(1);

  if (!fila) return null;
  if (!puedeVerTodo && fila.clienteId !== usuarioId) return null;

  const lineas = await db
    .select({
      descripcion: lineasFactura.descripcion,
      cantidad: lineasFactura.cantidad,
      precioUnitarioCentavos: lineasFactura.precioUnitarioCentavos,
      subtotalCentavos: lineasFactura.subtotalCentavos,
    })
    .from(lineasFactura)
    .where(eq(lineasFactura.facturaId, fila.id));

  return { ...fila, lineas };
}

/** Si un pedido ya tiene factura, para decidir si se enseña el enlace. */
export async function tieneFactura(pedidoId: string): Promise<boolean> {
  const [fila] = await getDb()
    .select({ id: facturas.id })
    .from(facturas)
    .where(eq(facturas.pedidoId, pedidoId))
    .limit(1);
  return Boolean(fila);
}

export type OrdenCompraVista = {
  id: string;
  numero: string;
  pedidoNumero: string;
  tiendaNombre: string;
  /** Para saber si es un comercio de verdad o una marca de la casa. */
  tiendaId: string;
  subtotalCentavos: number;
  moneda: string;
  estado: "emitida" | "facturada";
  facturaProveedorNumero: string | null;
  facturaProveedorClave: string | null;
  emitidaEn: Date;
  facturadaEn: Date | null;
  /** Con qué se cobró la venta que originó esta orden. */
  metodoPago: string | null;
};

/**
 * Las órdenes de compra que le corresponde ver a quien pregunta.
 *
 * `soloPendientes` es la vista que de verdad importa: **qué órdenes todavía no
 * tienen su factura de compra**. Sin la factura del comercio, la figura de
 * reventa no se sostiene — quedaría una entrada de dinero sin una compra que
 * la respalde. Y ese hueco, si no se enseña, no se descubre hasta la
 * auditoría.
 */
export async function listarOrdenesCompra(
  alcance: Alcance,
  opciones: { comercio?: string | null; soloPendientes?: boolean } = {},
): Promise<OrdenCompraVista[]> {
  const db = getDb();
  const tiendaId = comercioEfectivo(alcance, opciones.comercio);

  const condiciones = [
    tiendaId ? eq(ordenesCompra.tiendaId, tiendaId) : undefined,
    opciones.soloPendientes
      ? isNull(ordenesCompra.facturaProveedorClave)
      : undefined,
  ].filter(Boolean);

  return db
    .select({
      id: ordenesCompra.id,
      numero: ordenesCompra.numero,
      pedidoNumero: pedidos.numero,
      tiendaNombre: tiendas.nombre,
      tiendaId: ordenesCompra.tiendaId,
      subtotalCentavos: ordenesCompra.subtotalCentavos,
      moneda: ordenesCompra.moneda,
      estado: ordenesCompra.estado,
      facturaProveedorNumero: ordenesCompra.facturaProveedorNumero,
      facturaProveedorClave: ordenesCompra.facturaProveedorClave,
      emitidaEn: ordenesCompra.emitidaEn,
      facturadaEn: ordenesCompra.facturadaEn,
      /* Con qué se cobró esa venta. Sin esto, la orden de compra dice cuánto
         se le paga al comercio pero no de dónde salió el dinero, y no hay
         forma de ir a buscar el cobro cuando algo no cuadra. */
      metodoPago: pedidos.metodoPago,
    })
    .from(ordenesCompra)
    .innerJoin(pedidos, eq(pedidos.id, ordenesCompra.pedidoId))
    .innerJoin(tiendas, eq(tiendas.id, ordenesCompra.tiendaId))
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(desc(ordenesCompra.emitidaEn))
    .limit(300);
}

/** Cuántas órdenes están esperando su factura. Es el número que hay que bajar. */
export async function cuantasSinFactura(
  alcance: Alcance,
  comercio?: string | null,
): Promise<number> {
  const tiendaId = comercioEfectivo(alcance, comercio);

  const condiciones = [
    isNull(ordenesCompra.facturaProveedorClave),
    tiendaId ? eq(ordenesCompra.tiendaId, tiendaId) : undefined,
  ].filter(Boolean);

  const [fila] = await getDb()
    .select({ cuantas: sql<number>`COUNT(*)` })
    .from(ordenesCompra)
    .where(and(...condiciones));

  return Number(fila?.cuantas ?? 0);
}

/** Los renglones de una orden, que salen del pedido y no se copian. */
export async function renglonesDeOrden(ordenId: string) {
  const db = getDb();
  const { itemsPedido } = await import("@/lib/db/schema");

  const [orden] = await db
    .select({
      pedidoId: ordenesCompra.pedidoId,
      tiendaId: ordenesCompra.tiendaId,
    })
    .from(ordenesCompra)
    .where(eq(ordenesCompra.id, ordenId))
    .limit(1);

  if (!orden) return [];

  return db
    .select({
      titulo: itemsPedido.titulo,
      cantidad: itemsPedido.cantidad,
      subtotalCentavos: itemsPedido.subtotalCentavos,
      comisionCentavos: itemsPedido.comisionCentavos,
    })
    .from(itemsPedido)
    .where(
      and(
        eq(itemsPedido.pedidoId, orden.pedidoId),
        eq(itemsPedido.tiendaId, orden.tiendaId),
      ),
    );
}
