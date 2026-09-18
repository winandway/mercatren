import { defineRouting } from "next-intl/routing";

/**
 * Mercatren vende al mercado de Estados Unidos: el sitio nace bilingue.
 * El idioma va en la direccion: /es/... y /en/...
 *
 * EL INGLES MANDA. El negocio ocurre en Estados Unidos, asi que quien llega
 * sin senal clara de idioma ve el sitio en ingles. A quien SI trae senal (su
 * navegador en espanol) se le abre en espanol: se detecta solo.
 *
 * ══ SIN COOKIE DE IDIOMA (emergencia de costo, 17 sep 2026) ══
 *
 * next-intl ponía `NEXT_LOCALE` en TODAS las respuestas, aunque el idioma ya
 * va en la dirección (/es/…, /en/…). Una respuesta con `Set-Cookie` no se
 * puede guardar en el borde, y con los robots pidiendo las mismas páginas
 * miles de veces al día eso costaba 26 mil millones de filas leídas al día.
 * `localeCookie: false` la quita. Lo que se pierde: quien eligió idioma a
 * mano y vuelve a la raíz `/` cae en el idioma de su navegador, no en el
 * elegido. Dentro del sitio nada cambia: el idioma viaja en la ruta.
 * Candado: `tests/unit/cache-del-borde.test.ts`.
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "en",
  localeDetection: true,
  localeCookie: false,
});

export type Idioma = (typeof routing.locales)[number];
