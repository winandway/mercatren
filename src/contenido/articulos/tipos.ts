/**
 * LOS ARTÍCULOS: el blog y la documentación, con el mismo motor.
 *
 * POR QUÉ UNO SOLO PARA LAS DOS COSAS. Un blog y una base de documentación se
 * escriben igual —un título, unos párrafos, unas listas— y lo único que cambia
 * es dónde se listan. Con dos motores, uno se queda atrás: el blog se llena y
 * la documentación se seca, o al revés.
 *
 * Y POR QUÉ IMPORTA PARA GOOGLE. Cada artículo es una página propia con su
 * dirección, su descripción y sus dos idiomas, y entra sola al mapa del sitio.
 * Cada cosa que publicamos suma; escribirlo todo dentro de una sola página
 * larga no suma nada.
 *
 * El contenido largo vive en archivos de datos, no en `messages/*.json`: los
 * mensajes son para botones y etiquetas, y se llenarían de párrafos que nadie
 * encuentra.
 */

export type BloqueArticulo =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; puntos: string[] }
  | { tipo: "pasos"; pasos: { titulo: string; texto: string }[] }
  | {
      tipo: "aviso";
      tono: "neutro" | "acento" | "bien" | "ojo";
      titulo: string;
      texto: string;
    }
  | { tipo: "tabla"; encabezados: string[]; filas: string[][]; nota?: string }
  /**
   * UNA CAPTURA DE PANTALLA DEL PROPIO SOFTWARE.
   *
   * Lo pidió el dueño para el tutorial del W-8BEN-E: «el link tiene que tener
   * capturas de pantalla del mismo software de nosotros, que diga dónde está,
   * en qué menú, los pasos». Un tutorial de solo texto no está terminado —
   * regla de la casa.
   *
   * `alt` es obligatorio y no decorativo: es lo que lee quien no ve la imagen,
   * y lo que lee Google. `pie` es la leyenda que va debajo, para decir en una
   * línea qué mirar.
   */
  | { tipo: "imagen"; src: string; alt: string; pie?: string }
  /**
   * Un botón que lleva a otra pantalla: la demostración, una herramienta, un
   * formulario. Existe porque un párrafo no es clicable y «abre tal dirección»
   * escrito en texto obliga a copiarla a mano. `externo` abre en pestaña
   * nueva: se usa para lo que no es una página del sitio (la demostración es
   * un HTML aparte y volver atrás desde ahí perdería el artículo).
   */
  | { tipo: "boton"; texto: string; href: string; externo?: boolean };

/**
 * Dónde se lista.
 *
 * - `documentacion` — cómo funciona algo. Vive para siempre y se actualiza.
 * - `novedad` — qué se publicó y cuándo. Es una foto de un momento.
 */
export type TipoArticulo = "documentacion" | "novedad";

export type Articulo = {
  /** La dirección: /blog/<slug> o /docs/<slug>. No se cambia nunca una vez publicado. */
  slug: string;
  tipo: TipoArticulo;
  titulo: string;
  /** Meta description y entradilla de la lista. Una frase, no un párrafo. */
  resumen: string;
  /** ISO, para ordenar y para el dato estructurado. */
  fecha: string;
  /** Etiquetas cortas. Ayudan a Google a entender de qué va. */
  temas: string[];
  cuerpo: BloqueArticulo[];
  /** Un documento relacionado, si lo hay. */
  enlaces?: { texto: string; href: string }[];
};
