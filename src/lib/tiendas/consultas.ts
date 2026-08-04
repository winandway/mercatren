import "server-only";

import { eq } from "drizzle-orm";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";

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
