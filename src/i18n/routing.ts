import { defineRouting } from "next-intl/routing";

/**
 * Mercatren vende al mercado de Estados Unidos: el sitio nace bilingue.
 * El idioma va en la direccion: /es/... y /en/...
 *
 * EL INGLES MANDA. El negocio ocurre en Estados Unidos, asi que quien llega
 * sin senal clara de idioma ve el sitio en ingles. A quien SI trae senal (su
 * navegador en espanol) se le abre en espanol: se detecta solo.
 *
 * Y una vez que alguien elige idioma a mano, next-intl deja una cookie y esa
 * eleccion manda por encima de la deteccion. Elegir una vez basta.
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "en",
  localeDetection: true,
});

export type Idioma = (typeof routing.locales)[number];
