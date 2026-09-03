/**
 * LAS FOTOS SE TRAEN SOLAS: LAS REGLAS, SIN RED NI BASE (3 sep 2026).
 *
 * ══ LO QUE PASÓ ══
 *
 * El dueño mandó una captura de la portada con tres productos del comercio
 * piloto sin foto: el navegador enseñaba el título en el hueco. Medido
 * después, las mismas direcciones contestaban 200. El servidor de fotos de
 * ese comercio (un worker en un plan gratuito) falla A RATOS —cuando se
 * pasa de su cuota diaria contesta error hasta medianoche—, y mientras
 * tanto la portada de Mercatren se ve rota. Nuestro sitio dependía de un
 * servidor que no es nuestro.
 *
 * ══ LA SALIDA ══
 *
 * 1. Cada foto que viva en un servidor ajeno se COPIA a nuestro bucket,
 *    sola, desde el reloj: pocas por hora (el dueño pidió «unas 120 por
 *    día, 10 por hora») para no cargar el servidor del comercio ni el
 *    nuestro. Antes esto era un botón del panel que alguien tenía que
 *    pulsar; nadie lo pulsaba.
 * 2. Una foto que falla se vuelve a intentar —un fallo pasajero no es una
 *    foto rota—; solo después de varios intentos, o con un 404/410 que dice
 *    «esto ya no existe», se da por perdida: deja de enseñarse y el
 *    vigilante la nombra para que el comercio la reponga.
 * 3. La tarjeta y la galería, si el navegador no logra cargar una foto,
 *    enseñan el recuadro de «sin foto» en vez del título desparramado.
 */

/** Cuántas por hora, salvo que `configuracion.fotos_por_hora` diga otra. */
export const FOTOS_POR_HORA = 10;

/** Cuántas por latido del reloj (late cada minuto; con esto la cuota de
 *  la hora se gasta en los primeros minutos y el resto de la hora descansa). */
export const FOTOS_POR_TICK = 2;

/** Intentos fallidos seguidos antes de dar una foto por perdida. Con un
 *  intento por hora, son unas seis horas de un servidor caído. */
export const INTENTOS_PARA_DAR_POR_ROTA = 6;

/** La llave en `configuracion` con «hora:usadas» de la cuota en curso. */
export const LLAVE_CUOTA_FOTOS = "fotos_cuota_hora";
export const LLAVE_FOTOS_POR_HORA = "fotos_por_hora";

/** La hora entera (UTC) en la que cae un instante. */
export function horaDe(ahoraMs: number): number {
  return Math.floor(ahoraMs / 3_600_000);
}

/**
 * Cuántas fotos quedan por traer en esta hora según la marca guardada
 * («hora:usadas»). Una marca de otra hora vale cero usadas; una marca rota
 * también: ante la duda se trabaja, nunca se bloquea el reloj por un texto.
 */
export function cuotaDisponible(
  marca: string | null | undefined,
  ahoraMs: number,
  porHora: number = FOTOS_POR_HORA,
): number {
  const tope = Math.max(0, Math.floor(porHora));
  if (!marca) return tope;
  const [hora, usadas] = marca.split(":").map(Number);
  if (!Number.isFinite(hora) || !Number.isFinite(usadas)) return tope;
  if (hora !== horaDe(ahoraMs)) return tope;
  return Math.max(0, tope - Math.max(0, usadas));
}

/** La marca nueva después de gastar `n` en esta hora. */
export function marcaDeCuota(
  marca: string | null | undefined,
  ahoraMs: number,
  n: number,
): string {
  const hora = horaDe(ahoraMs);
  const [h, usadas] = (marca ?? "").split(":").map(Number);
  const previas = h === hora && Number.isFinite(usadas) ? usadas : 0;
  return `${hora}:${previas + Math.max(0, n)}`;
}

/**
 * El tope por hora que manda: lo guardado en configuración si es un número
 * cuerdo (1 a 600), si no el de la casa. Cero o basura no apagan el copiado:
 * apagarlo sin querer es como se queda un catálogo dependiendo de otro.
 */
export function fotosPorHoraDe(guardado: string | null | undefined): number {
  const n = Number(guardado);
  if (Number.isFinite(n) && n >= 1 && n <= 600) return Math.floor(n);
  return FOTOS_POR_HORA;
}

/**
 * ¿Ese fallo dice «la foto ya no existe» (definitivo) o «ahora no» (pasajero)?
 *
 * 404 y 410 son definitivos: el origen sabe de qué le hablan y dice que no
 * está. Todo lo demás —429 por cuota, 5xx, un corte de red, un tiempo de
 * espera— es el servidor pasando un mal rato, y una foto no se da por
 * perdida por eso.
 */
export function esFalloDefinitivo(status: number | null): boolean {
  return status === 404 || status === 410;
}

/** Si después de este intento la foto se da por perdida. */
export function seDaPorRota(status: number | null, intentos: number): boolean {
  return esFalloDefinitivo(status) || intentos >= INTENTOS_PARA_DAR_POR_ROTA;
}

/** El motivo, corto y sin secretos, para la tabla y el correo. */
export function motivoDe(status: number | null, error?: unknown): string {
  if (status !== null) return `HTTP ${status}`;
  const texto = error instanceof Error ? error.message : String(error ?? "");
  return (texto || "sin respuesta").slice(0, 120);
}
