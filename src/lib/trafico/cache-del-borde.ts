/**
 * ══ QUÉ PÁGINAS PUEDE GUARDAR EL BORDE, Y CUÁNDO (emergencia de costo, 17 sep 2026) ══
 *
 * Lo que pasó: GPTBot (38 % del tráfico) y el robot de Meta (15 %) pedían las
 * MISMAS diecisiete páginas unas 2.500 veces al día cada una —/es/ayuda,
 * /es/nosotros, /es/catalogo…— y cada visita, aunque fuera a «Ayuda»,
 * armaba el encabezado entero contra la base. La base pasó de 0,3 a 26,6 mil
 * millones de filas leídas al día.
 *
 * YaDominios Cloud guarda en el borde toda respuesta que diga
 * `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600`, y las
 * visitas siguientes no tocan ni el código ni la base. NUNCA guarda una
 * visita que trae `Cookie`, ni una respuesta con `Set-Cookie`; el techo es
 * una hora y se vacía en cada publicación. La cabecera `x-yad-cache` dice
 * qué pasó (HIT / STALE / MISS / BYPASS:motivo). La llave es la dirección
 * COMPLETA, con la query string: comprobado en vivo con dos categorías del
 * catálogo.
 *
 * Aquí se decide, en puro, qué visitas llevan esa cabecera. Es puro a
 * propósito: lo usa `next.config.ts` (las reglas) y lo prueban las pruebas
 * sin levantar nada.
 *
 * ══ POR QUÉ VA EN `next.config.ts` Y NO EN EL MIDDLEWARE ══
 *
 * La primera versión ponía la cabecera desde el middleware. Se cayó en vivo
 * a los diez minutos: Next le QUITA al middleware las cabeceras del árbol de
 * React (`rsc`, `next-router-prefetch`…) y el parámetro `_rsc` antes de
 * invocarlo (`server/web/adapter.js`, `FLIGHT_HEADERS`), así que el
 * middleware no distingue una navegación RSC de una visita normal. Y una
 * petición RSC sin su `_rsc` hace que Next conteste un **307** hacia
 * `?_rsc=<hash>`; ese 307 salía con `public` y el borde lo guardaba bajo la
 * dirección del HTML: `/es/como-funciona` devolvía un 307 a todo el mundo.
 * Cualquier robot (o cualquiera a propósito) podía envenenar así todas las
 * páginas públicas.
 *
 * Las reglas de `headers()` de `next.config` se evalúan sobre la petición
 * ORIGINAL (`missing` mira la cabecera de verdad), tanto en Next como en la
 * capa de rutas de OpenNext (`getNextConfigHeaders`), y se aplican encima de
 * la respuesta final, sea página, RSC o redirección.
 *
 * LAS CONDICIONES, Y POR QUÉ NINGUNA SOBRA (`SIN_SESION_NI_RSC`):
 *
 *  1. **Sin ninguna cookie.** No basta con que la plataforma no guarde las
 *     visitas con cookie: `public` le dice a CUALQUIER caché compartida
 *     (un proxy de empresa, por ejemplo) que puede guardar esa respuesta. La
 *     página de alguien con sesión lleva su nombre, su carrito y su ciudad.
 *     Sin cookie no hay sesión, ni ciudad elegida, ni carrito: la página es
 *     la misma para todo el que entra por ese dominio.
 *  2. **Solo el HTML.** Sin `rsc` ni las cabeceras de prefetch: ni el árbol
 *     de React ni el 307 que lo acompaña llevan `public`.
 *  3. **Sin `next-action`.** Una acción de servidor es un POST a la misma
 *     dirección de la página; su respuesta nunca es pública.
 *  4. **Solo las páginas de la lista.** Lo que cambia por quién mira —carrito,
 *     cuenta, checkout, pedidos, entrar, el casillero propio, el panel— no
 *     entra ni sin cookie. Es una lista de lo permitido, no de lo prohibido:
 *     una página nueva nace sin caché hasta que alguien la ponga aquí a
 *     conciencia.
 *
 * El país NO hace falta separarlo: cada mercado es un dominio distinto
 * (mercatren.com, .cl, .com.co, .com.ve). La única página que cambia por
 * navegador es `/cobro/[enlace]` (mira el user-agent), y no está en la lista.
 */

