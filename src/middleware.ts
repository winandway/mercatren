import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { mercadoPorCodigo, mercadoPorHost } from "@/lib/mercado/mercados";

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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* ══ LO QUE SE MUDÓ DE DOMINIO SE REDIRIGE AQUÍ, Y SOLO AQUÍ ══
     Es el único sitio del sitio que devuelve un 308 de verdad: medido en
     producción, un `permanentRedirect` desde una página sale DENTRO del HTML
     con un 200, y Google no traspasa nada con eso. Va antes que todo lo
     demás: una ficha mudada no tiene que llegar a renderizarse. */
  const mudanza = await redireccionDeMudanza(request);
  if (mudanza) return mudanza;

  /* ══ LA PUERTA DEL RELOJ PROPIO (3 sep 2026) ══ YaDominios Cloud invoca
     `/__scheduled` en el minuto declarado en yadominios.json. Next trata las
     carpetas que empiezan por guion bajo como privadas —una ruta ahí cae en
     la página 404, medido en producción—, así que la puerta vive en
     `/datos/reloj` y aquí se reescribe. Las cabeceras (`x-yad-cron`) viajan
     tal cual. */
  if (pathname === "/__scheduled") {
    const url = request.nextUrl.clone();
    url.pathname = "/datos/reloj";
    return NextResponse.rewrite(url);
  }

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

/**
 * ══ LA REDIRECCIÓN DE UNA MUDANZA DE DOMINIO (6 sep 2026) ══
 *
 * Venezuela pasó de mercatren.com a mercatren.com.ve con más de mil fichas
 * ya indexadas. Un 404 le dice a Google «esto murió» y tira el
 * posicionamiento de un año; un 308 le dice «se mudó aquí» y se lo traspasa.
 *
 * ══ POR QUÉ LA LISTA VIVE EN MEMORIA Y NO SE CONSULTA POR VISITA ══
 *
 * El middleware corre en el borde y no puede tocar la base. La alternativa
 * era preguntar por cada ficha que alguien abre — latencia en el camino
 * crítico de TODO el catálogo para atender un caso que, pasada la mudanza,
 * casi no ocurre. Así que la lista se pide UNA VEZ por worker y por hora
 * (`/datos/mudanza`, ~1.000 entradas) y la decisión se toma en memoria.
 *
 * ══ LO QUE PASA SI ALGO FALLA ══
 *
 * Sin lista no se redirige nada, que es exactamente como se comportaba el
 * sitio antes. Y mientras el dato no se haya movido la lista sale VACÍA, así
 * que este código se puede publicar días antes sin efecto alguno.
 */
type ListaDeMudanza = {
  productos: Record<string, string>;
  tiendas: Record<string, string>;
};

let listaEnMemoria: ListaDeMudanza | null = null;
let listaPedidaEn = 0;
const VIGENCIA_LISTA_MS = 3_600_000;

/** `/es/producto/mi-slug` → `{ tipo: "producto", slug: "mi-slug" }`. */
const RUTA_MUDABLE = /^\/(es|en)\/(producto|tienda)\/([^/?#]+)\/?$/;

async function redireccionDeMudanza(
  request: NextRequest,
): Promise<NextResponse | null> {
  const partes = RUTA_MUDABLE.exec(request.nextUrl.pathname);
  if (!partes) return null;

  const [, idioma, tipo, slug] = partes;
  if (!idioma || !tipo || !slug) return null;

  const aqui = mercadoPorHost(request.headers.get("host"));

  const lista = await listaDeMudanza(request);
  if (!lista) return null;

  const codigo =
    tipo === "producto"
      ? lista.productos[decodeURIComponent(slug)]
      : lista.tiendas[decodeURIComponent(slug)];
  if (!codigo || codigo === aqui.codigo) return null;

  const alla = mercadoPorCodigo(codigo);
  if (alla.codigo === aqui.codigo) return null;

  /* 308 y no 307: el permanente es el que traspasa el posicionamiento. El
     idioma se conserva — quien abrió el enlace en inglés sigue en inglés. */
  return NextResponse.redirect(
    `https://${alla.dominio}/${idioma}/${tipo}/${slug}`,
    308,
  );
}

async function listaDeMudanza(
  request: NextRequest,
): Promise<ListaDeMudanza | null> {
  const ahora = Date.now();
  if (listaEnMemoria && ahora - listaPedidaEn < VIGENCIA_LISTA_MS) {
    return listaEnMemoria;
  }
  try {
    const url = new URL("/datos/mudanza", request.nextUrl.origin);
    /* Un segundo como mucho: la lista es una comodidad, no puede retrasar
       la portada de nadie si la base va lenta. */
    const respuesta = await fetch(url, {
      signal: AbortSignal.timeout(1000),
    });
    if (!respuesta.ok) return listaEnMemoria;
    listaEnMemoria = (await respuesta.json()) as ListaDeMudanza;
    listaPedidaEn = ahora;
    return listaEnMemoria;
  } catch {
    /* Se conserva la última buena, si la hubo. Nunca tumba la petición. */
    return listaEnMemoria;
  }
}

export const config = {
  /**
   * Se aplica a las paginas, pero NO a las rutas de servidor (/datos, /media,
   * /upload), ni a los archivos con extension, ni a los internos de Next.
   */
  /* `/__scheduled` SÍ entra: el middleware lo reescribe a /datos/reloj antes
     de que el idioma lo toque. */
  matcher: ["/((?!_next|datos|media|upload|sw.js|manifest.json|.*\\..*).*)"],
};
