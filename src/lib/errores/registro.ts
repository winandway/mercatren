import "server-only";

import { eq, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { erroresSistema } from "@/lib/db/schema";

/**
 * EL HISTORIAL DE FALLOS: ESCRIBIRLO Y LEERLO (3 sep 2026).
 *
 * Lo pidió el dueño: «un historial de bugs donde podamos ver todo eso y
 * controlarlos, y que tú misma tengas acceso a él». Antes cada fallo se
 * quedaba en `console.error`, o sea en los registros de la plataforma: él
 * no los mira y yo, en otra sesión, no los puedo leer.
 *
 * ══ TRES REGLAS ══
 *
 * 1. **Registrar un fallo NUNCA puede fallar.** Va todo en su propio try:
 *    si la base está caída, se pierde el apunte, no la operación.
 * 2. **Se agrupa por firma**, no por ocurrencia: el mismo fallo mil veces
 *    es una fila con su contador. Si no, la tabla crece sin freno y el
 *    historial deja de leerse.
 * 3. **Nada de secretos en el detalle**: se guarda el mensaje del error,
 *    recortado. Quien llama no debe pasarle tokens ni claves.
 */

/** El texto sin lo que cambia en cada ocurrencia: ids, números, fechas. */
export function firmaDe(origen: string, mensaje: string): string {
  const limpio = mensaje
    .toLowerCase()
    .replace(/[0-9a-f]{8,}/g, "#")
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${origen}::${limpio}`;
}

function textoDe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error).slice(0, 300);
  } catch {
    return String(error);
  }
}

/**
 * Anota un fallo. Se llama desde los `catch` que hoy solo hacen
 * `console.error` — el console se queda, porque en desarrollo es lo que se
 * ve al momento.
 */
export async function registrarError(
  origen: string,
  error: unknown,
  detalle?: string,
): Promise<void> {
  try {
    const mensaje = textoDe(error).slice(0, 300);
    const ahora = new Date();
    await getDb()
      .insert(erroresSistema)
      .values({
        clave: firmaDe(origen, mensaje),
        origen,
        mensaje,
        detalle: detalle?.slice(0, 300) ?? null,
        veces: 1,
        primeraVezEn: ahora,
        ultimaVezEn: ahora,
      })
      .onConflictDoUpdate({
        target: erroresSistema.clave,
        set: {
          mensaje,
          detalle: detalle?.slice(0, 300) ?? null,
          veces: sql`${erroresSistema.veces} + 1`,
          ultimaVezEn: ahora,
          /* Si vuelve a pasar, deja de estar resuelto. */
          resueltoEn: null,
        },
      });
  } catch (fallo) {
    console.error("[errores] no se pudo anotar el fallo:", fallo);
  }
}

export type ErrorVista = {
  clave: string;
  origen: string;
  mensaje: string;
  detalle: string | null;
  veces: number;
  primeraVezMs: number;
  ultimaVezMs: number;
  resuelto: boolean;
};

/** Los fallos sin resolver, del más reciente al más viejo. */
export async function historialDeErrores(
  limite = 40,
  soloAbiertos = true,
): Promise<ErrorVista[]> {
  try {
    const filas = await getDb()
      .select()
      .from(erroresSistema)
      .where(soloAbiertos ? isNull(erroresSistema.resueltoEn) : sql`1 = 1`)
      .orderBy(sql`${erroresSistema.ultimaVezEn} desc`)
      .limit(limite);
    return filas.map((f) => ({
      clave: f.clave,
      origen: f.origen,
      mensaje: f.mensaje,
      detalle: f.detalle,
      veces: f.veces,
      primeraVezMs: f.primeraVezEn.getTime(),
      ultimaVezMs: f.ultimaVezEn.getTime(),
      resuelto: f.resueltoEn !== null,
    }));
  } catch {
    return [];
  }
}

/** Cuántos fallos distintos siguen abiertos, y cuántas veces en total. */
export async function resumenDeErrores(): Promise<{
  distintos: number;
  veces: number;
}> {
  try {
    const [f] = await getDb()
      .select({
        distintos: sql<number>`count(*)`,
        veces: sql<number>`coalesce(sum(${erroresSistema.veces}), 0)`,
      })
      .from(erroresSistema)
      .where(isNull(erroresSistema.resueltoEn));
    return {
      distintos: Number(f?.distintos ?? 0),
      veces: Number(f?.veces ?? 0),
    };
  } catch {
    return { distintos: 0, veces: 0 };
  }
}

/** «Ya lo arreglé»: se marca resuelto. Si vuelve a pasar, reaparece solo. */
export async function marcarErrorResuelto(clave: string): Promise<void> {
  await getDb()
    .update(erroresSistema)
    .set({ resueltoEn: new Date() })
    .where(eq(erroresSistema.clave, clave));
}
