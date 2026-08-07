import { eq, sql } from "drizzle-orm";

import type { getDb } from "@/lib/db";
import { seriesDocumento } from "@/lib/db/schema";
import { formatearNumero, type Serie } from "@/lib/facturas/numeracion";

/**
 * TOMAR EL SIGUIENTE NÚMERO DE UNA SERIE, de forma atómica.
 *
 * Vive aparte de `numeracion.ts` porque esto sí toca la base y aquello no. El
 * porqué del diseño está escrito allá; aquí va cómo se ejecuta.
 *
 * `UPDATE ... SET ultimo = ultimo + 1 RETURNING` es **una sola operación
 * atómica** en SQLite: dos peticiones a la vez reciben números distintos,
 * siempre, sin bloqueos ni reintentos. Comprobado contra la base local, no
 * solo razonado.
 *
 * ══ LO QUE ESTO NO GARANTIZA, Y HAY QUE SABERLO ══
 *
 * Que no se repita, lo garantiza. Que no haya huecos, casi: si se toma un
 * número y después falla la inserción del documento, ese número queda sin
 * usar. Es el mismo comportamiento de cualquier sistema de facturación serio,
 * y es el lado correcto en el que equivocarse — mejor un hueco explicable que
 * dos facturas con el mismo número.
 */
export async function siguienteNumero(
  db: ReturnType<typeof getDb>,
  serie: Serie,
): Promise<string> {
  /* La serie se crea sola la primera vez. `onConflictDoNothing` hace que dos
     llamadas simultáneas no choquen al crearla. */
  await db
    .insert(seriesDocumento)
    .values({ id: serie.id, prefijo: serie.prefijo, ultimo: 0 })
    .onConflictDoNothing();

  const [fila] = await db
    .update(seriesDocumento)
    .set({ ultimo: sql`${seriesDocumento.ultimo} + 1` })
    .where(eq(seriesDocumento.id, serie.id))
    .returning({ ultimo: seriesDocumento.ultimo });

  if (!fila) {
    throw new Error(`No se pudo tomar número de la serie ${serie.id}`);
  }

  return formatearNumero(serie.prefijo, fila.ultimo);
}
