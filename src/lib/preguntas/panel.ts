import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { preguntasProducto } from "@/lib/db/schema";
import type { PreguntaDelPanel } from "@/components/panel/preguntas-producto";

/**
 * Las preguntas de un producto, como las ve el comercio en su panel.
 *
 * A diferencia de la consulta publica, aqui SI salen las que todavia no tienen
 * respuesta: son justo las que el comercio tiene que atender.
 *
 * Si falla se devuelve vacio en vez de tumbar la pantalla de edicion, que es
 * donde el comercio tiene su trabajo a medio escribir.
 */
export async function preguntasDelPanel(
  productoId: string,
): Promise<PreguntaDelPanel[]> {
  try {
    return await getDb()
      .select({
        id: preguntasProducto.id,
        preguntaEs: preguntasProducto.preguntaEs,
        preguntaEn: preguntasProducto.preguntaEn,
        respuestaEs: preguntasProducto.respuestaEs,
        respuestaEn: preguntasProducto.respuestaEn,
        orden: preguntasProducto.orden,
      })
      .from(preguntasProducto)
      .where(eq(preguntasProducto.productoId, productoId))
      .orderBy(asc(preguntasProducto.orden), asc(preguntasProducto.id));
  } catch {
    return [];
  }
}
