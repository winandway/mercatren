/**
 * La regla de normalización del buscador, en su propio archivo.
 *
 * ══ POR QUÉ VIVE APARTE Y NO DENTRO DE `buscar.ts` ══
 *
 * Porque `sinonimos.ts` la necesita para armar su índice, y `buscar.ts`
 * necesita a `sinonimos.ts` para expandir lo que se busca. Importándose entre
 * sí se forma un círculo, y el círculo aquí no es un detalle de estilo: el
 * índice de sinónimos se construye AL CARGAR el módulo, así que llamaría a una
 * función de un archivo todavía a medio inicializar. En el navegador eso sale
 * como `normalizarTexto is not a function` y el buscador deja de responder.
 *
 * Copiar la función en los dos archivos habría sido peor: al primer arreglo,
 * una copia se queda atrás y el índice deja de calzar con la búsqueda.
 */

/** El mismo texto, sin acentos, en minúsculas y sin espacios sobrantes. */
export function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
