import {
  COOKIE_DEL_PAIS,
  DURACION_COOKIE_DEL_PAIS_S,
  esMercadoPrincipal,
  MERCADO_PRINCIPAL,
  MERCADOS,
  mercadoPorHost,
  type Mercado,
} from "./mercados";
import { dentroDeMercatren } from "./interruptores";

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
  luego?: string | null,
): DecisionDePais {
  const idioma = idiomaElegido(idiomaCrudo);
  const limpio = (codigo ?? "").trim().toUpperCase();
  const mercado =
    MERCADOS.find((m) => m.codigo === limpio) ?? MERCADO_PRINCIPAL;
  const enElPrincipal = esMercadoPrincipal(mercadoPorHost(host));

  /* Vive dentro del principal: sin dominio (España) o con su interruptor
     encendido (una sola Mercatren, `interruptores.ts`). */
  const viveDentro =
    mercado.enElPrincipal === true || dentroDeMercatren(mercado.codigo);

  if (!viveDentro && !esMercadoPrincipal(mercado)) {
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
    destino: `/${idioma}${rutaParaSeguir(luego)}`,
    cookie: viveDentro && !mercado.principal ? "poner" : "quitar",
    mercado,
  };
}

/**
 * A DÓNDE SE PUEDE SEGUIR DESPUÉS DE ELEGIR EL PAÍS (5 nov 2026).
 *
 * Al entrar o al crear la cuenta, la persona vuelve a SU país (el de su
 * cuenta) y sigue a su cuenta o a su panel, no a la portada. Solo esas dos
 * rutas: cualquier otra cosa en `luego` se ignora (nadie arma desde fuera un
 * salto a otro sitio).
 */
const SEGUIR_A = ["/cuenta", "/panel"] as const;

export function rutaParaSeguir(luego: string | null | undefined): string {
  return (SEGUIR_A as readonly string[]).includes(luego ?? "") ? luego! : "";
}

/**
 * EL PAÍS DE LA CUENTA MANDA AL ENTRAR (una sola Mercatren, 5 nov 2026).
 *
 * Si la cuenta dice otro país que el de la visita, y ese país se puede usar
 * DENTRO de este mismo sitio (mercatren.com y los que viven dentro), se pasa
 * por `/datos/pais` para dejarlo puesto y se sigue a `ruta`. Si el país de la
 * cuenta vive en otro dominio, NO se salta: la sesión es de este dominio y la
 * persona aterrizaría sin sesión. Devuelve `null` cuando no hay nada que
 * cambiar.
 */
export function destinoConElPaisDeLaCuenta(o: {
  paisCuenta: string | null | undefined;
  host: string | null | undefined;
  paisVisita: string;
  idioma: Idioma;
  ruta: string;
}): string | null {
  const cuenta = (o.paisCuenta ?? "").trim().toUpperCase();
  if (!cuenta || cuenta === o.paisVisita) return null;
  if (!esMercadoPrincipal(mercadoPorHost(o.host))) return null;
  const mercado = MERCADOS.find((m) => m.codigo === cuenta);
  if (!mercado) return null;
  const cabeAqui =
    mercado.principal === true ||
    mercado.enElPrincipal === true ||
    dentroDeMercatren(mercado.codigo);
  if (!cabeAqui) return null;
  const seguir = rutaParaSeguir(o.ruta);
  return `/datos/pais?a=${mercado.codigo}&idioma=${o.idioma}${seguir ? `&luego=${seguir}` : ""}`;
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
