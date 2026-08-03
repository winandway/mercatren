import type { Metadata } from "next";

import { routing } from "@/i18n/routing";

/**
 * Los datos del sitio que necesitan Google y las tarjetas para compartir.
 *
 * Vive aparte porque lo usan a la vez las paginas, el mapa del sitio y el
 * robots.txt, y no puede haber dos versiones de la direccion.
 */
export const SITIO = {
  nombre: "Mercatren",
  /** La sociedad que opera el servicio. Mercatren es la marca. */
  sociedad: "Windoce LLC",
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
 */
export function rutaCanonica(
  ruta: string,
  locale: string,
): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const idioma of routing.locales) {
    languages[idioma] = `${SITIO.url}/${idioma}${ruta}`;
  }
  // Para quien llega sin idioma definido, el espanol es el que manda.
  languages["x-default"] = `${SITIO.url}/${routing.defaultLocale}${ruta}`;

  return {
    canonical: `${SITIO.url}/${locale}${ruta}`,
    languages,
  };
}
