import "server-only";

import { cookies, headers } from "next/headers";

import {
  COOKIE_DEL_PAIS,
  mercadoDeLaVisita,
  MERCADO_PRINCIPAL,
  type Mercado,
} from "@/lib/mercado/mercados";

/**
 * EL MERCADO DE ESTA PETICIÓN, LEÍDO DEL DOMINIO POR EL QUE ENTRÓ.
 *
 * Se resuelve DENTRO de las consultas del catálogo, no en cada página: igual
 * que el alcance de los comercios, si dependiera de que cada pantalla se
 * acuerde de pasarlo, la primera pantalla nueva que lo olvide enseñaría el
 * catálogo de un país en el dominio de otro.
 *
 * Si el host no se puede leer (una llamada fuera de una petición), responde
 * el mercado principal: es exactamente lo que ya pasa con cualquier host
 * desconocido.
 *
 * Dentro de mercatren.com, además, manda el país elegido en el selector
 * (España, que todavía no tiene dominio): ver `mercadoDeLaVisita`.
 */
export async function mercadoActual(): Promise<Mercado> {
  try {
    const [cabeceras, galletas] = await Promise.all([headers(), cookies()]);
    return mercadoDeLaVisita(
      cabeceras.get("host"),
      galletas.get(COOKIE_DEL_PAIS)?.value,
    );
  } catch {
    return MERCADO_PRINCIPAL;
  }
}
