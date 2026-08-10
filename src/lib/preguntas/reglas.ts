/**
 * QUÉ PREGUNTA SALE EN LA FICHA Y CUÁL NO.
 *
 * Puro y con pruebas, porque las tres reglas de aquí se pueden romper sin que
 * se note hasta que un comprador ve algo que no debía ver.
 */

export type Pregunta = {
  id: string;
  preguntaEs: string;
  preguntaEn: string | null;
  respuestaEs: string | null;
  respuestaEn: string | null;
  autor: string;
  orden: number;
  estado: string;
};

/** Lo que se muestra, ya resuelto el idioma. */
export type PreguntaVisible = {
  id: string;
  pregunta: string;
  respuesta: string;
  /** Para poner «Respondido por el comercio» y que se sepa quién habla. */
  delComercio: boolean;
};

/**
 * UNA PREGUNTA SIN RESPUESTA NO SE PUBLICA.
 *
 * Es la regla que más importa. Cuando un comprador pueda preguntar, va a haber
 * preguntas esperando respuesta — y una ficha que enseña «¿esto sirve para
 * 220?» sin nada debajo es **peor que no tener nada**: le planta la duda al
 * siguiente comprador y no se la resuelve.
 *
 * La pregunta se guarda igual, y el comercio la ve en su panel. Al público
 * sale cuando hay algo que leer.
 */
export function tieneRespuesta(p: Pregunta): boolean {
  return Boolean(p.respuestaEs?.trim());
}

/** Ocultar no borra: el comercio puede volver a mostrarla. */
export function estaPublicada(p: Pregunta): boolean {
  return p.estado === "publicada";
}

/**
 * Las que ve el comprador, en su idioma y en orden.
 *
 * **Si falta la traducción, sale el español.** Misma regla que en todo el
 * catálogo: no se inventan traducciones, y es mejor leer la respuesta en el
 * otro idioma que no leerla.
 */
export function paraMostrar(
  preguntas: Pregunta[],
  idioma: string,
): PreguntaVisible[] {
  const en = idioma === "en";

  return (
    preguntas
      .filter((p) => estaPublicada(p) && tieneRespuesta(p))
      .slice()
      /* Por `orden` y, a igualdad, estable por id. Sin el desempate, dos
       preguntas con el mismo orden se pueden intercambiar entre una carga y
       otra, y la ficha "baila" sin motivo. */
      .sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id))
      .map((p) => ({
        id: p.id,
        pregunta: (en && p.preguntaEn?.trim()) || p.preguntaEs,
        respuesta: (en && p.respuestaEn?.trim()) || p.respuestaEs!,
        delComercio: p.autor === "comercio",
      }))
  );
}

/**
 * Cuántas caben.
 *
 * No es un capricho: veinte preguntas empujan los productos relacionados y el
 * botón de comprar fuera de la pantalla en un teléfono. Las que sobran se
 * quedan guardadas y el comercio decide el orden.
 */
export const MAXIMO_VISIBLES = 8;

export function recortar(visibles: PreguntaVisible[]): PreguntaVisible[] {
  return visibles.slice(0, MAXIMO_VISIBLES);
}
