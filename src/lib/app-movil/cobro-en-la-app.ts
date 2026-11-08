/**
 * CÓMO SE PAGA UNA COMPRA HECHA EN LA APP (8 nov 2026, Venezuela entra a
 * Google Play).
 *
 * ══ LA REGLA DURA: NADA COBRA SIN PROBAR ══
 *
 * La hoja de tarjeta de Stripe DENTRO de la app nunca se probó con una
 * tarjeta de verdad (bloque rojo de `VERIFICAR-PAGOS.md`; la prueba 9 de
 * `COMO-PROBAR-LOS-COBROS.md`). Hasta esa compra real queda APAGADA para el
 * público en todos los países. El equipo (Soporte) sí la ve: es la única
 * forma de hacer esa misma prueba.
 *
 * Mientras tanto la app cobra con lo que YA está probado en la web: Zelle
 * (Venezuela, histórico vivo del comercio piloto). La app crea el pedido y
 * abre en el navegador la página de pago de ESE pedido en el dominio de su
 * país (mercatren.com.ve para Venezuela): la misma página, los mismos datos
 * de pago y la misma subida del comprobante que usa la web.
 *
 * ══ CÓMO SE ENCIENDE LA TARJETA EN LA APP ══
 *
 * Hecha la prueba 9 y anotada como PROBADA en `VERIFICAR-PAGOS.md`:
 * `TARJETA_EN_LA_APP_PARA_EL_PUBLICO = true` y una publicación mirada.
 * Puro (sin base ni servidor): lo usan las rutas de la app y las pruebas.
 */

/** Apagada hasta la compra real de la prueba 9. NO se enciende sin ella. */
export const TARJETA_EN_LA_APP_PARA_EL_PUBLICO = false;

/**
 * El país con el que abre la app quien todavía no eligió ninguno: Venezuela,
 * el único con productos reales hoy (decisión de Gerencia, 8 nov 2026).
 */
export const PAIS_POR_DEFECTO_EN_LA_APP = "VE";

/** Zelle es una red entre bancos de EE. UU.: la misma regla de `crearPedido`. */
const PAISES_CON_ZELLE = new Set(["US", "VE"]);

export type MetodoDeLaApp = "tarjeta" | "zelle";

const limpio = (pais: string | null | undefined) =>
  (pais ?? "").trim().toUpperCase();

/**
 * Los métodos que se le ofrecen a esta persona en este país, en orden.
 * `tarjeta` es la hoja de Stripe dentro de la app; `zelle` se paga en la web.
 * Por defecto NO es equipo: si alguien olvida pasarlo, la tarjeta se queda
 * apagada (el olvido caro sería al revés).
 */
export function metodosDeLaApp(
  pais: string | null | undefined,
  opciones?: { esEquipo?: boolean },
): MetodoDeLaApp[] {
  const metodos: MetodoDeLaApp[] = [];
  if (TARJETA_EN_LA_APP_PARA_EL_PUBLICO || opciones?.esEquipo === true) {
    metodos.push("tarjeta");
  }
  if (PAISES_CON_ZELLE.has(limpio(pais))) metodos.push("zelle");
  return metodos;
}

/** ¿Se puede usar este método desde la app? (lo vuelve a mirar el servidor). */
export function metodoPermitidoEnLaApp(
  metodo: MetodoDeLaApp,
  pais: string | null | undefined,
  opciones?: { esEquipo?: boolean },
): boolean {
  return metodosDeLaApp(pais, opciones).includes(metodo);
}

const NUMERO = /^MT-\d{6}$/;

/** Una máquina de desarrollo (o el emulador de Android, que ve el
 *  computador en 10.0.2.2): ahí la web del país es la misma dirección. */
function esDeDesarrollo(host: string): boolean {
  const h = host.replace(/:\d+$/, "").toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(h) ||
    h === "[::1]"
  );
}

/**
 * Dónde vive la web del país: en producción, su dominio con https
 * (mercatren.com.ve para Venezuela, aunque la app entre por mercatren.com);
 * en una máquina de desarrollo, la misma dirección que atendió a la app.
 */
export function origenDeLaWebDelPais(
  urlDeLaPeticion: string,
  dominioDelPais: string,
): string {
  const u = new URL(urlDeLaPeticion);
  return esDeDesarrollo(u.host) ? u.origin : `https://${dominioDelPais}`;
}

/** La página de pago del pedido en la web de su país. */
export function paginaDelPedido(
  origen: string,
  idioma: "es" | "en",
  numero: string,
): string | null {
  if (!NUMERO.test(numero)) return null;
  return `${origen}/${idioma}/pedido/${numero}`;
}

/**
 * El enlace que abre la app: entra con un pase de un solo uso (dura unos
 * minutos) y aterriza en la página de pago ya con la sesión puesta, sin
 * escribir otra vez la contraseña. Sin pase, la página de pago del pedido
 * (que pide entrar y vuelve sola al pedido).
 */
export function enlaceDePagoEnLaWeb(o: {
  origen: string;
  idioma: "es" | "en";
  numero: string;
  pase?: string | null;
}): string | null {
  const pagina = paginaDelPedido(o.origen, o.idioma, o.numero);
  if (!pagina) return null;
  if (!o.pase) return pagina;
  const q = new URLSearchParams({ n: o.numero, idioma: o.idioma, t: o.pase });
  return `${o.origen}/datos/app/abrir-pedido?${q.toString()}`;
}

/** A dónde manda «abrir-pedido»: siempre una ruta propia, nunca otro sitio. */
export function rutaDelPedido(
  numero: string | null,
  idioma: string | null,
): string | null {
  if (!numero || !NUMERO.test(numero)) return null;
  const i = idioma === "en" ? "en" : "es";
  return `/${i}/pedido/${numero}`;
}
