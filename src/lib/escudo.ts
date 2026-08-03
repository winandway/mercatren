import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Comprobacion del escudo anti-robots (Cloudflare Turnstile), en el servidor.
 *
 * LO QUE DE VERDAD PROTEGE ES ESTO. El recuadro del navegador solo pide el
 * pase; cualquiera puede saltarselo y hablarle directo al servidor. Por eso el
 * pase se comprueba aqui contra Cloudflare antes de mirar la contrasena.
 *
 * Cada pase sirve UNA sola vez: si alguien intenta reusar el mismo para probar
 * miles de contrasenas, Cloudflare lo rechaza a partir del segundo intento.
 * Eso es justo lo que corta la fuerza bruta.
 *
 * SI NO ESTA CONFIGURADO, NO EXIGE NADA. Sin `TURNSTILE_SECRETO` no hay con
 * que comprobar, asi que se deja pasar y la entrada funciona como siempre. La
 * alternativa —cerrar la puerta a todo el mundo porque falta una variable— es
 * peor. En cuanto la clave este cargada, empieza a exigirlo solo.
 */

const COMPROBAR = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type ResultadoEscudo =
  { ok: true } | { ok: false; motivo: "sin-pase" | "pase-invalido" };

export async function comprobarEscudo(
  pase: string | null | undefined,
  ip?: string | null,
): Promise<ResultadoEscudo> {
  const { env } = getCloudflareContext();
  const secreto = env.TURNSTILE_SECRETO;

  // Sin secreto no hay escudo: ver el comentario de arriba.
  if (!secreto) return { ok: true };

  if (!pase) return { ok: false, motivo: "sin-pase" };

  try {
    const cuerpo = new FormData();
    cuerpo.append("secret", secreto);
    cuerpo.append("response", pase);
    if (ip) cuerpo.append("remoteip", ip);

    const respuesta = await fetch(COMPROBAR, { method: "POST", body: cuerpo });
    const datos = (await respuesta.json()) as { success?: boolean };

    return datos.success
      ? { ok: true }
      : { ok: false, motivo: "pase-invalido" };
  } catch {
    /**
     * Si Cloudflare no responde, se deja pasar.
     *
     * Es una decision a proposito: el escudo es una capa de mas, no la unica.
     * Detras siguen estando la contrasena y el rol. Bloquear la entrada de
     * todos los comercios porque un servicio de terceros tuvo un mal minuto
     * seria cambiar un riesgo pequeno por una caida completa.
     */
    return { ok: true };
  }
}
