import { robotsTxt } from "@/lib/seo/robots";
import { mercadoActual } from "@/lib/mercado/actual";
import { esMercadoPrincipal } from "@/lib/mercado/mercados";
import { SITIO } from "@/lib/sitio";

/**
 * Sirve el robots.txt.
 *
 * Antes lo generaba Next con `MetadataRoute.Robots` (el viejo
 * `src/app/robots.ts`). Se cambió a una ruta propia porque ese formato solo
 * admite `User-agent`, `Allow`, `Disallow` y `Sitemap`, y hacía falta meter la
 * línea `Content-Signal` — la que declara qué pueden hacer las IA con el
 * catálogo. El contenido y su porqué viven en `src/lib/seo/robots.ts`.
 *
 * La caché de una hora es a propósito: este archivo cambia cada varios meses y
 * lo piden miles de robots al día.
 */
export async function GET() {
  /* El robots de cada dominio declara SU sitemap: el de mercatren.cl no
     puede mandar a Google al mapa de mercatren.com. */
  const mercado = await mercadoActual();
  const base = esMercadoPrincipal(mercado)
    ? SITIO.url
    : `https://${mercado.dominio}`;
  return new Response(robotsTxt(base), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
