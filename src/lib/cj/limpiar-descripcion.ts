/**
 * LIMPIAR LA DESCRIPCIÓN QUE DEVUELVE CJ.
 *
 * ══ VIVE APARTE DE LA LLAMADA, Y NO ES CAPRICHO ══
 *
 * Estas dos funciones no hablan con nadie: reciben texto y devuelven texto.
 * Puestas junto al `fetch` arrastraban `server-only`, y entonces no se podían
 * probar — que es justo lo que hace falta en la pieza que decide qué texto de
 * un tercero acaba dentro de nuestras fichas.
 */

/**
 * CJ devuelve la descripción como HTML crudo, y a veces con la maquetación
 * entera de su ficha dentro.
 *
 * Se quita todo el marcado: lo que va a la base es texto, y la pantalla del
 * producto lo dibuja con su propio estilo. Meter el HTML de un tercero en
 * nuestra página es abrirle la puerta a que su maquetación rompa la nuestra —
 * y, con `dangerouslySetInnerHTML`, a algo peor.
 */
export function limpiarHtml(crudo: string | null | undefined): string {
  if (!crudo?.trim()) return "";

  return (
    crudo
      /* Un salto de línea donde el HTML tenía un corte de bloque, para que los
         párrafos no queden pegados en una sola parrafada. */
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      /* Y fuera el resto del marcado, incluidos los guiones y estilos que CJ
         mete dentro. */
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, " ")
      /* Las entidades más comunes. No hace falta una tabla entera: lo que no
         se reconozca se queda como está y se lee igual. */
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      /* Espacios y saltos de más. */
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^[ \t]+|[ \t]+$/gm, "")
      .trim()
  );
}

/**
 * El tope de largo.
 *
 * Merchant Center corta la descripción en 5.000 caracteres, y las de CJ a
 * veces traen la ficha entera repetida tres veces. Se corta en una frase
 * completa, no a mitad de palabra: una descripción que termina en «el produc»
 * se lee como si el sitio estuviera roto.
 */
const LARGO_MAXIMO = 2000;

export function recortar(texto: string): string {
  if (texto.length <= LARGO_MAXIMO) return texto;

  const cortado = texto.slice(0, LARGO_MAXIMO);
  const finDeFrase = Math.max(
    cortado.lastIndexOf(". "),
    cortado.lastIndexOf(".\n"),
    cortado.lastIndexOf("\n"),
  );
  return finDeFrase > LARGO_MAXIMO / 2
    ? cortado.slice(0, finDeFrase + 1).trim()
    : cortado.trim();
}
