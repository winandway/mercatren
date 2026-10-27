import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { preguntasProducto } from "@/lib/db/schema";
import { noOcultoPorDenuncias } from "@/lib/moderacion/filtros";
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
      .where(
        and(
          eq(preguntasProducto.productoId, productoId),
          /* Denunciada tres veces: oculta para todos (27 oct 2026). */
          noOcultoPorDenuncias("pregunta", preguntasProducto.id),
        ),
      );

    return recortar(paraMostrar(filas, idioma));
  } catch {
    return [];
  }
}
