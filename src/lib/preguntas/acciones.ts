"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { mensajes } from "@/lib/mensajes";
import { preguntasProducto, productos } from "@/lib/db/schema";

/**
 * Las preguntas y respuestas que escribe el comercio para su producto.
 *
 * ══ POR QUÉ EL COMERCIO PUEDE ESCRIBIR LAS PREGUNTAS ══
 *
 * Y por qué eso NO es lo mismo que inventar una reseña, que fue justo lo que se
 * descartó en `PLAN-CONFIANZA.md`.
 *
 * Una pregunta frecuente escrita por el vendedor es **información del
 * producto**: «mide 3,66 x 6,90», «sirve para 220». Nadie finge ser un cliente
 * satisfecho, no se afirma que a alguien le gustó, y el comprador ve escrito
 * quién responde. Una estrella inventada, en cambio, es una persona falsa
 * diciendo que quedó contenta.
 *
 * La diferencia no es de matiz: una es la ficha técnica, la otra es un
 * testimonio falso.
 */

const entrada = z.object({
  productoId: z.string().trim().min(1),
  /** Vacío al crear. Con valor, se está editando esa pregunta. */
  id: z.string().trim().optional(),
  preguntaEs: z.string().trim().min(3).max(200),
  preguntaEn: z.string().trim().max(200).optional(),
  respuestaEs: z.string().trim().min(3).max(1200),
  respuestaEn: z.string().trim().max(1200).optional(),
  orden: z.coerce.number().int().min(0).max(99).default(0),
});

export type Resultado = { ok: boolean; mensaje: string };

/**
 * El producto tiene que ser DEL COMERCIO que pregunta.
 *
 * Sin esto, cualquier vendedor con sesión podría escribirle preguntas —y
 * respuestas -- al producto de otro comercio. Se comprueba contra el alcance,
 * nunca contra lo que venga en el formulario.
 */
async function suyoOFalla(productoId: string) {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return null;

  const [p] = await getDb()
    .select({ id: productos.id, tiendaId: productos.tiendaId })
    .from(productos)
    .where(eq(productos.id, productoId))
    .limit(1);

  if (!p) return null;
  if (alcance.tipo === "tienda" && p.tiendaId !== alcance.tiendaId) return null;

  return p;
}

export async function guardarPregunta(datos: FormData): Promise<Resultado> {
  /* El aviso sale en el idioma de quien está en el panel, no en el de quien
     escribió el código: el panel se ve en los dos. */
  const t = await mensajes();

  const analisis = entrada.safeParse(Object.fromEntries(datos));
  if (!analisis.success) return { ok: false, mensaje: t("revisaLosDatos") };
  const d = analisis.data;

  const producto = await suyoOFalla(d.productoId);
  if (!producto) return { ok: false, mensaje: t("productoAjeno") };

  const db = getDb();
  const ahora = new Date();

  const campos = {
    preguntaEs: d.preguntaEs,
    preguntaEn: d.preguntaEn || null,
    respuestaEs: d.respuestaEs,
    respuestaEn: d.respuestaEn || null,
    orden: d.orden,
    respondidoEn: ahora,
  };

  if (d.id) {
    /* Se filtra TAMBIÉN por producto: con solo el id, alguien podría mandar el
       de una pregunta ajena y editarla desde su propio formulario. */
    await db
      .update(preguntasProducto)
      .set(campos)
      .where(
        and(
          eq(preguntasProducto.id, d.id),
          eq(preguntasProducto.productoId, d.productoId),
        ),
      );
  } else {
    await db.insert(preguntasProducto).values({
      ...campos,
      id: nanoid(),
      productoId: producto.id,
      tiendaId: producto.tiendaId,
      autor: "comercio",
      estado: "publicada",
      creadoEn: ahora,
    });
  }

  revalidatePath("/[locale]/panel/productos/[id]", "page");
  revalidatePath("/[locale]/producto/[slug]", "page");

  return { ok: true, mensaje: t("preguntaGuardada") };
}

/**
 * Quitar una pregunta.
 *
 * Se BORRA de verdad, no se oculta. Es distinto de un producto —que puede tener
 * pedidos viejos colgando— o de una reseña de un cliente, que no es nuestra
 * para esconderla: esto es un texto que el comercio escribió y del que se
 * arrepintió.
 */
export async function borrarPregunta(
  id: string,
  productoId: string,
): Promise<Resultado> {
  const t = await mensajes();

  if (!(await suyoOFalla(productoId))) {
    return { ok: false, mensaje: t("productoAjeno") };
  }

  await getDb()
    .delete(preguntasProducto)
    .where(
      and(
        eq(preguntasProducto.id, id),
        eq(preguntasProducto.productoId, productoId),
      ),
    );

  revalidatePath("/[locale]/panel/productos/[id]", "page");
  revalidatePath("/[locale]/producto/[slug]", "page");

  return { ok: true, mensaje: t("preguntaQuitada") };
}
