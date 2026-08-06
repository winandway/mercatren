import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { depositos, itemsPedido, productos, tiendas } from "@/lib/db/schema";
import { zonaPorSlug } from "@/lib/entrega/zonas";
import type { PuntoDeRetiro } from "@/lib/pedidos/retiro-formato";

export {
  lineasDeRetiro,
  type PuntoDeRetiro,
} from "@/lib/pedidos/retiro-formato";

/**
 * DÓNDE SE RETIRA LO QUE SE COMPRÓ.
 *
 * Mercatren no envía: el comprador paga desde Estados Unidos y alguien retira
 * la mercancía en el depósito del comercio. Ese dato —la dirección exacta— es
 * lo único que la persona necesita el día que va a buscar su compra, y hasta
 * ahora no salía en ningún correo: había que entrar al sitio a buscarlo.
 *
 * UN PEDIDO PUEDE TENER VARIOS PUNTOS. Si compró un taladro en una ferretería
 * de El Vigía y un casco en una de Caracas, son dos lugares distintos y el
 * correo tiene que decir los dos, con qué se retira en cada uno. Juntarlos en
 * "tu pedido está listo" mandaría a la persona a un solo sitio a buscar algo
 * que está en otro.
 *
 * SE LEE DEL PEDIDO, NO DEL CATÁLOGO DE HOY. El producto puede haber cambiado
 * de depósito desde que se compró; lo que vale es de dónde sale ESTA venta.
 * Por eso se parte de `items_pedido` y de ahí se llega al depósito.
 *
 * NUNCA REVIENTA: si la base no responde o el comercio todavía no cargó su
 * depósito, devuelve lo que pudo. Un correo sin la dirección sigue sirviendo;
 * un correo que no sale por un dato que faltaba, no.
 */

export async function puntosDeRetiro(
  pedidoId: string,
): Promise<PuntoDeRetiro[]> {
  try {
    const db = getDb();

    const filas = await db
      .select({
        titulo: itemsPedido.titulo,
        cantidad: itemsPedido.cantidad,
        comercio: tiendas.nombre,
        // La ciudad libre de la tienda es el respaldo de cuando el producto
        // no tiene depósito asignado — el mismo criterio del filtro por
        // ciudad del catálogo.
        ciudadTienda: tiendas.ciudad,
        depositoNombre: depositos.nombre,
        depositoZona: depositos.zona,
        depositoDireccion: depositos.direccion,
        depositoComoLlegar: depositos.comoLlegar,
      })
      .from(itemsPedido)
      .innerJoin(tiendas, eq(tiendas.id, itemsPedido.tiendaId))
      .leftJoin(productos, eq(productos.id, itemsPedido.productoId))
      .leftJoin(depositos, eq(depositos.id, productos.depositoId))
      .where(eq(itemsPedido.pedidoId, pedidoId));

    /**
     * Se agrupa por depósito, no por comercio: una ferretería con dos
     * depósitos en la misma ciudad son dos direcciones distintas, y mandar a
     * la persona a la que no era es peor que no decirle nada.
     */
    const porPunto = new Map<string, PuntoDeRetiro>();

    for (const f of filas) {
      const llave = `${f.comercio}|${f.depositoNombre ?? ""}|${f.depositoZona ?? f.ciudadTienda ?? ""}`;
      const articulo =
        f.cantidad > 1 ? `${f.titulo} (x${f.cantidad})` : f.titulo;

      const ya = porPunto.get(llave);
      if (ya) {
        ya.articulos.push(articulo);
        continue;
      }

      porPunto.set(llave, {
        comercio: f.comercio,
        deposito: f.depositoNombre,
        ciudad: f.depositoZona
          ? (zonaPorSlug(f.depositoZona)?.nombre ?? f.depositoZona)
          : f.ciudadTienda?.trim() || null,
        direccion: f.depositoDireccion,
        comoLlegar: f.depositoComoLlegar,
        articulos: [articulo],
      });
    }

    return [...porPunto.values()];
  } catch (e) {
    console.error("[retiro] no se pudo armar dónde se retira:", e);
    return [];
  }
}
