/**
 * ¿EL DOMINIO DE ESTE CORREO TIENE SERVIDOR DE CORREO?
 *
 * ══ POR QUÉ ESTA CAPA ES LA QUE IMPORTA ══
 *
 * Las listas de dominios de ejemplo y de temporales siempre se quedan cortas:
 * los dominios inventados son infinitos. `asdfghjkl123456789.com` no está en
 * ninguna lista y no existe. Preguntarle al DNS es lo único que escala.
 *
 * ══ SE PREGUNTA POR HTTPS, NO POR EL DNS DEL SISTEMA ══
 *
 * El sitio corre en el borde de Cloudflare, donde no hay un `resolv.conf` ni el
 * módulo `dns` de Node. DNS sobre HTTPS es una petición normal y funciona igual
 * en local, en el borde y en las pruebas.
 *
 * ══ SI FALLA O TARDA, SE DEJA PASAR. SIN EXCEPCIÓN ══
 *
 * Es la regla que manda sobre todo lo demás. Rechazar a un cliente real porque
 * una consulta se puso lenta es mucho peor que dejar entrar un correo falso —
 * ese, de todos modos, se queda sin confirmar la cuenta y sin recibir nada.
 *
 * Una puerta de registro que se cierra sola cuando un servicio ajeno tose es
 * la forma más cara de perder clientes: no da error visible, no avisa a nadie,
 * y desde fuera parece que el sitio simplemente no quiere tu correo.
 */

/** Lo máximo que se le hace esperar a alguien que se está registrando. */
export const ESPERA_MAXIMA_MS = 2000;

const RESOLUTOR = "https://cloudflare-dns.com/dns-query";

/** Los tipos que se consultan. MX es el de correo; A dice si existe siquiera. */
type TipoDeRegistro = "MX" | "A";

/**
 * ¿Hay registros de este tipo para el dominio?
 *
 * `null` significa **no se pudo saber** —red caída, tiempo agotado, respuesta
 * rara—, que no es lo mismo que «no hay». Quien llama trata el `null` como un
 * sí, por la regla de arriba.
 */
async function hayRegistros(
  dominio: string,
  tipo: TipoDeRegistro,
  senal: AbortSignal,
): Promise<boolean | null> {
  try {
    const respuesta = await fetch(
      `${RESOLUTOR}?name=${encodeURIComponent(dominio)}&type=${tipo}`,
      { headers: { accept: "application/dns-json" }, signal: senal },
    );

    if (!respuesta.ok) return null;

    const datos = (await respuesta.json()) as { Answer?: unknown[] };

    /* Sin `Answer`, o con el arreglo vacío, no hay registros de ese tipo. Eso
       SÍ es una respuesta: el DNS contestó y dijo que no hay nada. */
    return Array.isArray(datos.Answer) && datos.Answer.length > 0;
  } catch {
    /* Tiempo agotado, sin red, JSON roto. No se sabe. */
    return null;
  }
}

export type ResultadoDns =
  /** Tiene MX o al menos A: puede recibir correo. */
  | "puede_recibir"
  /** El DNS contestó y no hay ni MX ni A: ese dominio no existe. */
  | "no_existe"
  /** No se pudo preguntar. Se deja pasar. */
  | "no_se_pudo";

/**
 * La comprobación completa de un dominio.
 *
 * Primero MX, que es el registro del correo. Si no tiene, se mira A: hay
 * dominios pequeños que reciben correo en su propia dirección sin declarar un
 * MX aparte, y rechazarlos sería rechazar correo que sí llega.
 */
export async function dominioRecibeCorreo(
  dominio: string,
): Promise<ResultadoDns> {
  const corte = AbortSignal.timeout(ESPERA_MAXIMA_MS);

  const conMx = await hayRegistros(dominio, "MX", corte);
  if (conMx === true) return "puede_recibir";
  if (conMx === null) return "no_se_pudo";

  const conA = await hayRegistros(dominio, "A", corte);
  if (conA === true) return "puede_recibir";
  if (conA === null) return "no_se_pudo";

  return "no_existe";
}
