import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import {
  MERCADO_PRINCIPAL,
  mercadoPorCodigo,
  type Mercado,
} from "@/lib/mercado/mercados";

/**
 * EL PAÍS QUE ESTÁ MIRANDO EL PANEL (fase 4 del plan multi-país).
 *
 * ══ EL SELECTOR ES COMODIDAD; EL MURO ES ESTO ══
 *
 * Elegir el país en una pantalla no protege nada: lo que protege es que el
 * país viva en la SESIÓN del servidor y que toda consulta use ESE. Si un
 * parámetro de la dirección pudiera cambiarlo, el selector sería un adorno —
 * cualquiera escribiría `?mercado=CL` y vería lo que no le toca.
 *
 * Por eso vive en una cookie que solo escribe el servidor después de
 * comprobar el rol, igual que «ver su panel» (`soporte/ver-como.ts`). La
 * cookie es una PREFERENCIA de pantalla, no un permiso: quién puede cambiarla
 * se comprueba aquí dentro, en cada lectura.
 *
 * ══ POR QUÉ UNA COOKIE Y NO LA DIRECCIÓN ══
 *
 * Misma razón que «ver su panel»: tiene que sobrevivir a la navegación. La
 * gracia es recorrer el panel entero mirando un país —de Comercios a Órdenes
 * a Cobros— y un `?mercado=` se pierde en el primer enlace que no lo arrastre.
 *
 * ══ SOLO SOPORTE, Y COMPROBADO EN CADA LECTURA ══
 *
 * No basta con comprobar el rol al escribir la cookie. Una cuenta a la que le
 * bajen el rol seguiría con su cookie puesta, y seguiría viendo otro país
 * hasta que caducara. Se comprueba al LEER, que es cuando importa.
 */

/** Explícito a propósito: se lee en las herramientas del navegador. */
const COOKIE = "mercatren_panel_mercado";

/** Ocho horas: una jornada. No es una sesión, es una preferencia de pantalla. */
export const DURACION_SEGUNDOS = 8 * 60 * 60;

/**
 * El mercado que el panel está mirando.
 *
 * Sin cookie —o sin permiso para tenerla— responde el principal, que es lo
 * que ve hoy todo el equipo. **Fallar hacia el principal es lo correcto**: es
 * el mercado con datos, así que un fallo se nota enseguida; hacia un país
 * vacío, el panel saldría en blanco y parecería que se perdió la información.
 */
export const mercadoDelPanel = cache(async (): Promise<Mercado> => {
  try {
    /* El permiso se comprueba al LEER, no solo al escribir: a quien le bajen
       el rol se le deja de respetar la cookie en el acto. */
    if (!(await esSoporteDeVerdad())) return MERCADO_PRINCIPAL;

    const valor = (await cookies()).get(COOKIE)?.value?.trim();
    if (!valor) return MERCADO_PRINCIPAL;

    /* `mercadoPorCodigo` sale de la lista cerrada: un código inventado en la
       cookie cae en el principal, no en un mercado fantasma. */
    return mercadoPorCodigo(valor);
  } catch {
    return MERCADO_PRINCIPAL;
  }
});

/**
 * Guarda el mercado elegido. Lo llama la acción, que ya comprobó el rol.
 *
 * `null` lo devuelve al principal borrando la cookie, en vez de escribir «US»:
 * así, quien nunca tocó el selector y quien volvió al principal tienen
 * exactamente el mismo estado, y no hay dos formas de significar lo mismo.
 */
export async function guardarMercadoDelPanel(
  codigo: string | null,
): Promise<void> {
  const tarro = await cookies();

  if (!codigo || mercadoPorCodigo(codigo).codigo === MERCADO_PRINCIPAL.codigo) {
    tarro.delete(COOKIE);
    return;
  }

  tarro.set(COOKIE, mercadoPorCodigo(codigo).codigo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

/**
 * ¿Hay que avisar de que NO se está mirando el mercado principal?
 *
 * Lo peligroso no es cambiar de país: es **olvidar que lo cambiaste**. Quien
 * mire «0 ventas» creyendo que está en el principal va a pensar que se cayó
 * algo. La franja se enseña siempre que el mercado no sea el principal, y no
 * se puede cerrar — misma regla que la de «ver su panel».
 */
export function hayQueAvisarDelMercado(mercado: Mercado): boolean {
  return mercado.codigo !== MERCADO_PRINCIPAL.codigo;
}
