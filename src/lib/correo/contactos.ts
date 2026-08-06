import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { tiendas, user } from "@/lib/db/schema";

/**
 * A QUIÉN SE LE ESCRIBE, dado un comercio o una persona.
 *
 * Los correos salen **en el idioma guardado en la cuenta del destinatario**,
 * no en el de quien dispara la acción: alguien del equipo que trabaja en
 * español puede aprobarle una transferencia a un comercio que se registró en
 * inglés. Por eso siempre hace falta buscar la cuenta, y por eso esa búsqueda
 * vive en un solo sitio en vez de repetirse en cada acción.
 *
 * NUNCA REVIENTA. Un comercio sin dueño asignado (pasa cuando el alta se
 * corta a la mitad) devuelve null y la operación sigue: un cobro pagado no se
 * deshace porque el aviso no encontró a quién escribirle.
 */
export type ContactoCorreo = {
  email: string;
  name: string | null;
  idioma: string | null;
};

/** El dueño de un comercio, para escribirle en su idioma. */
export async function duennoDeTienda(
  tiendaId: string,
): Promise<ContactoCorreo | null> {
  try {
    const db = getDb();
    const [fila] = await db
      .select({ email: user.email, name: user.name, idioma: user.idioma })
      .from(tiendas)
      .innerJoin(user, eq(user.id, tiendas.propietarioId))
      .where(eq(tiendas.id, tiendaId))
      .limit(1);

    return fila ?? null;
  } catch (e) {
    console.error("[contactos] no se pudo buscar al dueño del comercio:", e);
    return null;
  }
}

/** El nombre visible de un comercio, para los avisos internos del equipo. */
export async function nombreDeTienda(tiendaId: string): Promise<string> {
  try {
    const db = getDb();
    const [fila] = await db
      .select({ nombre: tiendas.nombre })
      .from(tiendas)
      .where(eq(tiendas.id, tiendaId))
      .limit(1);

    return fila?.nombre ?? tiendaId;
  } catch {
    return tiendaId;
  }
}

/** Una persona por su id, para escribirle en su idioma. */
export async function contactoDeUsuario(
  usuarioId: string,
): Promise<ContactoCorreo | null> {
  try {
    const db = getDb();
    const [fila] = await db
      .select({ email: user.email, name: user.name, idioma: user.idioma })
      .from(user)
      .where(eq(user.id, usuarioId))
      .limit(1);

    return fila ?? null;
  } catch (e) {
    console.error("[contactos] no se pudo buscar a la persona:", e);
    return null;
  }
}
