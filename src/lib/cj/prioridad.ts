import "server-only";

import { eq } from "drizzle-orm";

import { getDb, type Db } from "@/lib/db";
import { configuracion } from "@/lib/db/schema";
import { agregarAPrioridad, leerLista } from "@/lib/cj/prioridad-pura";

export {
  agregarAPrioridad,
  leerLista,
  TOPE_PRIORIDAD,
} from "@/lib/cj/prioridad-pura";

/**
 * ══ «PÓNGALOS A LA CABEZA DE LA FILA» (9 sep 2026) ══
 *
 * El afinado recorre 46.000 productos en el orden que decide él. Cuando una
 * persona necesita uno concreto YA —Richard con los monitores de estudio que
 * un cliente llevaba días pidiendo—, no hay que esperar a que le toque: se
 * anota aquí y el afinado lo toma primero en su próxima vuelta, tenga la
 * fecha que tenga y haya fallado antes o no.
 *
 * Vive en `configuracion` como una lista corta de ids (JSON). Se sale de la
 * lista al afinarse bien; si falla, se queda y se reintenta en la siguiente
 * vuelta, porque para eso se pidió.
 */
export const LLAVE_AFINAR_PRIMERO = "cj_afinar_primero";

export async function leerPrioridad(db: Db = getDb()): Promise<string[]> {
  const [fila] = await db
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVE_AFINAR_PRIMERO))
    .limit(1)
    .catch(() => []);
  return leerLista(fila?.valor);
}

async function guardarPrioridad(db: Db, lista: string[]): Promise<void> {
  const valor = JSON.stringify(lista);
  await db
    .insert(configuracion)
    .values({ clave: LLAVE_AFINAR_PRIMERO, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } });
}

export async function priorizarProducto(
  productoId: string,
  db: Db = getDb(),
): Promise<string[]> {
  const nueva = agregarAPrioridad(await leerPrioridad(db), productoId);
  await guardarPrioridad(db, nueva);
  return nueva;
}

export async function quitarDePrioridad(
  productoId: string,
  db: Db = getDb(),
): Promise<void> {
  const actual = await leerPrioridad(db);
  if (!actual.includes(productoId)) return;
  await guardarPrioridad(
    db,
    actual.filter((x) => x !== productoId),
  );
}
