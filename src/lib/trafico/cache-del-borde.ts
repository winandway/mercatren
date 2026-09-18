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
 * qué pasó (HIT / STALE / MISS / BYPASS:motivo).
 *
 * Aquí se decide, en puro, qué visitas llevan esa cabecera. Es puro a
 * propósito: lo usa el middleware (que corre en el borde) y lo prueban las
 * pruebas sin levantar nada.
 *
 * LAS TRES CONDICIONES, Y POR QUÉ NINGUNA SOBRA:
 *
 *  1. **Sin ninguna cookie.** No basta con que la plataforma no guarde las
 *     visitas con cookie: `public` le dice a CUALQUIER caché compartida
 *     (un proxy de empresa, por ejemplo) que puede guardar esa respuesta. La
 *     página de alguien con sesión lleva su nombre, su carrito y su ciudad;
 *     declararla pública sería regalársela al siguiente. Sin cookie no hay
 *     sesión, ni ciudad elegida, ni carrito: la página es la misma para
 *     todo el que entra por ese dominio.
 *  2. **Solo el HTML.** Una navegación del lado del cliente pide la MISMA
 *     dirección con la cabecera `rsc` y recibe otra cosa (el árbol de React,
 *     no HTML). Next lo distingue con `?_rsc=`, pero no se depende de eso.
 *  3. **Solo las páginas de la lista.** Lo que cambia por quién mira —carrito,
 *     cuenta, checkout, pedidos, entrar, el casillero propio, el panel— no
 *     entra ni sin cookie. Es una lista de lo permitido, no de lo prohibido:
 *     una página nueva nace sin caché hasta que alguien la ponga aquí a
 *     conciencia.
 *
 * El país NO hace falta separarlo: cada mercado es un dominio distinto
 * (mercatren.com, .cl, .com.co, .com.ve) y la caché es por dirección
 * completa. La única página que cambia por navegador es `/cobro/[enlace]`
 * (mira el user-agent), y no está en la lista.
 */

export const CACHE_PUBLICA =
  "public, s-maxage=300, stale-while-revalidate=3600";

/**
 * Las páginas iguales para todo el que entra sin sesión, por dominio. La
 * expresión exige el idioma en la ruta: la raíz `/` es una redirección que
 * depende del idioma del navegador y no se guarda.
 */
export const PAGINA_PUBLICA_PARA_TODOS = new RegExp(
  "^/(es|en)(/(" +
    [
      "catalogo",
      "tiendas",
      "tienda/[^/]+",
      "producto/[^/]+",
      "seccion/[^/]+",
      "videos",
      "video/[^/]+",
      "blog(/[^/]+)?",
      "buscar-con-foto",
      "casillero",
      "casillero/calculadora",
      "ayuda",
      "como-funciona",
      "devoluciones",
      "docs(/[^/]+)*",
      "entrega",
      "nosotros",
      "privacidad",
      "terminos",
      "transparencia",
      "vender",
    ].join("|") +
    "))?/?$",
);

export type VisitaAlBorde = {
  method: string;
  pathname: string;
  /** ¿La petición trae CUALQUIER cookie? Con una sola, no se guarda. */
  tieneCookie: boolean;
  /** ¿Pide el árbol de React (cabecera `rsc` o de prefetch) y no HTML? */
  pideRsc: boolean;
};

/** ¿Esta visita puede llevar `Cache-Control: public…`? */
export function sePuedeGuardarEnElBorde(visita: VisitaAlBorde): boolean {
  if (visita.method !== "GET" && visita.method !== "HEAD") return false;
  if (visita.tieneCookie) return false;
  if (visita.pideRsc) return false;
  return PAGINA_PUBLICA_PARA_TODOS.test(visita.pathname);
}
