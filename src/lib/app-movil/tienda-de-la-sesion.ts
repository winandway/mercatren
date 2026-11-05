import "server-only";

import { eq } from "drizzle-orm";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";

/**
 * La tienda de quien tiene la sesión (la app no dice cuál: sale de la
 * sesión, siempre). `null` sin sesión o sin tienda.
 */
export async function tiendaDeLaSesion(): Promise<
  | { ok: true; tiendaId: string; usuarioId: string }
  | { ok: false; motivo: "sin_sesion" | "sin_tienda" }
> {
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return { ok: false, motivo: "sin_sesion" };
  const [tienda] = await getDb()
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuario.id))
    .limit(1);
  if (!tienda) return { ok: false, motivo: "sin_tienda" };
  return { ok: true, tiendaId: tienda.id, usuarioId: usuario.id };
}
