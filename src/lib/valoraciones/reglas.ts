/**
 * LAS ESTRELLAS DE UN PRODUCTO.
 *
 * ══ POR QUÉ ESTO ES PURO Y VIVE APARTE ══
 *
 * Porque el promedio es lo que decide una compra, y un promedio mal calculado
 * —o redondeado a favor— es publicidad engañosa. Aquí no hay base ni red: solo
 * la cuenta, y tiene pruebas.
 */

export const ESTRELLAS_MINIMAS = 1;
export const ESTRELLAS_MAXIMAS = 5;

/** ¿Es una puntuación que se puede guardar? */
export function esPuntuacionValida(estrellas: unknown): boolean {
  const n = Number(estrellas);
  return (
    Number.isInteger(n) && n >= ESTRELLAS_MINIMAS && n <= ESTRELLAS_MAXIMAS
  );
}

export type Resumen = {
  /** El promedio con UN decimal, como se enseña. `null` si no hay ninguna. */
  promedio: number | null;
  cuantas: number;
};

/**
 * El promedio de un montón de puntuaciones.
 *
 * ══ SIN VALORACIONES NO SE INVENTA UN NÚMERO ══
 *
 * Devuelve `null`, no cero. Un producto nuevo con «0 de 5 estrellas» se lee
 * como un producto malísimo, cuando lo que pasa es que todavía nadie opinó —
 * y eso hunde la venta de todo lo que se acaba de publicar.
 *
 * ══ SE REDONDEA A UN DECIMAL, HACIA EL VALOR REAL ══
 *
 * Nunca hacia arriba. Un 4,44 se enseña como 4,4; convertirlo en 4,5 es
 * inflar la nota, y eso es justo lo que la ley llama engañoso.
 */
export function resumirValoraciones(estrellas: number[]): Resumen {
  const validas = estrellas.filter((e) => esPuntuacionValida(e));
  if (validas.length === 0) return { promedio: null, cuantas: 0 };

  const suma = validas.reduce((t, e) => t + e, 0);
  return {
    promedio: Math.round((suma / validas.length) * 10) / 10,
    cuantas: validas.length,
  };
}

/**
 * Cuántas estrellas se pintan llenas, para dibujarlas.
 *
 * Se redondea a la media estrella más cercana: es como se lee un 4,3 de un
 * vistazo, y es lo que hacen todas las tiendas.
 */
export function estrellasLlenas(promedio: number | null): number {
  if (promedio === null) return 0;
  return Math.round(promedio * 2) / 2;
}

/**
 * El comentario, recortado y limpio.
 *
 * Se admite vacío: mucha gente puntúa y no escribe, y obligarla a escribir
 * hace que no puntúe.
 */
export const LARGO_MAXIMO_COMENTARIO = 1000;

export function limpiarComentario(texto: unknown): string | null {
  const limpio = String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!limpio) return null;
  return limpio.slice(0, LARGO_MAXIMO_COMENTARIO);
}
