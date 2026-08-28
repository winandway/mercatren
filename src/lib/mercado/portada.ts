/**
 * EL VIDEO DEL HERO ES DEL PAÍS DEL DOMINIO (28 ago 2026).
 *
 * Lo pidió el dueño mirando mercatren.cl: el banner de arriba corría el video
 * de la cinta de cajas — el genérico de la casa — y él quería «un video de
 * Chile que salga allí en ese banner… algo que lo relacione con Chile, que
 * sea chileno». Tiene razón: el hero ya dice «entrega en Chile» en el título,
 * y el video contaba otra historia.
 *
 * ══ QUÉ VIDEO LLEVA CADA PAÍS ══
 *
 * - Chile: Santiago desde el aire con los Andes NEVADOS de fondo — la imagen
 *   más inconfundiblemente chilena que existe; no hace falta leer nada.
 * - Colombia: Bogotá desde el aire, con su ladrillo rojo característico.
 * - Estados Unidos (y cualquier país sin video propio): la cinta de cajas de
 *   siempre. El RESPALDO es el genérico — un país recién abierto no puede
 *   quedarse con el hueco negro por no tener video todavía.
 *
 * Los dos clips salen de Pexels (licencia libre, sin atribución) y se
 * comprimieron al MISMO perfil del genérico: 960×540, ~12 segundos, mudos,
 * con el índice adelante (`faststart`) y ~650 KB — el peso que el comentario
 * del hero ya daba por bueno. Un video de 90 MB ahí es una portada que no
 * abre en un teléfono.
 *
 * ══ POR QUÉ ES UNA TABLA Y NO UN `if` ══
 *
 * La misma regla de las plazas: el próximo país es UNA entrada aquí (y su
 * casilla en ABRIR-UN-PAIS.md), no un condicional repartido por la portada.
 * `tests/unit/portada-video.test.ts` exige que cada archivo declarado exista
 * de verdad en `public/` — un video que se declara y no se sube es el hueco
 * negro en la primera pantalla del sitio.
 */

export type VideoDePortada = {
  /** Ruta del MP4 dentro de `public/`. */
  video: string;
  /** El cuadro fijo que se ve mientras carga (y con el ahorro de datos). */
  poster: string;
};

/** El genérico de la casa: la cinta de cajas. */
const GENERICO: VideoDePortada = {
  video: "/video/portada.mp4",
  poster: "/video/portada.jpg",
};

/** Los países con video propio. Lo que no está aquí usa el genérico. */
const POR_PAIS: Record<string, VideoDePortada> = {
  CL: { video: "/video/portada-cl.mp4", poster: "/video/portada-cl.jpg" },
  CO: { video: "/video/portada-co.mp4", poster: "/video/portada-co.jpg" },
};

/** El video del hero para un mercado, con el genérico de respaldo. */
export function videoDePortada(codigoMercado: string): VideoDePortada {
  return POR_PAIS[codigoMercado.trim().toUpperCase()] ?? GENERICO;
}
