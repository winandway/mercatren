import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { verificacionTienda } from "@/lib/db/schema";
import {
  estadoDeVerificacion,
  VERIFICACION_POR_DEFECTO,
  type EstadoVerificacion,
} from "@/lib/verificacion/estado";

/**
 * En qué punto de la comprobación está un comercio.
 *
 * Una tienda sin fila todavía —recién creada, o de antes de que esto
 * existiera— cae en `en_observacion`, que es lo seguro: **lo peor que pasa es
 * que no luzca el sello, nunca que se lo lleve sin haberlo ganado.**
 *
 * Y si la consulta falla, también. Un problema de base no puede acabar
 * regalándole a una tienda cualquiera el sello que dice que la comprobamos.
 */
export async function verificacionDe(
  tiendaId: string,
): Promise<EstadoVerificacion> {
  try {
    const [fila] = await getDb()
      .select({ estado: verificacionTienda.estado })
      .from(verificacionTienda)
      .where(eq(verificacionTienda.tiendaId, tiendaId))
      .limit(1);

    return estadoDeVerificacion(fila?.estado);
  } catch {
    return VERIFICACION_POR_DEFECTO;
  }
}
