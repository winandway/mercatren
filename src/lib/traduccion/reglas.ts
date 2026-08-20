/**
 * QUÉ HAY QUE TRADUCIR, Y CÓMO SE SABE.
 *
 * Puro a propósito: decide sobre los valores que le pasan, sin tocar la base
 * ni hablar con nadie. Así se puede probar entero, que es lo que hace falta
 * cuando de esto depende no reescribir un catálogo por error.
 */

/**
 * ¿Este producto todavía está sin traducir?
 *
 * ══ LA SEÑAL ES QUE LOS DOS IDIOMAS DIGAN LO MISMO ══
 *
 * El importador de CJ guarda el título inglés en los DOS campos, porque CJ
 * solo publica `productName` (en chino) y `productNameEn`. Español no da. Así
 * que un producto con `titulo_es` idéntico a `titulo_en` es, con seguridad,
 * uno que nunca se tradujo.
 *
 * ══ POR QUÉ NO SE ADIVINA EL IDIOMA ══
 *
 * Lo obvio sería mirar si el texto «parece inglés». No sirve: medio catálogo
 * de CJ son títulos como «S24109 Elecony 24 Inch Fat Tire Bike Youth Full
 * Shimano 7 Speed», donde la mitad son códigos y marcas. Un detector de
 * idioma se equivoca ahí, y equivocarse significa **reescribir un título que
 * una persona ya había corregido a mano**. Eso no se puede deshacer.
 *
 * Comparar los dos campos no se equivoca nunca en esa dirección: si alguien
 * tradujo, dejaron de ser iguales, y este producto no se vuelve a tocar.
 */
export function faltaTraducir(producto: {
  tituloEs: string | null;
  tituloEn: string | null;
}): boolean {
  const es = (producto.tituloEs ?? "").trim();
  const en = (producto.tituloEn ?? "").trim();

  /* Sin título en inglés no hay de dónde traducir. */
  if (!en) return false;

  /* Sin título en español, claramente falta. */
  if (!es) return true;

  return es.toLowerCase() === en.toLowerCase();
}

/** Lo que se le manda al modelo, y lo que se espera de vuelta. */
export type PeticionDeTraduccion = {
  id: string;
  tituloEn: string;
  descripcionEn?: string | null;
};

export type TraduccionHecha = {
  id: string;
  tituloEs: string;
  descripcionEs?: string | null;
};

/**
 * ¿Sirve lo que devolvió el modelo?
 *
 * ══ TODO LO QUE VIENE DE UN MODELO SE COMPRUEBA ANTES DE GUARDARLO ══
 *
 * Aquí se está por sobrescribir el título de un producto publicado, que es lo
 * que ve el comprador y lo que lee Google. Un modelo puede devolver una
 * disculpa («No puedo traducir eso»), una cadena vacía, o el mismo texto en
 * inglés. Cualquiera de las tres, guardada, deja la ficha peor que antes.
 */
export function traduccionUtil(
  original: string,
  traducido: string | null | undefined,
): boolean {
  const t = (traducido ?? "").trim();
  if (t.length < 3) return false;

  /* Devolvió lo mismo: no tradujo nada. Guardarlo sería marcar el producto
     como traducido y no volver a intentarlo nunca. */
  if (t.toLowerCase() === original.trim().toLowerCase()) return false;

  /* Un título de producto no es un párrafo. Si el modelo se puso a explicar,
     eso no va a la ficha. El tope es generoso: los títulos de CJ ya son
     largos de por sí. */
  if (t.length > original.length * 3 + 120) return false;

  return true;
}

/**
 * De cuántos en cuántos se traduce.
 *
 * ══ POR QUÉ POR TANDAS Y NO DE UN TIRÓN ══
 *
 * El sitio corre en el borde, donde una petición tiene un tiempo limitado.
 * Traducir 3.000 productos en una sola llamada se corta a la mitad y deja el
 * catálogo con medio título en español y medio en inglés, sin saber por dónde
 * iba. Por tandas, cada una termina o no empieza.
 *
 * Veinte es lo que cabe cómodo en una llamada al modelo sin que la respuesta
 * se vuelva difícil de parsear.
 */
export const POR_TANDA = 20;

/**
 * El aviso de que falta la llave, en el idioma del panel.
 * Se devuelve como clave de traducción, nunca como frase escrita a mano.
 */
export const AVISO_SIN_LLAVE = "traduccion.sinLlave" as const;

export type ResultadoModelo =
  | { ok: true; traducciones: TraduccionHecha[] }
  | { ok: false; motivo: string };

/**
 * Saca las traducciones de lo que devolvió el modelo.
 *
 * ══ VIVE AQUÍ, CON LAS REGLAS, Y NO CON LA LLAMADA ══
 *
 * Porque no habla con nadie: recibe un objeto y devuelve otro. Puesta junto al
 * `fetch` arrastraba `server-only`, y entonces no se podía probar — que es
 * justo lo que hace falta en la pieza que decide si se sobrescribe el título
 * de un producto publicado.
 *
 * ══ NADA DE LO QUE VIENE DEL MODELO SE CREE SIN COMPROBAR ══
 *
 * Un id que nadie pidió se descarta, una fila a medias se salta, y una
 * traducción que no sirve no se guarda. Un modelo puede devolver cualquier
 * cosa, y lo que hay al otro lado es el catálogo en vivo.
 */
export function leerRespuesta(
  crudo: unknown,
  peticiones: PeticionDeTraduccion[],
): ResultadoModelo {
  const texto = (
    crudo as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof texto !== "string" || !texto.trim()) {
    return { ok: false, motivo: "El traductor devolvió una respuesta vacía." };
  }

  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return {
      ok: false,
      motivo: `El traductor no devolvió JSON: ${texto.slice(0, 200)}`,
    };
  }

  const lista = (datos as { t?: unknown })?.t;
  if (!Array.isArray(lista)) {
    return {
      ok: false,
      motivo: "El traductor devolvió un JSON con otra forma.",
    };
  }

  const porId = new Map(peticiones.map((p) => [p.id, p]));
  const traducciones: TraduccionHecha[] = [];

  for (const fila of lista) {
    const id = (fila as { id?: unknown })?.id;
    const titulo = (fila as { titulo?: unknown })?.titulo;
    if (typeof id !== "string" || typeof titulo !== "string") continue;

    const pedido = porId.get(id);
    if (!pedido) continue;
    if (!traduccionUtil(pedido.tituloEn, titulo)) continue;

    traducciones.push({ id, tituloEs: titulo.trim() });
  }

  return { ok: true, traducciones };
}
