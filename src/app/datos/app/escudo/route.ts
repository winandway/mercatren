import { getCloudflareContext } from "@opennextjs/cloudflare";

import { paginaDelEscudo } from "@/lib/app-movil/escudo";

export const dynamic = "force-dynamic";

/**
 * La página del escudo anti-robots que la app carga en una vista web para
 * entrar y crear cuenta. Sin base de datos y sin caché: cada pase sirve una
 * sola vez. Ver `lib/app-movil/escudo.ts`.
 */
export function GET(peticion: Request) {
  const idioma =
    new URL(peticion.url).searchParams.get("idioma") === "es" ? "es" : "en";
  const { env } = getCloudflareContext();
  return new Response(paginaDelEscudo(env.TURNSTILE_CLAVE_SITIO, idioma), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