export const CACHE_PUBLICA =
  "public, s-maxage=300, stale-while-revalidate=3600";

/** Las páginas de un solo tramo iguales para todos: `/es/ayuda`, `/en/catalogo`… */
export const PAGINAS_PUBLICAS = [
  "catalogo",
  "tiendas",
  "videos",
  "buscar-con-foto",
  "casillero",
  "ayuda",
  "como-funciona",
  "devoluciones",
  "docs",
  "entrega",
  "nosotros",
  "privacidad",
  "terminos",
  "transparencia",
  "vender",
  "blog",
] as const;

/** Las fichas: `/es/producto/<slug>`, `/es/tienda/<slug>`, `/es/docs/<slug>`… */
export const FICHAS_PUBLICAS = [
  "tienda",
  "producto",
  "seccion",
  "video",
  "blog",
  "docs",
] as const;

export type CondicionAusente = { type: "header"; key: string };

/** Lo que tiene que FALTAR en la petición para que la respuesta sea pública. */
export const SIN_SESION_NI_RSC: ReadonlyArray<CondicionAusente> = [
  { type: "header", key: "cookie" },
  { type: "header", key: "rsc" },
  { type: "header", key: "next-router-prefetch" },
  { type: "header", key: "next-router-segment-prefetch" },
  { type: "header", key: "next-router-state-tree" },
  { type: "header", key: "next-action" },
];

const IDIOMA = ":idioma(es|en)";

export type ReglaDeCabecera = {
  source: string;
  missing: CondicionAusente[];
  headers: Array<{ key: string; value: string }>;
};

/**
 * Las reglas tal como las espera `headers()` de `next.config.ts`. La raíz `/`
 * no entra: es una redirección que depende del idioma del navegador.
 */
export function reglasDeCachePublica(): ReglaDeCabecera[] {
  const missing = SIN_SESION_NI_RSC.map((m) => ({ ...m }));
  const headers = [{ key: "Cache-Control", value: CACHE_PUBLICA }];
  return [
    { source: `/${IDIOMA}`, missing, headers },
    {
      source: `/${IDIOMA}/:pagina(${PAGINAS_PUBLICAS.join("|")})`,
      missing,
      headers,
    },
    {
      source: `/${IDIOMA}/:tipo(${FICHAS_PUBLICAS.join("|")})/:slug`,
      missing,
      headers,
    },
    { source: `/${IDIOMA}/casillero/calculadora`, missing, headers },
  ];
}

/**
 * La misma lista, como expresión, para las pruebas y para quien necesite
 * preguntar por una ruta en código.
 */
export const PAGINA_PUBLICA_PARA_TODOS = new RegExp(
  `^/(es|en)(/(${PAGINAS_PUBLICAS.join("|")}|(${FICHAS_PUBLICAS.join("|")})/[^/]+|casillero/calculadora))?/?$`,
);

export type VisitaAlBorde = {
  method: string;
  pathname: string;
  /** ¿La petición trae CUALQUIER cookie? Con una sola, no se guarda. */
  tieneCookie: boolean;
  /** ¿Pide el árbol de React (cabecera `rsc` o de prefetch) y no HTML? */
  pideRsc: boolean;
};

/** ¿Esta visita puede llevar `Cache-Control: public…`? (espejo de las reglas) */
export function sePuedeGuardarEnElBorde(visita: VisitaAlBorde): boolean {
  if (visita.method !== "GET" && visita.method !== "HEAD") return false;
  if (visita.tieneCookie) return false;
  if (visita.pideRsc) return false;
  return PAGINA_PUBLICA_PARA_TODOS.test(visita.pathname);
}
