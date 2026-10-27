import { cabeceraDeCookie, decidirPais } from "@/lib/mercado/elegir-pais";

/**
 * A DONDE LLEVAN LAS BANDERAS DE «MERCATREN EN EL MUNDO» (27 oct 2026).
 *
 * `GET /datos/pais?a=ES&idioma=es` pone el país elegido y lleva a su
 * portada. La lógica entera vive en `mercado/elegir-pais.ts`; aquí solo se
 * convierte en una redirección.
 *
 * Es un GET porque lo dispara un enlace (funciona sin JavaScript y en la
 * app), y no cambia nada que importe: solo una preferencia de quien mira.
 * Nunca se guarda en ninguna caché: la respuesta lleva su cookie.
 */
export const dynamic = "force-dynamic";

export function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const decision = decidirPais(
    url.searchParams.get("a"),
    url.searchParams.get("idioma"),
    peticion.headers.get("host"),
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
