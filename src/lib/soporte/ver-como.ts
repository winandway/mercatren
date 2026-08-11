import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

/**
 * VER EL PANEL COMO LO VE UN COMERCIO.
 *
 * ══ EL PROBLEMA QUE RESUELVE ══
 *
 * Un comercio manda una captura y pregunta «¿aquí es donde cargo lo de
 * Colombia?». Del otro lado, quien atiende **no sabe qué está mirando**: el
 * panel del equipo enseña otras secciones, otros botones y otros avisos. La
 * conversación se vuelve un intercambio de suposiciones, y a veces se le
 * responde mal a alguien que está esperando su dinero.
 *
 * Con esto, Soporte elige un comercio y ve su panel **tal cual lo ve él**.
 *
 * ══ LOS TRES CANDADOS ══
 *
 * 1. **Solo el rol `soporte`.** Un validador ve la operación pero no se mete
 *    en la cuenta de nadie.
 * 2. **Se ve, no se actúa.** Mirando se responde la pregunta; actuar en nombre
 *    de otro es una responsabilidad distinta —y un lío distinto— que aquí no
 *    hace falta. Las acciones siguen comprobando el alcance REAL de la sesión,
 *    así que desde este modo no se puede pedir un retiro ni tocar su dinero.
 * 3. **Siempre a la vista.** Mientras está puesto, una franja arriba dice de
 *    quién es el panel que se está mirando. Sin eso, alguien confunde la
 *    pantalla del comercio con la suya y toma una decisión sobre datos que no
 *    son los que creía.
 *
 * ══ POR QUÉ UNA COOKIE Y NO UN PARÁMETRO EN LA DIRECCIÓN ══
 *
 * Porque tiene que sobrevivir a la navegación. La gracia es recorrer el panel
 * entero como el comercio —de Retiros a Órdenes a Mi tienda— y un `?comercio=`
 * se pierde en el primer enlace que no lo arrastre.
 */

/** El nombre es explícito a propósito: se lee en las herramientas del navegador. */
const COOKIE = "mercatren_ver_como";

/** Media hora. Lo suficiente para atender una consulta, no para olvidarlo puesto. */
export const DURACION_SEGUNDOS = 30 * 60;

/**
 * Qué comercio se está mirando, si es que hay alguno.
 *
 * Devuelve solo el identificador. **Quién puede usarlo se comprueba aparte**,
 * en `obtenerAlcance`: esta función no decide permisos, solo lee la cookie.
 */
export const comercioObservado = cache(async (): Promise<string | null> => {
  try {
    const tarro = await cookies();
    const valor = tarro.get(COOKIE)?.value?.trim();
    return valor || null;
  } catch {
    /* En un contexto sin cookies (una ruta estática) no se observa nada. Que
       falle hacia "ninguno" es lo correcto: ante la duda, cada quien ve lo
       suyo. */
    return null;
  }
});

/** Pone o quita el modo. Lo llaman las acciones, que ya comprobaron el rol. */
export async function guardarComercioObservado(
  tiendaId: string | null,
): Promise<void> {
  const tarro = await cookies();

  if (!tiendaId) {
    tarro.delete(COOKIE);
    return;
  }

  tarro.set(COOKIE, tiendaId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}
