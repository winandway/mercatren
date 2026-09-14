import "server-only";

import { and, asc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";

import { FUENTE_CJ } from "@/lib/cj/constantes";
import { descripcionDeCj } from "@/lib/cj/descripcion";
import { getDb } from "@/lib/db";
import { intentosDescripcion, productos } from "@/lib/db/schema";
import { traducirDescripciones } from "@/lib/traduccion/modelo";

/**
 * ══ UNA DESCRIPCIÓN DE CJ POR LATIDO, PARA TODAS LAS PLAZAS (14 sep 2026) ══
 *
 * El reloj TRADUCÍA descripciones, pero nadie las TRAÍA: pedírselas a CJ
 * era un botón del panel, por tandas de cinco, en la plaza del selector.
 * Resultado medido: 1.245 fichas de Chile a la venta sin descripción en
 * ningún idioma, y nadie iba a pulsar ese botón 250 veces.
 *
 * Esto pide UNA descripción por latido —de cualquier plaza, la ficha
 * publicada más vieja que no tenga texto ni intento previo— y la traduce
 * en el acto. Cuesta 10 puntos de CJ por ficha: por eso cede cuando CJ
 * está sin puntos, y por eso es una y no cinco. A ese ritmo, Chile queda
 * completo en unos días sin robarle el presupuesto al afinado.
 *
 * **El texto sale de CJ o no sale.** Igual que en el panel: si CJ no trae
 * descripción, el motivo queda en `intentos_descripcion` y la ficha se
 * queda sin texto. Nunca se inventa a partir de la foto ni del título.
 */
export async function traerDescripcionDesdeElReloj(): Promise<{
  traidas: number;
  sinDatos: number;
  faltan: number;
}> {
  const db = getDb();
  const [p] = await db
    .select({ id: productos.id, externoId: productos.externoId })
    .from(productos)
    .leftJoin(
      intentosDescripcion,
      eq(intentosDescripcion.productoId, productos.id),
    )
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        eq(productos.estado, "publicado"),
        isNotNull(productos.externoId),
        isNull(intentosDescripcion.productoId),
        or(
          isNull(productos.descripcionEn),
          eq(sql`trim(${productos.descripcionEn})`, ""),
        ),
      ),
    )
    .orderBy(asc(productos.creadoEn))
    .limit(1)
    .catch(() => []);
  if (!p?.externoId) return { traidas: 0, sinDatos: 0, faltan: 0 };

  const ahora = new Date();
  const r = await descripcionDeCj(p.externoId);
  if (!r.ok) {
    await db
      .insert(intentosDescripcion)
      .values({ productoId: p.id, motivo: r.motivo, intentadoEn: ahora })
      .onConflictDoUpdate({
        target: intentosDescripcion.productoId,
        set: { motivo: r.motivo, intentadoEn: ahora },
      })
      .catch(() => undefined);
    return { traidas: 0, sinDatos: 1, faltan: await cuantosFaltan(db) };
  }

  await db
    .update(productos)
    .set({ descripcionEn: r.texto, actualizadoEn: ahora })
    .where(eq(productos.id, p.id));

  /* El español en el acto; si el traductor falla, el inglés ya quedó y el
     paso de traducción del propio reloj lo reintenta. */
  const t = await traducirDescripciones([{ id: p.id, textoEn: r.texto }]);
  if (t.ok && t.traducciones[0]) {
    await db
      .update(productos)
      .set({ descripcionEs: t.traducciones[0].texto, actualizadoEn: ahora })
      .where(eq(productos.id, p.id))
      .catch(() => undefined);
  }
  return { traidas: 1, sinDatos: 0, faltan: await cuantosFaltan(db) };
}

async function cuantosFaltan(db: ReturnType<typeof getDb>): Promise<number> {
  const [f] = await db
    .select({ n: sql<number>`count(*)` })
    .from(productos)
    .leftJoin(
      intentosDescripcion,
      eq(intentosDescripcion.productoId, productos.id),
    )
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        eq(productos.estado, "publicado"),
        isNotNull(productos.externoId),
        isNull(intentosDescripcion.productoId),
        or(
          isNull(productos.descripcionEn),
          eq(sql`trim(${productos.descripcionEn})`, ""),
        ),
      ),
    )
    .catch(() => []);
  return Number(f?.n ?? 0);
}
