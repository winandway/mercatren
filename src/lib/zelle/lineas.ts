import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  depositos,
  itemsPedido,
  pagosZelle,
  productos,
  tiendas,
} from "@/lib/db/schema";

/**
 * QUÉ SE COMPRÓ EN CADA OPERACIÓN, Y A QUIÉN SE LE COMPRÓ.
 *
 * Antes el comprobante interno enseñaba el monto y nada más: se veía que
 * entraron $2.48 pero no qué producto era ni de qué depósito salía. Para un
 * comprobante que sustenta una compraventa eso es insuficiente — sin la
 * mercancía identificada no hay nada que demuestre que hubo una compra.
 *
 * EL TÍTULO SALE DE `itemsPedido`, NO DE `productos`. Es una foto del momento
 * de la venta: si el proveedor renombra o borra el producto seis meses
 * después, el comprobante tiene que seguir diciendo qué se vendió aquel día.
 *
 * SE PIDE POR TANDA, NO DE UNO EN UNO. La lista de órdenes carga de a 24 con
 * scroll infinito; una consulta por tique serían 24 viajes a la base por
 * pantalla.
 *
 * Los 743 pagos del histórico no tienen pedido asociado (se importaron de la
 * cuenta anterior, donde no existían órdenes). Para esos la lista viene vacía
 * y el comprobante lo dice, en vez de fingir que no hay productos.
 */
export type LineaDeVenta = {
  titulo: string;
  cantidad: number;
  subtotalCentavos: number;
  /** A quién se le compró la mercancía. */
  proveedor: string | null;
  /** De qué depósito sale, para saber dónde se retira. */
  deposito: string | null;
  ciudad: string | null;
};

export async function lineasDePagos(
  idsDePago: string[],
): Promise<Map<string, LineaDeVenta[]>> {
  const porPago = new Map<string, LineaDeVenta[]>();
  if (idsDePago.length === 0) return porPago;

  try {
    const db = getDb();

    const filas = await db
      .select({
        pagoId: pagosZelle.id,
        titulo: itemsPedido.titulo,
        cantidad: itemsPedido.cantidad,
        subtotalCentavos: itemsPedido.subtotalCentavos,
        proveedor: tiendas.nombre,
        deposito: depositos.nombre,
        ciudad: depositos.zona,
      })
      .from(pagosZelle)
      .innerJoin(itemsPedido, eq(itemsPedido.pedidoId, pagosZelle.pedidoId))
      .leftJoin(tiendas, eq(tiendas.id, itemsPedido.tiendaId))
      .leftJoin(productos, eq(productos.id, itemsPedido.productoId))
      .leftJoin(depositos, eq(depositos.id, productos.depositoId))
      .where(inArray(pagosZelle.id, idsDePago));

    for (const f of filas) {
      const lista = porPago.get(f.pagoId) ?? [];
      lista.push({
        titulo: f.titulo,
        cantidad: f.cantidad,
        subtotalCentavos: f.subtotalCentavos,
        proveedor: f.proveedor,
        deposito: f.deposito,
        ciudad: f.ciudad,
      });
      porPago.set(f.pagoId, lista);
    }
    return porPago;
  } catch {
    // Un comprobante sin el detalle es peor que uno completo, pero mucho
    // mejor que una pantalla caída: se devuelve vacío y se sigue.
    return porPago;
  }
}
