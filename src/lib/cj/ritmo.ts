import "server-only";

import { llamarCj, type RespuestaCj } from "@/lib/cj/cliente";

/**
 * CJ ACEPTA UNA LLAMADA POR SEGUNDO. UNA. (ver `descripcion.ts`, 20 ago 2026)
 *
 * Todo lo que le hable a CJ en bucle —la importación masiva, el afinado de
 * precios y tallas— pasa por aquí: 1,2 s entre llamadas (el límite lo cuenta
 * CJ en su reloj, no en el nuestro), un reintento a los 2 s si aun así
 * contesta «too many requests», y el ritmo se paga salga bien o mal.
 */
export const ESPERA_MS = 1200;

export function esperar(ms: number): Promise<void> {
  return new Promise((listo) => setTimeout(listo, ms));
}

export async function llamarCjConRitmo<T>(
  ruta: string,
  opciones?: { metodo?: string; cuerpo?: unknown },
): Promise<RespuestaCj<T>> {
  let respuesta = await llamarCj<T>(ruta, opciones).catch((e) => ({
    ok: false as const,
    motivo: `no contestó: ${String(e)}`,
  }));
  if (!respuesta.ok && /too many requests|qps/i.test(respuesta.motivo)) {
    await esperar(2000);
    respuesta = await llamarCj<T>(ruta, opciones).catch((e) => ({
      ok: false as const,
      motivo: `no contestó: ${String(e)}`,
    }));
  }
  await esperar(ESPERA_MS);
  return respuesta;
}
