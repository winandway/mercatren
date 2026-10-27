import {
  COOKIE_DEL_PAIS,
  DURACION_COOKIE_DEL_PAIS_S,
  esMercadoPrincipal,
  MERCADO_PRINCIPAL,
  MERCADOS,
  mercadoPorHost,
  type Mercado,
} from "./mercados";

/**
 * QUÉ HACE `/datos/pais` CUANDO ALGUIEN TOCA UNA BANDERA (27 oct 2026).
 *
 * Puro a propósito: la ruta solo traduce esto a una respuesta, y las pruebas
 * lo recorren entero sin levantar nada.
 *
 * - Un país que vive dentro de mercatren.com (España): se pone la cookie y
 *   se va a la portada, ya en ese país.
 * - El principal: se quita la cookie y se va a la portada de mercatren.com.
 * - Un país con dominio propio: se quita la cookie (quien se va a Chile ya
 *   no está eligiendo España) y se va a su dominio.
 *
 * Si la petición llega por OTRO dominio (mercatren.cl/datos/pais?a=ES), la
 * cookie de ahí no sirve de nada en mercatren.com: se reenvía al
 * `/datos/pais` del principal, que es donde la cookie vive.
 *
 * Siempre se aterriza en la PORTADA del país, nunca en la página de donde
 * se venía: el catálogo de otro país no tiene las mismas fichas, y volver a
 * «la misma página» sería volver a un 404.
 */

export type Idioma = "es" | "en";

export type DecisionDePais = {
  destino: string;
  cookie: "poner" | "quitar" | "nada";
  mercado: Mercado;
};

export function idiomaElegido(valor: string | null | undefined): Idioma {
  return valor === "en" ? "en" : "es";
}

export function decidirPais(
  codigo: string | null | undefined,
  idiomaCrudo: string | null | undefined,
  host: string | null | undefined,
): DecisionDePais {
  const idioma = idiomaElegido(idiomaCrudo);
  const limpio = (codigo ?? "").trim().toUpperCase();
  const mercado =
    MERCADOS.find((m) => m.codigo === limpio) ?? MERCADO_PRINCIPAL;
  const enElPrincipal = esMercadoPrincipal(mercadoPorHost(host));

  if (!mercado.enElPrincipal && !esMercadoPrincipal(mercado)) {
    return {
      destino: `https://${mercado.dominio}/${idioma}`,
      cookie: enElPrincipal ? "quitar" : "nada",
      mercado,
    };
  }

  if (!enElPrincipal) {
    return {
      destino: `https://${MERCADO_PRINCIPAL.dominio}/datos/pais?a=${mercado.codigo}&idioma=${idioma}`,
      cookie: "nada",
      mercado,
    };
  }

  return {
    destino: `/${idioma}`,
    cookie: mercado.enElPrincipal ? "poner" : "quitar",
    mercado,
  };
}

/** La cabecera `Set-Cookie` que corresponde a la decisión, o null. */
export function cabeceraDeCookie(
  decision: DecisionDePais,
  seguro: boolean,
): string | null {
  const comun = `Path=/; SameSite=Lax${seguro ? "; Secure" : ""}`;
  if (decision.cookie === "poner") {
    return `${COOKIE_DEL_PAIS}=${decision.mercado.codigo}; Max-Age=${DURACION_COOKIE_DEL_PAIS_S}; ${comun}`;
  }
  if (decision.cookie === "quitar") {
    return `${COOKIE_DEL_PAIS}=; Max-Age=0; ${comun}`;
  }
  return null;
}
