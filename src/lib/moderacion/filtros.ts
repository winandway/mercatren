import "server-only";

import { sql, type Column, type SQL } from "drizzle-orm";

import { columnaDeFuera } from "@/lib/db/columna-de-fuera";

import { DENUNCIAS_PARA_OCULTAR, type TipoDenunciable } from "./reglas";

/**
 * Lo que se le suma al WHERE de cada lista de contenido de usuarios.
 *
 * Las columnas de afuera van con `columnaDeFuera()`: dentro de una subconsulta
 * SQLite tomaría la columna de la tabla de ADENTRO (la trampa del 25 sep).
 */

/** Esconde lo que ya juntó tres denuncias abiertas de personas distintas. */
export function noOcultoPorDenuncias(
  tipo: TipoDenunciable,
  columnaId: Column,
): SQL {
  return sql`${columnaDeFuera(columnaId)} not in (select "objeto_id" from "denuncias_contenido" where "tipo" = ${tipo} and "estado" = 'abierta' group by "objeto_id" having count(*) >= ${DENUNCIAS_PARA_OCULTAR})`;
}

/**
 * Esconde, solo para quien mira, lo que publicó alguien que bloqueó. Sin
 * sesión no hay a quién esconderle nada. El `coalesce` evita que un autor
 * vacío (una pregunta escrita por el comercio) desaparezca por el NULL.
 */
export function autorNoBloqueado(
  columnaAutor: Column,
  quienMira: string | null | undefined,
): SQL | undefined {
  if (!quienMira) return undefined;
  return sql`coalesce(${columnaDeFuera(columnaAutor)}, '') not in (select "bloqueado_id" from "bloqueos_usuario" where "usuario_id" = ${quienMira})`;
}
