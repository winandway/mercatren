import { getTableName, sql, type Column } from "drizzle-orm";

/**
 * UNA COLUMNA DE LA CONSULTA DE AFUERA, SIEMPRE CON SU TABLA DELANTE.
 *
 * ══ EL FALLO QUE ESTO CIERRA (25 sep 2026) ══
 *
 * Una subconsulta en las columnas de un `select` se escribía así:
 *
 *   (SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id})
 *
 * Cuando la consulta de afuera NO tiene uniones, Drizzle escribe las columnas
 * sin la tabla: `WHERE "pedido_id" = "id"`. Y dentro de la subconsulta SQLite
 * busca `"id"` primero en la tabla de ADENTRO, que casi siempre tiene su
 * propia columna `id`. La condición deja de comparar con el pedido y compara
 * la fila consigo misma. Nadie ve un error: sale un cero, un `null` o una
 * suma inflada, y la pantalla lo enseña como dato.
 *
 * Medido con `toSQL()`: sin uniones sale `"pedido_id" = "id"`; con una unión,
 * `"items_pedido"."pedido_id" = "pedidos"."id"`. Por eso unas pantallas
 * funcionaban y otras no, con el mismo código.
 *
 * ══ LO QUE ROMPÍA EN PRODUCCIÓN ══
 *
 * - «Mis pedidos» del comprador: «0 artículos» en todos, y el aviso de «pago
 *   en revisión» no salía nunca, así que a quien ya había subido su
 *   comprobante de Zelle se le ofrecía «Pagar ahora».
 * - El tablero «Hoy» del panel: ventas y margen en cero.
 * - Panel → Comercios: el saldo de cada comercio en cero.
 * - Cobros vistos desde un comercio: el total de arriba, inflado (con dos
 *   columnas llamadas `pedido_id` la condición era siempre verdadera).
 * - Búsqueda por foto: resultados sin imagen.
 *
 * ══ CÓMO SE USA ══
 *
 *   WHERE ${itemsPedido.pedidoId} = ${columnaDeFuera(pedidos.id)}
 *
 * La de ADENTRO se deja como está: sin tabla, SQLite la busca primero dentro,
 * que es justo lo que se quiere. La de AFUERA va siempre por aquí.
 * Funciona igual con uniones o sin ellas. Candado:
 * `tests/unit/columna-de-fuera.test.ts`.
 */
export function columnaDeFuera(columna: Column) {
  return sql.raw(`"${getTableName(columna.table)}"."${columna.name}"`);
}
