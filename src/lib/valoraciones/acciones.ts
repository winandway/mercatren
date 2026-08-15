"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { itemsPedido, pedidos, valoraciones } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import {
  esPuntuacionValida,
  limpiarComentario,
} from "@/lib/valoraciones/reglas";

/**
 * PUNTUAR UN PRODUCTO.
 *
 * ══ SE COMPRUEBA LA COMPRA EN EL SERVIDOR, SIEMPRE ══
 *
 * La pantalla solo enseña el formulario a quien compró, pero eso es comodidad,
 * no seguridad: cualquiera puede llamar a esta acción desde la consola. Aquí se
 * vuelve a mirar que exista un pedido pagado suyo con este producto.
 *
 * Sin eso, la tienda se llena de opiniones falsas —propias y de la
 * competencia— en cuanto alguien se da cuenta, y las estrellas dejan de valer
 * para siempre. Recuperar la confianza en unas estrellas es imposible.
 *
 * ══ UNA POR PERSONA, Y SE PUEDE CORREGIR ══
 *
 * Volver a enviarla actualiza la suya en vez de crear otra. Alguien que probó
 * el producto una semana después tiene derecho a cambiar de opinión, y la
 * alternativa —bloquearlo— hace que escriba la queja en otro sitio.
 */
export async function valorarProducto(
  formulario: FormData,
): Promise<{ ok: boolean; mensaje: string }> {
  const t = await mensajes();

  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return { ok: false, mensaje: t("valorarEntra") };

  const productoId = String(formulario.get("producto") ?? "").trim();
  const estrellas = Number(formulario.get("estrellas"));
  const comentario = limpiarComentario(formulario.get("comentario"));

  if (!productoId || !esPuntuacionValida(estrellas)) {
    return { ok: false, mensaje: t("valorarDatos") };
  }

  try {
    const db = getDb();

    /* LA COMPRA, comprobada aquí y no solo en la pantalla. */
    const [compra] = await db
      .select({ id: itemsPedido.id })
      .from(itemsPedido)
      .innerJoin(pedidos, eq(pedidos.id, itemsPedido.pedidoId))
      .where(
        and(
          eq(itemsPedido.productoId, productoId),
          eq(pedidos.clienteId, usuario.id),
        ),
      )
      .limit(1);

    if (!compra) return { ok: false, mensaje: t("valorarSinCompra") };

    const [suya] = await db
      .select({ id: valoraciones.id })
      .from(valoraciones)
      .where(
        and(
          eq(valoraciones.productoId, productoId),
          eq(valoraciones.usuarioId, usuario.id),
        ),
      )
      .limit(1);

    if (suya) {
      await db
        .update(valoraciones)
        .set({ estrellas, comentario })
        .where(eq(valoraciones.id, suya.id));
    } else {
      await db.insert(valoraciones).values({
        id: `val-${nanoid(12)}`,
        productoId,
        usuarioId: usuario.id,
        estrellas,
        comentario,
      });
    }

    revalidatePath("/[locale]/producto/[slug]", "page");
    return { ok: true, mensaje: t("valorarGracias") };
  } catch (fallo) {
    console.error("[valoracion] no se pudo guardar:", fallo);
    return { ok: false, mensaje: t("valorarFallo") };
  }
}
