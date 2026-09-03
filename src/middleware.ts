import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { esRutaSoloEquipo } from "./lib/panel/solo-equipo";

const idiomas = createMiddleware(routing);

const ES_PANEL = new RegExp(`^/(${routing.locales.join("|")})/panel(/|$)`);

/**
 * OJO AL NOMBRE: Next 16 recomienda llamar a este archivo proxy.ts, pero
 * proxy compila SIEMPRE como funcion Node y el adaptador de Cloudflare
 * (OpenNext) solo acepta el middleware en runtime edge. Por eso se queda con
 * la convencion middleware.ts, que sigue compilando a edge. No renombrar a
 * proxy.ts hasta que OpenNext lo soporte.
 *
 * Primera barrera del panel: si no hay ni siquiera una cookie de sesion, se
 * corta aqui y la pagina ni se arma. La comprobacion de verdad (que el rol
 * tenga permiso) se hace despues, en las consultas.
 */
/**
 * MARKDOWN PARA AGENTES (23 ago 2026). Una página pública pedida con
 * `Accept: text/markdown` se sirve en Markdown desde `/datos/markdown`, que la
 * arma desde los datos (ficha, tienda, artículo, portada) o convierte el HTML.
 * Los navegadores nunca piden text/markdown, así que para una persona no
 * cambia nada; lo del panel y lo que lleva sesión no entra.
 */
function quiereMarkdown(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  const accept = request.headers.get("accept") ?? "";
  return /\btext\/markdown\b/i.test(accept);
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (quiereMarkdown(request) && !ES_PANEL.test(pathname)) {
    const ruta = pathname + (request.nextUrl.search || "");
    const url = request.nextUrl.clone();
    url.pathname = "/datos/markdown";
    url.search = `?ruta=${encodeURIComponent(ruta)}`;
    /* La ruta viaja TAMBIÉN en una cabecera: tras una reescritura, el
       `request.url` que ve la ruta de servidor es el original, sin el
       parámetro. Medido el 23 ago 2026: sin esto toda página devolvía la
       portada. */
    const cabeceras = new Headers(request.headers);
    cabeceras.set("x-ruta-markdown", ruta);
    return NextResponse.rewrite(url, { request: { headers: cabeceras } });
  }

  if (ES_PANEL.test(pathname)) {
    const cookie = getSessionCookie(request, { cookiePrefix: "mercatren" });

    if (!cookie) {
      const idioma = pathname.split("/")[1];
      const destino = pathname.slice(idioma.length + 1) || "/panel";
      const url = request.nextUrl.clone();
      url.pathname = `/${idioma}/entrar`;
      url.search = `?destino=${encodeURIComponent(destino)}`;
      return NextResponse.redirect(url);
    }

    /**
     * MIRANDO EL PANEL DE UN COMERCIO NO SE ENTRA A LO DEL EQUIPO.
     *
     * Con el modo «ver su panel» puesto, Soporte veía el panel del comercio
     * **con su propio menú completo encima**: Comercios, Cuentas,
     * Configuración, Pedidos al proveedor. Y no era solo el menú — se entraba
     * de verdad. Palabras del dueño: *«estoy viendo la cuenta del superadmin
     * entrando como cliente… hasta usted se puede equivocar»*.
     *
     * Ahí adentro están los enlaces que cobran de NUESTRA tarjeta, el costo
     * real de la mercancía y el dinero de todos los demás comercios. La gracia
     * del modo es ver **exactamente** lo que ve el comercio; si el menú enseña
     * de más, no sirve para lo único que existe.
     *
     * ══ VA AQUÍ Y NO EN CADA PANTALLA ══
     *
     * Una línea cubre las secciones de hoy **y las que se agreguen mañana**.
     * Repartido por pantallas, la próxima nace sin candado y nadie se entera.
     *
     * ══ Y CIERRA DE VERDAD, NO SOLO ESCONDE ══
     *
     * Ocultar la entrada del menú no basta: la dirección se escribe a mano.
     * Aquí la petición ni llega a armar la página.
     *
     * Se lee la cookie por nombre porque el middleware corre en el borde y no
     * puede importar `ver-como.ts`, que es `server-only`. El nombre es el
     * mismo en los dos sitios y hay una prueba que se pone roja si dejan de
     * coincidir.
     */
    if (request.cookies.get("mercatren_ver_como")?.value?.trim()) {
      if (esRutaSoloEquipo(pathname)) {
        const idioma = pathname.split("/")[1];
        const url = request.nextUrl.clone();
        /* Al panel del comercio, que es donde creía estar. Mandarlo al login
           o a un 404 haría pensar que se rompió algo. */
        url.pathname = `/${idioma}/panel`;
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return idiomas(request);
}

export const config = {
  /**
   * Se aplica a las paginas, pero NO a las rutas de servidor (/datos, /media,
   * /upload), ni a los archivos con extension, ni a los internos de Next.
   */
  /* `__scheduled` es la puerta del reloj propio de la plataforma (3 sep
     2026): sin esta exclusión el idioma la mandaría a /es/__scheduled y el
     planificador recibiría una redirección en vez de la puerta. */
  matcher: [
    "/((?!_next|datos|media|upload|__scheduled|sw.js|manifest.json|.*\\..*).*)",
  ],
};
