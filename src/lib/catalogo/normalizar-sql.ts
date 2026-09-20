import { sql, type SQL } from "drizzle-orm";

/**
 * Quitar acentos y mayúsculas DENTRO de SQL, con la misma regla que
 * `normalizarTexto` aplica en JavaScript a lo que escribe la persona.
 *
 * Vive aparte porque la usan dos sitios que no pueden importarse entre sí:
 * el buscador (`buscar.ts`) y quien le prepara el texto (`texto-de-busqueda.ts`).
 */

/** Las parejas que se reemplazan para ignorar acentos. */
export const ACENTOS: [string, string][] = [
  ["á", "a"],
  ["Á", "a"],
  ["é", "e"],
  ["É", "e"],
  ["í", "i"],
  ["Í", "i"],
  ["ó", "o"],
  ["Ó", "o"],
  ["ú", "u"],
  ["Ú", "u"],
  ["ü", "u"],
  ["Ü", "u"],
  ["ñ", "n"],
  ["Ñ", "n"],
];

/**
 * El mismo texto, sin acentos y en minúsculas, dentro de SQL.
 *
 * OJO: las letras van escritas dentro de la consulta (sql.raw) y NO como
 * parámetros. Con parámetros, cada columna normalizada gastaba 28 huecos y la
 * base cortaba con "too many SQL variables". Es seguro porque son constantes
 * de este archivo, nunca texto de nadie.
 *
 * Y se normaliza el texto YA CONCATENADO, no columna por columna: catorce
 * reemplazos en total en vez de catorce por columna.
 */
export function normalizarSql(columna: SQL | unknown): SQL {
  let expresion = sql`COALESCE(${columna}, '')`;
  for (const [con, sin] of ACENTOS) {
    expresion = sql`REPLACE(${expresion}, ${sql.raw(`'${con}'`)}, ${sql.raw(`'${sin}'`)})`;
  }
  return sql`LOWER(${expresion})`;
}
