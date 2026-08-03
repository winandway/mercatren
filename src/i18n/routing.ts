import { defineRouting } from "next-intl/routing";

/**
 * Mercatren vende al mercado de Estados Unidos: el sitio nace bilingue.
 * El idioma va en la direccion: /es/... y /en/...
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
});

export type Idioma = (typeof routing.locales)[number];
