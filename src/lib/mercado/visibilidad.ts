import type { Mercado } from "./mercados";

/**
 * ══ LA VISIBILIDAD DECIDIDA EN CÓDIGO, PARA LAS BÚSQUEDAS POR LISTA DE IDS ══
 * (emergencia de costo, 18 sep 2026)
 *
 * `WHERE id IN (24 ids) AND estado = ?` era la consulta más cara de la base
 * después de todo lo demás: 25.000 filas por llamada, 1.600 llamadas a la
 * hora. Sin estadísticas, SQLite apuesta por el índice de `estado`, recorre
 * TODOS los publicados y descarta, y deja la clave primaria sin usar. Medido
 * por YaDominios con EXPLAIN y rows_read: 42 filas sin `estado`, 25.136 con
 * él. Por eso las búsquedas por id piden SOLO `WHERE id IN (…)` —el único
 * índice posible es la clave primaria— y la visibilidad se decide aquí, con
 * las mismas tres condiciones de `visibleEn`: publicado, tienda activa, y
 * del mercado por el que se entró. Los ids ya venían de una foto que filtró
 * por eso; esto es el cerrojo de después.
 */
export function esVisibleEn(
  fila: {
    estado: string;
    tiendaEstado: string | null | undefined;
    tiendaMercado: string | null | undefined;
  },
  mercado: Mercado,
  paraElEquipo = false,
): boolean {
  const publicado = paraElEquipo
    ? fila.estado === "publicado" || fila.estado === "en_revision"
    : fila.estado === "publicado";
  return (
    publicado &&
    fila.tiendaEstado === "activa" &&
    fila.tiendaMercado === mercado.codigo
  );
}
