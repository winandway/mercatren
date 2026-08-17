import type { Metadata } from "next";

import { routing } from "@/i18n/routing";
import { SOCIEDAD } from "@/lib/sociedad";

/**
 * Los datos del sitio que necesitan Google y las tarjetas para compartir.
 *
 * Vive aparte porque lo usan a la vez las paginas, el mapa del sitio y el
 * robots.txt, y no puede haber dos versiones de la direccion.
 */
export const SITIO = {
  nombre: "Mercatren",
  /** La sociedad que opera el servicio. Mercatren es la marca. */
  sociedad: SOCIEDAD.nombre,
  url:
    process.env.NEXT_PUBLIC_SITIO_URL?.replace(/\/$/, "") ??
    "https://mercatren.com",
} as const;

/** El PDF completo del modelo, para bancos y socios. */
export const PDF_MODELO = "/docs/mercatren-modelo-de-negocio.pdf";

/**
 * La direccion buena de una pagina y sus versiones por idioma.
 *
 * Sin esto Google ve /es/docs y /en/docs como dos paginas que compiten entre
 * si; con esto entiende que son la misma en dos idiomas.
 *
 * ══ DEVUELVE RUTAS RELATIVAS, Y ESO ES LO QUE LO HACE MULTI-PAIS ══
 *
 * Antes armaba direcciones absolutas con `SITIO.url` pegado delante. Con un
 * solo dominio daba igual; con varios, mercatren.cl declaraba como canonica
 * una direccion de mercatren.com — o sea, le decia a Google «esta pagina en
 * realidad es aquella otra», y el dominio chileno no se habria indexado nunca.
 *
 * Next resuelve las rutas relativas contra `metadataBase`, que el layout ya
 * calcula por peticion desde el dominio (src/app/[locale]/layout.tsx). Asi
 * cada dominio declara SU propia canonica sin que ninguna de las 18 paginas
 * que llaman a esta funcion tenga que enterarse de que existen los paises.
 *
 * Lo mismo con los hreflang: cada uno apunta al idioma dentro del MISMO
 * dominio, que es lo correcto — el catalogo de Chile no es la traduccion del
 * de Estados Unidos, es otro catalogo.
 */
export function rutaCanonica(
  ruta: string,
  locale: string,
): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const idioma of routing.locales) {
    languages[idioma] = `/${idioma}${ruta}`;
  }
  // Para quien llega sin idioma definido, el espanol es el que manda.
  languages["x-default"] = `/${routing.defaultLocale}${ruta}`;

  return {
    canonical: `/${locale}${ruta}`,
    languages,
  };
}
