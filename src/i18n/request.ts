import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { SOCIEDAD } from "@/lib/sociedad";

import { routing } from "./routing";

/**
 * EL NOMBRE DE LA SOCIEDAD NO SE ESCRIBE EN LOS TEXTOS.
 *
 * Los archivos de idioma son JSON y no pueden importar una constante, así que
 * el nombre estaba escrito a mano en diez frases repartidas entre los dos
 * idiomas. El día que la tienda pase de Windoce, LLC a Mercatren LLC, eso
 * habría que buscarlo y cambiarlo a mano, con el sitio en producción.
 *
 * En su lugar, los textos llevan «SOCIEDAD» y «ESTADO», y aquí se sustituyen
 * al cargar. Un traductor ve un símbolo que se entiende solo, y el cambio del
 * traspaso ocurre en un único archivo.
 *
 * ══ POR QUÉ «SOCIEDAD» Y NO {sociedad} ══
 *
 * next-intl interpreta las llaves como variables ICU: si un texto trae
 * `{sociedad}` y quien lo pinta no la pasa, revienta la pantalla entera. Las
 * comillas angulares no significan nada para ICU, así que se sustituyen antes
 * de que el formateador las vea y no hay forma de romper una página por
 * olvidarse de pasar un valor.
 */
const SUSTITUCIONES: Record<string, string> = {
  "«SOCIEDAD»": SOCIEDAD.nombre,
  "«ESTADO»": SOCIEDAD.estado,
};

function sustituir(valor: unknown): unknown {
  if (typeof valor === "string") {
    let texto = valor;
    for (const [marca, real] of Object.entries(SUSTITUCIONES)) {
      if (texto.includes(marca)) texto = texto.split(marca).join(real);
    }
    return texto;
  }

  if (Array.isArray(valor)) return valor.map(sustituir);

  if (valor && typeof valor === "object") {
    const salida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) salida[k] = sustituir(v);
    return salida;
  }

  return valor;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const solicitado = await requestLocale;
  const locale = hasLocale(routing.locales, solicitado)
    ? solicitado
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages: sustituir(messages) as Record<string, unknown>,
  };
});
