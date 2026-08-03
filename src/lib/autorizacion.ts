import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { getAuth } from "@/lib/auth";
import type { Rol } from "@/lib/db/schema";

/**
 * Quien puede ver que.
 *
 * IMPORTANTE: la comprobacion se hace en las CONSULTAS, no solo en la pantalla.
 * En Next, el menu y la pagina se arman a la vez, asi que un redirect en el
 * menu no impide que la pagina alcance a leer la base. Si el permiso se
 * comprueba donde se sacan los datos, no hay forma de que se escapen.
 */

/** Roles que abren el panel de administracion. */
export const ROLES_PANEL: Rol[] = ["soporte", "validador"];

/** La sesion de esta peticion. Se consulta una sola vez por peticion. */
export const obtenerSesion = cache(async () => {
  return getAuth().api.getSession({ headers: await headers() });
});

export async function tienePermisoDePanel() {
  const sesion = await obtenerSesion();
  const rol = (sesion?.user as { rol?: Rol } | undefined)?.rol;
  return Boolean(sesion?.user && rol && ROLES_PANEL.includes(rol));
}

/**
 * Corta la operacion si quien pregunta no tiene permiso.
 * Toda consulta que devuelva dinero o datos de pagadores empieza por aqui.
 */
export async function exigirPermisoDePanel() {
  if (!(await tienePermisoDePanel())) {
    throw new Error(
      "Sin permiso para ver el panel: hace falta una cuenta de soporte o de validador.",
    );
  }
}
