import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { configuracion } from "@/lib/db/schema";

/**
 * ══ UNA COLA QUE SE CALCULA UNA VEZ Y SE CONSUME POR LATIDOS ══
 * (emergencia de costo, 18 sep 2026)
 *
 * El patrón que arregló el afinado y el stock, hecho pieza: un trabajo de
 * fondo que necesita «los N siguientes» de una consulta cara (recorre y
 * ordena el catálogo entero) NO la corre en cada latido. La corre una vez,
 * guarda la lista de ids en `configuracion`, y cada latido toma los suyos
 * de la lista. Cuando la lista se acaba, o pasa la vigencia, se rehace.
 *
 * Quien consume los ids los vuelve a mirar por id con la condición de la
 * cola (pocas filas): lo que dejó de estar pendiente entre el cálculo y el
 * consumo no se trabaja dos veces.
 *
 * `firma` es para las colas cuyo orden depende de algo que puede cambiar
 * (una lista de prioridad): si cambia, la lista se rehace.
 */

type ColaEnDisco = {
  ids: string[];
  calculadaEn: number;
  firma: string;
};

async function leer(llave: string): Promise<ColaEnDisco | null> {
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, llave))
    .limit(1)
    .catch(() => []);
  if (!fila) return null;
  try {
    const c = JSON.parse(fila.valor) as Partial<ColaEnDisco>;
    if (!Array.isArray(c.ids) || typeof c.calculadaEn !== "number") return null;
    return {
      ids: c.ids.filter((x): x is string => typeof x === "string"),
      calculadaEn: c.calculadaEn,
      firma: typeof c.firma === "string" ? c.firma : "",
    };
  } catch {
    return null;
  }
}

async function guardar(llave: string, cola: ColaEnDisco): Promise<void> {
  const valor = JSON.stringify(cola);
  await getDb()
    .insert(configuracion)
    .values({ clave: llave, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } })
    .catch(() => undefined);
}

export async function tomarDeCola(o: {
  llave: string;
  /** Pasado esto, la lista se rehace aunque queden ids. */
  vigenciaMs: number;
  /** Cuántos ids se toman en este latido. */
  cuantos: number;
  /** La consulta cara: los ids en orden, hasta el tope guardable. */
  calcular: () => Promise<string[]>;
  firma?: string;
}): Promise<{
  ids: string[];
  /** Cuántos quedan en la lista después de este turno. */
  quedan: number;
  recalculada: boolean;
}> {
  const firma = o.firma ?? "";
  const ahora = Date.now();
  let cola = await leer(o.llave);
  let recalculada = false;
  const vale =
    cola !== null &&
    cola.firma === firma &&
    ahora - cola.calculadaEn <= o.vigenciaMs &&
    cola.ids.length > 0;
  if (!vale) {
    /* Una lista vacía y fresca se respeta: si la consulta cara no devolvió
       nada, no se repite cada minuto; se vuelve a intentar a la vigencia. */
    const vaciaYFresca =
      cola !== null &&
      cola.firma === firma &&
      cola.ids.length === 0 &&
      ahora - cola.calculadaEn <= o.vigenciaMs;
    if (vaciaYFresca) return { ids: [], quedan: 0, recalculada: false };
    cola = { ids: await o.calcular(), calculadaEn: ahora, firma };
    recalculada = true;
  }
  const turno = cola!.ids.slice(0, Math.max(0, o.cuantos));
  const resto = cola!.ids.slice(turno.length);
  /* Se saca de la lista ANTES de trabajar: si el latido se corta, lo que
     faltó vuelve en la lista siguiente, no en esta. */
  await guardar(o.llave, { ...cola!, ids: resto });
  return { ids: turno, quedan: resto.length, recalculada };
}

/** Para las pruebas y para forzar un recálculo (p. ej. tras un cambio). */
export async function olvidarCola(llave: string): Promise<void> {
  await getDb()
    .delete(configuracion)
    .where(eq(configuracion.clave, llave))
    .catch(() => undefined);
}
