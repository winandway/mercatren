import "server-only";

import { eq, sql } from "drizzle-orm";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";

/**
 * La tienda de quien está en sesión, si tiene una.
 *
 * Sirve para saber en qué punto está su alta: recién registrada y esperando
 * aprobación, o ya activa. Devuelve nada para quien no es comercio, que es lo
 * correcto — no todo el que entra al panel tiene tienda.
 */
export async function tiendaDeLaSesion() {
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return null;

  const db = getDb();
  const [fila] = await db
    .select({
      id: tiendas.id,
      nombre: tiendas.nombre,
      slug: tiendas.slug,
      estado: tiendas.estado,
    })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuario.id))
    .limit(1);

  return fila ?? null;
}

/**
 * Los primeros pasos de un comercio, con lo que ya lleva hecho.
 *
 * Un comercio recién aprobado entra a un panel con nueve secciones y no sabe
 * por dónde empezar. Esto le dice las cuatro cosas que tiene que hacer para
 * estar vendiendo, en orden, y cuáles ya están.
 *
 * Cada paso se comprueba contra los datos REALES, no contra una casilla que
 * alguien marcó: si borra su logo, el paso vuelve a estar pendiente. Una lista
 * que se puede marcar sin haber hecho el trabajo no sirve de nada.
 */
export async function primerosPasos() {
  const tienda = await tiendaDeLaSesion();
  if (!tienda) return null;

  const db = getDb();

  const [ficha] = await db
    .select({
      logoClave: tiendas.logoClave,
      descripcionEs: tiendas.descripcionEs,
    })
    .from(tiendas)
    .where(eq(tiendas.id, tienda.id))
    .limit(1);

  const [cuentas] = await db
    .select({
      cargados: sql<number>`COUNT(*)`,
      publicados: sql<number>`SUM(CASE WHEN ${productos.estado} = 'publicado' THEN 1 ELSE 0 END)`,
    })
    .from(productos)
    .where(eq(productos.tiendaId, tienda.id));

  const cargados = Number(cuentas?.cargados ?? 0);
  const publicados = Number(cuentas?.publicados ?? 0);

  return {
    tienda,
    pasos: [
      {
        clave: "marca" as const,
        hecho: Boolean(ficha?.logoClave),
        href: "/panel/mi-tienda" as const,
      },
      {
        clave: "ficha" as const,
        hecho: Boolean(ficha?.descripcionEs?.trim()),
        href: "/panel/mi-tienda" as const,
      },
      {
        clave: "producto" as const,
        hecho: cargados > 0,
        href: "/panel/productos/nuevo" as const,
      },
      {
        clave: "publicar" as const,
        hecho: publicados > 0,
        href: "/panel/productos" as const,
      },
    ],
  };
}
