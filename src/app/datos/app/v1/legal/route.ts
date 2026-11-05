import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { destinoLegal, esPaginaLegal } from "@/lib/app-movil/legal";
import { cabeceraDeCookie } from "@/lib/mercado/elegir-pais";

/**
 * `GET /datos/app/v1/legal?pais=ES&idioma=es&pagina=terminos` lleva a la
 * página legal del país que eligió la persona en la app (ver
 * `app-movil/legal.ts`). Sin base de datos y sin tocar la cuenta. Nunca se
 * guarda en caché: la respuesta lleva su galleta.
 */
export const dynamic = "force-dynamic";

export function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const contexto = contextoDe(url);
  const pagina = url.searchParams.get("pagina");
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  if (!esPaginaLegal(pagina)) return respuestaDeError("pagina", 400);
  const decision = destinoLegal(
    contexto.mercado.codigo,
    contexto.idioma,
    pagina,
  );
  const cabeceras = new Headers({
    Location: decision.destino,
    "Cache-Control": "no-store",
  });
  const cookie = cabeceraDeCookie(
    decision,
    process.env.NODE_ENV === "production",
  );
  if (cookie) cabeceras.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers: cabeceras });
}
