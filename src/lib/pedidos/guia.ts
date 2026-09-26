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

/**
 * LA GUÍA Y SI VA A LLEGAR UNA (25 sep 2026).
 *
 * `guiaDelPedido` dice si YA hay guía. La pantalla necesita además saber si va
 * a haber una: solo sale de una compra al proveedor en marcha (por pagar,
 * pagada o enviada). La MT-000014 tenía la suya cerrada como prueba y la
 * pantalla le prometía «aparece aquí en cuanto salga» para siempre.
 *
 * Trae todas las compras de ese pedido —son una o dos— y decide en código.
 * Nunca revienta: sin base, no hay guía y no se promete nada.
 */
export async function envioDelPedido(
  pedidoId: string,
): Promise<{ rastreo: Rastreo | null; compraEnMarcha: boolean }> {
  try {
    const { COMPRA_EN_MARCHA } = await import("@/lib/pedidos/rastreo");
    const filas = await getDb()
      .select({
        guia: pedidosProveedor.guia,
        transportista: pedidosProveedor.transportista,
        estado: pedidosProveedor.estado,
        actualizadoEn: pedidosProveedor.actualizadoEn,
      })
      .from(pedidosProveedor)
      .where(eq(pedidosProveedor.pedidoId, pedidoId));

    const conGuia = filas
      .filter((f) => f.guia)
      .sort((a, b) => b.actualizadoEn.getTime() - a.actualizadoEn.getTime())[0];

    return {
      rastreo: rastreoDe(conGuia?.guia, conGuia?.transportista),
      compraEnMarcha: filas.some((f) =>
        (COMPRA_EN_MARCHA as readonly string[]).includes(f.estado),
      ),
    };
  } catch {
    return { rastreo: null, compraEnMarcha: false };
  }
}
