/**
 * ¿ESTÁ CORRIENDO DE VERDAD LA SINCRONIZACIÓN?
 *
 * ══ POR QUÉ HACE FALTA ESTO ══
 *
 * Desde el 15 ago 2026 un robotito pide la sincronización cada cuarto de hora.
 * Pero un robotito que deja de correr **no avisa**: la pantalla sigue diciendo
 * la fecha de la última vez que funcionó, y esa fecha se lee igual de bien
 * tenga cinco minutos o cinco semanas. El comercio sigue confiando en un stock
 * que dejó de actualizarse, y se entera cuando le vende a alguien algo que ya
 * no tiene.
 *
 * Un dato que envejece en silencio es peor que no tener el dato: uno hace
 * preguntar, el otro hace confiar.
 *
 * ══ LA TOLERANCIA NO ES EL INTERVALO ══
 *
 * El robotito corre cada 15 minutos, pero la alarma no salta a los 16. GitHub
 * retrasa las tareas programadas cuando anda cargado —es normal y está
 * documentado—, y una pantalla que se pone roja cada vez que una corrida llega
 * tarde enseña a ignorar el rojo. Se avisa cuando se han perdido **cuatro
 * corridas seguidas**: ahí ya no es un retraso, es que algo se rompió.
 */

/** Cada cuánto pide la sincronización el robotito (`.github/workflows`). */
export const CADA_MINUTOS = 15;

/** Cuántas corridas seguidas se pueden perder antes de avisar. */
export const CORRIDAS_DE_GRACIA = 4;

export const TOLERANCIA_MINUTOS = CADA_MINUTOS * CORRIDAS_DE_GRACIA;

export type SaludSincronizacion = {
  nivel: "sin_direccion" | "nunca" | "al_dia" | "atrasada";
  /** Minutos enteros desde la última vez. `null` si nunca corrió. */
  minutos: number | null;
};

function aMilisegundos(valor: Date | number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const ms = valor instanceof Date ? valor.getTime() : Number(valor);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

/**
 * El estado de salud de una fuente.
 *
 * Es puro y recibe el «ahora» de fuera: una función que mira el reloj por
 * dentro no se puede probar sin esperar de verdad.
 */
export function saludDeSincronizacion(
  ultima: Date | number | null | undefined,
  ahora: Date | number,
  opciones?: { tieneDireccion?: boolean; toleranciaMinutos?: number },
): SaludSincronizacion {
  /* Sin dirección no hay nada que sincronizar, y decir «atrasada» ahí sería
     culpar al comercio de no haber configurado algo que todavía no configuró.
     Lo que le toca leer es «falta la dirección», que es otra cosa. */
  if (opciones?.tieneDireccion === false) {
    return { nivel: "sin_direccion", minutos: null };
  }

  const ms = aMilisegundos(ultima);
  if (ms === null) return { nivel: "nunca", minutos: null };

  const ahoraMs = aMilisegundos(ahora) ?? 0;

  /**
   * UNA FECHA EN EL FUTURO SE TRATA COMO RECIÉN HECHA, NO COMO ERROR.
   *
   * El reloj del servidor y el de quien mira no siempre coinciden, y un
   * desfase de segundos daría minutos negativos. Lo que NO puede pasar es que
   * eso se lea como «atrasada»: sería una alarma falsa por un reloj mal puesto.
   */
  const minutos = Math.max(0, Math.floor((ahoraMs - ms) / 60_000));
  const tope = opciones?.toleranciaMinutos ?? TOLERANCIA_MINUTOS;

  return { nivel: minutos > tope ? "atrasada" : "al_dia", minutos };
}
