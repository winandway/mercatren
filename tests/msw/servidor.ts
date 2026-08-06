import { setupServer } from "msw/node";

/**
 * NINGUNA PRUEBA LE PEGA A UN SERVICIO REAL.
 *
 * Este proyecto habla con servicios que cobran o que mueven dinero de verdad:
 * Stripe, el correo de Cloudflare, Turnstile, y los servidores donde viven las
 * fotos de los comercios. Una prueba distraída que salga a internet puede
 * cobrar plata, mandarle un correo a una persona real o llenar de peticiones el
 * servidor de un comercio.
 *
 * Por eso aquí no se simula nada de entrada: la lista de simulaciones arranca
 * VACÍA a propósito. Cualquier petición que salga durante una prueba no
 * encuentra respuesta y **rompe la prueba** con el nombre del servicio al que
 * intentaba llamar.
 *
 * Cuando una prueba nueva necesite hablar con un servicio, se le agrega su
 * simulación en la propia prueba con `servidor.use(...)`. Así queda escrito en
 * la prueba a qué se conecta y qué se espera que responda.
 */
export const servidor = setupServer();

/**
 * Lo que sí puede salir: nada de la red.
 *
 * `jsdom` a veces pide recursos del propio documento (hojas de estilo, imágenes
 * con `src` relativo). Esas no llegan a la red y no interesan; se dejan pasar
 * en silencio para no llenar la consola de ruido. Todo lo que tenga `http` de
 * verdad, se detiene.
 */
export function alSalirseALaRed(
  peticion: Request,
  imprimir: { error(): void },
) {
  const url = new URL(peticion.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;

  imprimir.error();
}
