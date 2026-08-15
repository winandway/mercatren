/**
 * QUE NO SALGAN TODOS JUNTOS LOS DE LA MISMA TIENDA.
 *
 * ══ EL PROBLEMA QUE RESUELVE ══
 *
 * El catálogo de Estados Unidos entró completo el mismo día. Y el barajado de
 * la portada le da **ventaja a lo recién llegado** —a propósito, para que la
 * tienda se vea viva— así que los 78 ganaron la ventaja a la vez y salieron
 * pegados: hileras enteras con banderita seguidas de hileras enteras sin ella.
 *
 * Parecen dos tiendas pegadas con cinta, no una sola. Y no es solo estética:
 * una hilera entera de lámparas en inglés le dice al comprador venezolano que
 * esa parte no es para él, y deja de bajar.
 *
 * ══ POR QUÉ SE HACE AQUÍ Y NO EN LA CONSULTA ══
 *
 * Porque en SQL no se puede intercalar sin reescribir el orden entero, y ese
 * orden lleva dentro dos cosas que costaron trabajo y no se pueden perder: la
 * **semilla** —que impide que la portada «baile» entre una carga y la
 * siguiente— y la ventaja de los productos nuevos.
 *
 * Así que la consulta sigue mandando el orden, y esto solo **separa lo que
 * quedó amontonado**, moviendo lo mínimo.
 *
 * ══ NO ES BARAJAR DE NUEVO ══
 *
 * Si se revolviera otra vez, la portada volvería a cambiar en cada visita y se
 * perdería la ventaja de lo nuevo. Aquí el orden que llega se respeta: solo se
 * adelanta un producto cuando el que tocaba haría el tercero seguido de la
 * misma tienda.
 */

/** Cuántos seguidos de la misma tienda se toleran antes de intercalar. */
export const MAXIMO_SEGUIDOS = 2;

/**
 * Reparte una lista ya ordenada para que no haya rachas de la misma tienda.
 *
 * `grupoDe` dice a qué tienda pertenece cada uno. Se agrupa por TIENDA y no
 * por país porque es lo que sirve también mañana, cuando el catálogo de
 * Estados Unidos esté repartido en varias tiendas por rubro: ahí lo que no
 * puede salir amontonado es cada una de ellas, no «lo de EE. UU.» en bloque.
 *
 * **Si solo hay una tienda, devuelve la lista tal cual.** Un catálogo de un
 * solo comercio no tiene nada que intercalar, y hacer trabajo de más en la
 * portada de todos por un caso que no existe es justo lo que la vuelve lenta.
 */
export function intercalarPorTienda<T>(
  lista: T[],
  grupoDe: (item: T) => string | null | undefined,
  maximoSeguidos = MAXIMO_SEGUIDOS,
): T[] {
  if (lista.length < 3 || maximoSeguidos < 1) return lista;

  /**
   * Cada tienda con sus productos, guardando LA POSICIÓN QUE TRAÍAN.
   *
   * La posición es lo que hace que esto respete el orden en vez de rehacerlo:
   * en cada paso se toma el producto que iba antes, y solo se salta al de otra
   * tienda cuando el que tocaba haría una racha demasiado larga.
   */
  const colas = new Map<string, Array<{ item: T; posicion: number }>>();

  lista.forEach((item, posicion) => {
    const grupo = grupoDe(item) ?? "";
    const cola = colas.get(grupo);
    if (cola) cola.push({ item, posicion });
    else colas.set(grupo, [{ item, posicion }]);
  });

  if (colas.size < 2) return lista;

  type Cabeza = { grupo: string; posicion: number };

  /** La cabeza de cada cola que todavía tiene productos. */
  function cabezas(): Cabeza[] {
    const disponibles: Cabeza[] = [];
    for (const [grupo, cola] of colas) {
      const primero = cola[0];
      if (primero) disponibles.push({ grupo, posicion: primero.posicion });
    }
    return disponibles;
  }

  const salida: T[] = [];
  let ultimoGrupo: string | null = null;
  let seguidos = 0;

  while (salida.length < lista.length) {
    const disponibles = cabezas();
    if (disponibles.length === 0) break;

    const rachaLlena = ultimoGrupo !== null && seguidos >= maximoSeguidos;
    const otros = disponibles.filter((c) => c.grupo !== ultimoGrupo);

    /* Si la racha está llena y queda de otra tienda, se adelanta esa. Si NO
       queda de otra, se sigue con la misma: dejar huecos en la parrilla para
       cumplir una regla de presentación sería mucho peor que la racha. */
    const entreLosQuePuedo: Cabeza[] =
      rachaLlena && otros.length > 0 ? otros : disponibles;

    /* Y de esos, el que iba primero. Nunca uno al azar: barajar de nuevo
       rompería la semilla y la portada volvería a cambiar en cada visita. */
    const elegido = entreLosQuePuedo.reduce((mejor: Cabeza, actual: Cabeza) =>
      actual.posicion < mejor.posicion ? actual : mejor,
    );

    const grupoElegido = elegido.grupo;
    salida.push(colas.get(grupoElegido)!.shift()!.item);

    seguidos = grupoElegido === ultimoGrupo ? seguidos + 1 : 1;
    ultimoGrupo = grupoElegido;
  }

  return salida;
}
