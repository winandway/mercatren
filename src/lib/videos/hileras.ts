/**
 * LOS TÍTULOS DE LAS HILERAS DE SHORTS (25 ago 2026).
 *
 * Lo pidió el dueño mirando la portada: _«hay que colocarle algo que llame la
 * atención… tendencias de TikTok, lo más vendido en Mercatren, videos
 * mostrando productos ganadores»_. Y la clave de por qué esto funciona con
 * pocos videos: _«tenemos que repetir los mismos videos, pero los barajeamos
 * diferente… eso es lo que hacen las redes sociales»_.
 *
 * ══ CÓMO FUNCIONA ══
 *
 * Cada hilera tiene su título y **su propia baraja** de la misma lista de
 * videos. Con cincuenta videos, tres hileras seguidas con el mismo orden se
 * leen como un error; con órdenes distintos, cada una se siente una sección
 * nueva. Es exactamente lo que hace TikTok cuando te repite un video en otra
 * pestaña.
 *
 * ══ LO QUE NO SE HACE ══
 *
 * **No se promete lo que no se mide.** «Lo más visto» y «Lo que más gusta»
 * ordenan de verdad por vistas y por corazones — son datos que sí tenemos.
 * Los demás títulos hablan de lo que hay (tiendas por dentro, productos
 * nuevos) y no de una métrica inventada. Poner «Tendencias» sobre una lista
 * al azar es mentirle a quien mira, y se nota a la segunda visita.
 */
export type ClaveDeHilera =
  | "descubre"
  | "porDentro"
  | "masVistos"
  | "masGustan"
  | "recienLlegados"
  | "productosGanadores";

/**
 * El orden en que aparecen bajando por la portada.
 *
 * `descubre` va primero porque es la más general: quien llega no sabe todavía
 * qué son estos videos.
 */
export const HILERAS: ClaveDeHilera[] = [
  "descubre",
  "porDentro",
  "masVistos",
  "recienLlegados",
  "masGustan",
  "productosGanadores",
];

export type VideoOrdenable = {
  id: string;
  vistas: number;
  creadoEn: string | null;
};

/**
 * Cómo se ordena cada hilera.
 *
 * Las que dicen un dato lo cumplen; las demás barajan con una semilla propia
 * —la posición de la hilera— para que dos hileras seguidas no se vean iguales.
 */
export function ordenarParaHilera<T extends VideoOrdenable>(
  videos: T[],
  clave: ClaveDeHilera,
  corazonesDe: (id: string) => number,
  semilla: number,
): T[] {
  const lista = [...videos];

  if (clave === "masVistos") {
    return lista.sort(
      (a, b) => b.vistas - a.vistas || a.id.localeCompare(b.id),
    );
  }
  if (clave === "masGustan") {
    return lista.sort(
      (a, b) =>
        corazonesDe(b.id) - corazonesDe(a.id) || a.id.localeCompare(b.id),
    );
  }
  if (clave === "recienLlegados") {
    return lista.sort(
      (a, b) =>
        (b.creadoEn ?? "").localeCompare(a.creadoEn ?? "") ||
        a.id.localeCompare(b.id),
    );
  }
  /* Las demás: una baraja propia y estable. Estable importa — si cambiara en
     cada dibujo, la hilera «bailaría» al navegar. */
  return lista.sort((a, b) => mezclar(a.id, semilla) - mezclar(b.id, semilla));
}

/**
 * Un número estable por video y semilla, con los bits mezclados.
 *
 * Mismo motivo que en el reparto entre tiendas: sumar o multiplicar la semilla
 * conserva el orden cuando las entradas se parecen, y todos los ids de un
 * lote se parecen mucho.
 */
function mezclar(id: string, semilla: number): number {
  let n = 2_166_136_261;
  for (let i = 0; i < id.length; i++) {
    n = Math.imul(n ^ id.charCodeAt(i), 16_777_619);
  }
  let x =
    (n ^ Math.imul(Math.abs(Math.trunc(semilla)) + 1, 2_654_435_761)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 2_246_822_507) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3_266_489_909) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/**
 * ¿Merece la pena dibujar esta hilera?
 *
 * Con menos de tres videos son tres recuadros sueltos, que se leen como un
 * error y no como una sección. Y una hilera que ordena por un dato que está
 * en cero —nadie ha visto nada todavía— no dice nada: se salta.
 */
export function valeLaPena(
  videos: VideoOrdenable[],
  clave: ClaveDeHilera,
  corazonesTotales: number,
): boolean {
  if (videos.length < 3) return false;
  if (clave === "masVistos") return videos.some((v) => v.vistas > 0);
  if (clave === "masGustan") return corazonesTotales > 0;
  return true;
}
