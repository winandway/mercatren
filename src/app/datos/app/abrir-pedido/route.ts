import { getAuth } from "@/lib/auth";
import { rutaDelPedido } from "@/lib/app-movil/cobro-en-la-app";

export const dynamic = "force-dynamic";

/**
 * ABRIR EN EL NAVEGADOR EL PAGO DE UN PEDIDO DE LA APP (8 nov 2026).
 *
 * La app abre esta dirección en el dominio del país (mercatren.com.ve) con
 * el número del pedido y un pase de un solo uso. Aquí se canjea el pase —se
 * borra al usarlo y vence a los pocos minutos— y se pone la sesión en ESTE
 * dominio; después se va a la página de pago del pedido, la misma de la web.
 *
 * Si el pase no sirve (vencido, usado, inventado) igual se va al pedido: la
 * página pide entrar y vuelve sola. Nunca se manda a otro sitio: el destino
 * es siempre `/{idioma}/pedido/MT-000000` de este mismo dominio.
 *
 * Vive fuera de `/datos/app/v1` a propósito: no es una puerta de datos de la
 * app (no lleva país), es un paso del navegador.
 */
export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const ruta = rutaDelPedido(
    url.searchParams.get("n"),
    url.searchParams.get("idioma"),
  );
  const cabeceras = new Headers({
    Location: new URL(ruta ?? "/", url.origin).toString(),
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  });
  const pase = url.searchParams.get("t");
  if (ruta && pase && pase.length <= 200) {
    try {
      const auth = await getAuth();
      const r = await auth.api.verifyOneTimeToken({
        body: { token: pase },
        headers: peticion.headers,
        asResponse: true,
      });
      if (r.ok) {
        for (const galleta of r.headers.getSetCookie()) {
          cabeceras.append("Set-Cookie", galleta);
        }
      } else {
        console.warn("[app] pase al navegador rechazado", r.status);
      }
    } catch (fallo) {
      console.error("[app] canjear pase", fallo);
    }
  }
  return new Response(null, { status: 303, headers: cabeceras });
}
