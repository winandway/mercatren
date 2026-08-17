import "server-only";

import { headers } from "next/headers";

import {
  mercadoPorHost,
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
 */
export async function mercadoActual(): Promise<Mercado> {
  try {
    const host = (await headers()).get("host");
    return mercadoPorHost(host);
  } catch {
    return MERCADO_PRINCIPAL;
  }
}
