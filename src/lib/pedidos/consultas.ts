import "server-only";

import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  ESTADOS_PEDIDO,
  itemsPedido,
  pagosZelle,
  pedidos,
  tiendas,
  user,
} from "@/lib/db/schema";

/**
 * Los pedidos vistos desde el panel.
 *
 * REGLA DE ALCANCE: un comercio ve SOLO los pedidos que le compraron a el, y
 * de esos ve lo suyo. Un pedido puede mezclar varios comercios, asi que no
 * basta con filtrar por pedido: se filtra por los renglones que son de esa
 * tienda, y los totales que se muestran son los de ESOS renglones, no los del
 * pedido completo. Mostrarle a un comercio el total de un pedido compartido
 * seria decirle que vendio mas de lo que vendio.
 *
 * El equipo de Mercatren si ve el pedido entero.
 */

/** La tienda que toca, segun quien pregunta. */
async function tiendaDelAlcance(comercioPedido?: string) {
  const alcance = await obtenerAlcance();
  if (alcance.tipo === "tienda") return alcance.tiendaId;

  if (comercioPedido) {
    const db = getDb();
    const [t] = await db
      .select({ id: tiendas.id })
      .from(tiendas)
      .where(eq(tiendas.slug, comercioPedido))
      .limit(1);
    return t?.id ?? null;
  }
  return null;
}

const POR_PAGINA = 25;

export type FiltrosPedidos = {
  estado?: string;
  comercio?: string;
  pagina?: number;
};

export async function listarPedidosDelPanel(filtros: FiltrosPedidos = {}) {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(filtros.comercio);
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const condiciones: SQL[] = [];

  // Solo se acepta un estado que exista de verdad: lo que venga en la
  // direccion es texto de cualquiera.
  const estado = ESTADOS_PEDIDO.find((e) => e === filtros.estado);
  if (estado) condiciones.push(eq(pedidos.estado, estado));

  // Si hay tienda, solo los pedidos que tienen algun renglon suyo.
  if (tiendaId) {
    condiciones.push(
      sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`,
    );
  }

  const donde = condiciones.length ? and(...condiciones) : undefined;

  // Los importes: si quien mira es un comercio, solo sus renglones.
  const subtotal = tiendaId
    ? sql<number>`(SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql<number>`${pedidos.totalCentavos}`;

  const articulos = tiendaId
    ? sql<number>`(SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql<number>`(SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id})`;

  const [conteo] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(pedidos)
    .where(donde);

  const filas = await db
    .select({
      numero: pedidos.numero,
      estado: pedidos.estado,
      creadoEn: pedidos.creadoEn,
      paisDestino: pedidos.paisDestino,
      clienteNombre: user.name,
      clienteCorreo: user.email,
      montoCentavos: subtotal,
      articulos,
      estadoPago: sql<
        string | null
      >`(SELECT ${pagosZelle.estado} FROM ${pagosZelle} WHERE ${pagosZelle.pedidoId} = ${pedidos.id} ORDER BY ${pagosZelle.creadoEn} DESC LIMIT 1)`,
    })
    .from(pedidos)
    .innerJoin(user, eq(user.id, pedidos.clienteId))
    .where(donde)
    .orderBy(desc(pedidos.creadoEn))
    .limit(POR_PAGINA)
    .offset((pagina - 1) * POR_PAGINA);

  const total = Number(conteo?.n ?? 0);

  return {
    pedidos: filas.map((f) => ({
      ...f,
      montoCentavos: Number(f.montoCentavos),
      articulos: Number(f.articulos),
    })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    /** true cuando los importes son solo de este comercio. */
    soloDeEsteComercio: Boolean(tiendaId),
  };
}

/** Cuantos pedidos hay en cada estado, para las pestanas. */
export async function contarPedidosPorEstado(comercioPedido?: string) {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercioPedido);

  const donde = tiendaId
    ? sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : undefined;

  const filas = await db
    .select({ estado: pedidos.estado, n: sql<number>`COUNT(*)` })
    .from(pedidos)
    .where(donde)
    .groupBy(pedidos.estado);

  const cuenta: Record<string, number> = { total: 0 };
  for (const f of filas) {
    cuenta[f.estado] = Number(f.n);
    cuenta.total += Number(f.n);
  }
  return cuenta;
}

/**
 * Los clientes que han comprado, con lo que llevan gastado.
 *
 * Un comercio ve solo a quienes le compraron A EL, y el gasto es lo que
 * gastaron EN SU TIENDA. El equipo de Mercatren ve a todos.
 */
export async function listarClientes(comercioPedido?: string) {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercioPedido);

  const gastado = tiendaId
    ? sql<number>`COALESCE(SUM((SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})), 0)`
    : sql<number>`COALESCE(SUM(${pedidos.totalCentavos}), 0)`;

  const donde = tiendaId
    ? sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : undefined;

  const filas = await db
    .select({
      id: user.id,
      nombre: user.name,
      correo: user.email,
      pais: user.paisEntrega,
      pedidos: sql<number>`COUNT(${pedidos.id})`,
      gastadoCentavos: gastado,
      ultimo: sql<number | null>`MAX(${pedidos.creadoEn})`,
    })
    .from(pedidos)
    .innerJoin(user, eq(user.id, pedidos.clienteId))
    .where(donde)
    .groupBy(user.id, user.name, user.email, user.paisEntrega)
    .orderBy(desc(sql`COUNT(${pedidos.id})`))
    .limit(100);

  return filas.map((f) => ({
    ...f,
    pedidos: Number(f.pedidos),
    gastadoCentavos: Number(f.gastadoCentavos),
  }));
}
