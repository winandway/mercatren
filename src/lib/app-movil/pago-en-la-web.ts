import "server-only";

import { getAuth } from "@/lib/auth";
import {
  enlaceDePagoEnLaWeb,
  origenDeLaWebDelPais,
} from "@/lib/app-movil/cobro-en-la-app";
import type { Mercado } from "@/lib/mercado/mercados";

/**
 * EL ENLACE PARA PAGAR EN LA WEB UN PEDIDO HECHO EN LA APP (8 nov 2026).
 *
 * Pide un pase de un solo uso para la sesión de quien llama (la app manda su
 * sesión en la cabecera) y arma el enlace a la página de pago del pedido en
 * la web de su país. Si el pase falla, el enlace va sin pase: la página pide
 * entrar y vuelve sola al pedido. Nunca se queda sin enlace por eso, y el
 * fallo queda en el registro (no en un `catch` mudo).
 */
export async function enlaceParaPagarEnLaWeb(o: {
  peticion: Request;
  mercado: Mercado;
  idioma: "es" | "en";
  numero: string;
}): Promise<string | null> {
  let pase: string | null = null;
  try {
    const auth = await getAuth();
    const r = await auth.api.generateOneTimeToken({
      headers: o.peticion.headers,
    });
    pase = r.token;
  } catch (fallo) {
    console.error("[app] pase al navegador", fallo);
  }
  return enlaceDePagoEnLaWeb({
    origen: origenDeLaWebDelPais(o.peticion.url, o.mercado.dominio),
    idioma: o.idioma,
    numero: o.numero,
    pase,
  });
}
