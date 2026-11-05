import "server-only";

import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { itemsPedido, pedidos } from "@/lib/db/schema";

/**
 * LAS ESTADÍSTICAS DEL PLAN PRO (5 nov 2026, Fase 4).
 *
 * Salen de lo que YA está guardado: las ventas de la tienda (y los clics de
 * sus promocionados, en `promociones.ts`). Nunca de las visitas: mirar no
 * escribe en la base (regla «LA NUBE NO SE COME EL DINERO»), así que no hay
 * visitas que contar. Dos consultas agrupadas, nada de traer filas para
 * sumarlas aquí.
 */
const VENDIDO = ["pagado", "preparando", "enviado", "entregado"] as const;

export type EstadisticasDeTienda = {
  dias: number;
  pedidos: number;
  unidades: number;
  ventasCentavos: number;
  /** Lo que el comercio recibe: lo vendido menos el margen de Mercatren. */
  paraTiCentavos: number;
  masVendidos: {
    productoId: string | null;
    titulo: string;
    unidades: number;
    ventasCentavos: number;
  }[];
};

export async function estadisticasDeTienda(
  tiendaId: string,
  dias = 30,
  ahora = Date.now(),
): Promise<EstadisticasDeTienda> {
  const desde = new Date(ahora - dias * 24 * 60 * 60 * 1000);
  const db = getDb();
  const condicion = and(
    eq(itemsPedido.tiendaId, tiendaId),
    inArray(pedidos.estado, [...VENDIDO]),
    gte(pedidos.creadoEn, desde),
  );
  const [totales, productos] = await Promise.all([
    db
      .select({
        pedidos: sql<number>`COUNT(DISTINCT ${itemsPedido.pedidoId})`,
        unidades: sql<number>`COALESCE(SUM(${itemsPedido.cantidad}), 0)`,
        ventas: sql<number>`COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0)`,
        margen: sql<number>`COALESCE(SUM(${itemsPedido.comisionCentavos}), 0)`,
      })
      .from(itemsPedido)
      .innerJoin(pedidos, eq(pedidos.id, itemsPedido.pedidoId))
      .where(condicion),
    db
      .select({
        productoId: itemsPedido.productoId,
        titulo: sql<string>`MAX(${itemsPedido.titulo})`,
        unidades: sql<number>`SUM(${itemsPedido.cantidad})`,
        ventas: sql<number>`SUM(${itemsPedido.subtotalCentavos})`,
      })
      .from(itemsPedido)
      .innerJoin(pedidos, eq(pedidos.id, itemsPedido.pedidoId))
      .where(condicion)
      .groupBy(itemsPedido.productoId)
      .orderBy(desc(sql`SUM(${itemsPedido.subtotalCentavos})`))
      .limit(10),
  ]);
  const t = totales[0];
  const ventas = Number(t?.ventas ?? 0);
  return {
    dias,
    pedidos: Number(t?.pedidos ?? 0),
    unidades: Number(t?.unidades ?? 0),
    ventasCentavos: ventas,
    paraTiCentavos: ventas - Number(t?.margen ?? 0),
    masVendidos: productos.map((p) => ({
      productoId: p.productoId,
      titulo: p.titulo,
      unidades: Number(p.unidades),
      ventasCentavos: Number(p.ventas),
    })),
  };
}
