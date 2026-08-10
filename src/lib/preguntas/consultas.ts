import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { preguntasProducto } from "@/lib/db/schema";
import {
  paraMostrar,
  recortar,
  type Pregunta,
  type PreguntaVisible,
} from "@/lib/preguntas/reglas";

/**
 * Las preguntas de un producto, listas para dibujar.
 *
 * Si la consulta falla se devuelve una lista vacía: el bloque desaparece y la
 * ficha se ve como antes. Un problema de base **no puede tumbar la página de
 * un producto**, que es donde se vende.
 */
export async function preguntasDe(
  productoId: string,
  idioma: string,
): Promise<PreguntaVisible[]> {
  try {
    /* Se nombran las columnas una por una: pedir la tabla entera lista TODAS
       las del esquema, y una base que ya existe puede no tener la última
       agregada. Eso tumbó las fichas el 5 ago 2026. */
    const filas: Pregunta[] = await getDb()
      .select({
        id: preguntasProducto.id,
        preguntaEs: preguntasProducto.preguntaEs,
        preguntaEn: preguntasProducto.preguntaEn,
        respuestaEs: preguntasProducto.respuestaEs,
        respuestaEn: preguntasProducto.respuestaEn,
        autor: preguntasProducto.autor,
        orden: preguntasProducto.orden,
        estado: preguntasProducto.estado,
      })
      .from(preguntasProducto)
      .where(eq(preguntasProducto.productoId, productoId));

    return recortar(paraMostrar(filas, idioma));
  } catch {
    return [];
  }
}
