import "server-only";

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { pedidosProveedor } from "@/lib/db/schema";
import { rastreoDe, type Rastreo } from "@/lib/pedidos/rastreo";

/**
 * LA GUÍA DE UN PEDIDO, LEÍDA DE LA COMPRA AL PROVEEDOR.
 *
 * Quien surte escribe el número de guía en su fila de `pedidos_proveedor`
 * (hoy CJ; mañana el que gane la comparativa de `PLAN-B-PROVEEDORES.md`).
 * Esta es la única puerta para leerlo: el correo, la pantalla del comprador y
 * el despacho automático piden aquí, así que los tres enseñan lo mismo.
 *
 * ══ SI HAY VARIAS COMPRAS, LA ÚLTIMA CON GUÍA ══
 *
 * Un pedido puede haber generado más de una compra al proveedor (una falló y
 * se pidió de nuevo). Solo interesan las que tienen número, y de esas la más
 * reciente: la de la fila fallida apunta a un paquete que no existe.
 *
 * ══ NUNCA REVIENTA ══
 *
 * Es un dato de adorno para el correo y la pantalla: sin él siguen valiendo.
 * Un `null` significa «todavía no hay guía», nunca «se cayó la base».
 */
export async function guiaDelPedido(pedidoId: string): Promise<Rastreo | null> {
  try {
    const [fila] = await getDb()
      .select({
        guia: pedidosProveedor.guia,
        transportista: pedidosProveedor.transportista,
      })
      .from(pedidosProveedor)
      .where(
        and(
          eq(pedidosProveedor.pedidoId, pedidoId),
          isNotNull(pedidosProveedor.guia),
        ),
      )
      .orderBy(desc(pedidosProveedor.actualizadoEn))
      .limit(1);

    return rastreoDe(fila?.guia, fila?.transportista);
  } catch {
    return null;
  }
}
