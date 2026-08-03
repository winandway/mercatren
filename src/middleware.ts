import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";

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
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  }

  return idiomas(request);
}

export const config = {
  /**
   * Se aplica a las paginas, pero NO a las rutas de servidor (/datos, /media,
   * /upload), ni a los archivos con extension, ni a los internos de Next.
   */
  matcher: ["/((?!_next|datos|media|upload|sw.js|manifest.json|.*\\..*).*)"],
};
