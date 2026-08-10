import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { facturas, ordenesCompra, tiendas } from "@/lib/db/schema";

/**
 * LAS DOS FACTURAS DE UNA VENTA, JUNTAS.
 *
 * ══ POR QUÉ ESTE PAR ES EL CORAZÓN DEL MODELO ══
 *
 * Mercatren no cobra por cuenta de nadie: **compra la mercancía al comercio y
 * la revende**. Esa figura se sostiene sobre dos documentos por cada venta:
 *
 *   1. Nuestra factura de venta al comprador (la emitimos nosotros).
 *   2. La factura del comercio a nosotros, contra su orden de compra.
 *
 * Sin el par, en los papeles no hay una compra y una reventa: hay dinero
 * entrando y saliendo, que es exactamente la lectura que el abogado desarmó el
 * 5 de agosto de 2026.
 *
 * Estaban los dos en el sistema, pero **en pantallas distintas y sin enlace**.
 * Para comprobar que una venta estaba completa había que abrir dos secciones y
 * cruzarlas a mano.
 */
export type ParDeFacturas = {
  /** La nuestra al comprador. Null si el pago aún no se confirmó. */
  venta: { numero: string } | null;
  /** Una orden por comercio: un pedido puede mezclar varios. */
  ordenes: {
    id: string;
    numero: string;
    tiendaNombre: string;
    subtotalCentavos: number;
    moneda: string;
    /** El número y el archivo que subió el comercio, cuando ya facturó. */
    facturaNumero: string | null;
    facturaClave: string | null;
  }[];
};

export async function parDeFacturas(pedidoId: string): Promise<ParDeFacturas> {
  const db = getDb();

  try {
    const [venta] = await db
      .select({ numero: facturas.numero })
      .from(facturas)
      .where(eq(facturas.pedidoId, pedidoId))
      .limit(1);

    const ordenes = await db
      .select({
        id: ordenesCompra.id,
        numero: ordenesCompra.numero,
        tiendaNombre: tiendas.nombre,
        subtotalCentavos: ordenesCompra.subtotalCentavos,
        moneda: ordenesCompra.moneda,
        facturaNumero: ordenesCompra.facturaProveedorNumero,
        facturaClave: ordenesCompra.facturaProveedorClave,
      })
      .from(ordenesCompra)
      .innerJoin(tiendas, eq(tiendas.id, ordenesCompra.tiendaId))
      .where(eq(ordenesCompra.pedidoId, pedidoId));

    return { venta: venta ?? null, ordenes };
  } catch {
    /* Los documentos son información de apoyo: si la consulta falla, la ficha
       del pedido se dibuja igual y el comercio puede seguir despachando. */
    return { venta: null, ordenes: [] };
  }
}
