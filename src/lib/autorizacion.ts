import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";

import { comercioEfectivo, type Alcance } from "@/lib/alcance";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { tiendas, type Rol } from "@/lib/db/schema";

export { comercioEfectivo, type Alcance };

/**
 * Quien puede ver que.
 *
 * Mercatren es un servicio para MUCHOS comercios. Un vendedor solo puede ver
 * sus propios pagos y su propio saldo; el equipo de soporte ve todo.
 *
 * IMPORTANTE: la comprobacion se hace en las CONSULTAS, no solo en la pantalla.
 * En Next, el menu y la pagina se arman a la vez, asi que un redirect en el
 * menu no impide que la pagina alcance a leer la base. Si el permiso se
 * comprueba donde se sacan los datos, no hay forma de que se escapen.
 */

/** Roles que abren el panel. Cada uno ve una parte distinta. */
export const ROLES_PANEL: Rol[] = ["soporte", "validador", "vendedor"];

/** Roles del equipo de Mercatren: ven la operacion completa. */
export const ROLES_INTERNOS: Rol[] = ["soporte", "validador"];

/** La sesion de esta peticion. Se consulta una sola vez por peticion. */
export const obtenerSesion = cache(async () => {
  return getAuth().api.getSession({ headers: await headers() });
});

export const obtenerUsuario = cache(async () => {
  const sesion = await obtenerSesion();
  if (!sesion?.user) return null;
  return sesion.user as typeof sesion.user & { rol?: Rol };
});

export async function tienePermisoDePanel() {
  const usuario = await obtenerUsuario();
  return Boolean(usuario?.rol && ROLES_PANEL.includes(usuario.rol));
}

export async function esEquipoInterno() {
  const usuario = await obtenerUsuario();
  return Boolean(usuario?.rol && ROLES_INTERNOS.includes(usuario.rol));
}

/**
 * Hasta donde puede ver quien pregunta.
 *
 * Corta la operacion si no tiene permiso, y si es un vendedor sin comercio
 * asignado tambien: mas vale no mostrar nada que mostrar lo de otro.
 */
export const obtenerAlcance = cache(async (): Promise<Alcance> => {
  const usuario = await obtenerUsuario();
  const rol = usuario?.rol;

  if (!usuario || !rol || !ROLES_PANEL.includes(rol)) {
    throw new Error(
      "Sin permiso para ver el panel: hace falta una cuenta con acceso.",
    );
  }

  if (ROLES_INTERNOS.includes(rol)) {
    return { tipo: "todos", rol };
  }

  // Un vendedor solo ve la tienda de la que es dueno.
  const db = getDb();
  const [tienda] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuario.id))
    .limit(1);

  if (!tienda) {
    throw new Error(
      "Esta cuenta todavia no tiene un comercio asignado. Escribe a soporte.",
    );
  }

  return { tipo: "tienda", rol, tiendaId: tienda.id };
});

/** Corta si quien pregunta no es del equipo de Mercatren. */
export async function exigirEquipoInterno() {
  if (!(await esEquipoInterno())) {
    throw new Error("Esta parte es solo para el equipo de Mercatren.");
  }
}
