import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { IA_APAGADA } from "@/lib/en-pausa";
import { configuracion } from "@/lib/db/schema";
import {
  alcanza,
  diaUtc,
  LLAVE_GASTO_IA,
  unidadesGastadas,
} from "@/lib/ia/presupuesto";

/**
 * La cuenta del día del tope de Gemini (ver `presupuesto.ts`).
 *
 * ══ SI NO SE PUEDE LEER LA CUENTA, NO SE GASTA ══
 *
 * Un freno de dinero que se abre cuando falla no es un freno. Si la base no
 * contesta, la llamada a Google no sale: lo peor que pasa es que una tanda se
 * traduce un minuto más tarde.
 */
export async function puedeGastarIa(unidades: number): Promise<boolean> {
  // Con Mercatren en pausa, nada (`lib/en-pausa.ts`).
  if (IA_APAGADA) return false;
  try {
    const [fila] = await getDb()
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(eq(configuracion.clave, LLAVE_GASTO_IA))
      .limit(1);
    return alcanza(unidadesGastadas(fila?.valor, diaUtc(new Date())), unidades);
  } catch (fallo) {
    console.error("[ia] no se pudo leer el tope del día; no se gasta:", fallo);
    return false;
  }
}

/**
 * Anota lo gastado. Se llama DESPUÉS de hablar con Google, haya salido bien
 * o mal: una respuesta con error también se cobra si el modelo trabajó.
 */
export async function anotarGastoIa(unidades: number): Promise<void> {
  try {
    const db = getDb();
    const hoy = diaUtc(new Date());
    const [fila] = await db
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(eq(configuracion.clave, LLAVE_GASTO_IA))
      .limit(1);
    const valor = `${hoy}:${unidadesGastadas(fila?.valor, hoy) + unidades}`;
    await db
      .insert(configuracion)
      .values({ clave: LLAVE_GASTO_IA, valor })
      .onConflictDoUpdate({ target: configuracion.clave, set: { valor } });
  } catch (fallo) {
    console.error("[ia] no se pudo anotar el gasto del día:", fallo);
  }
}
