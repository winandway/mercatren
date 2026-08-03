import type { Rol } from "@/lib/db/schema";

/**
 * Hasta donde llega la vista de quien esta mirando.
 *
 *  - "todos": el equipo de Mercatren, que ve la operacion completa.
 *  - "tienda": un comercio, que solo ve lo suyo.
 *
 * Esta parte es pura a proposito (no toca la sesion ni la base) para poder
 * probarla: es la puerta que impide que un comercio vea los pagos de otro.
 */
export type Alcance =
  { tipo: "todos"; rol: Rol } | { tipo: "tienda"; rol: Rol; tiendaId: string };

/**
 * Que comercio se consulta de verdad.
 *
 * Si quien pregunta es un comercio, SIEMPRE se usa el suyo, aunque en la
 * direccion venga pedido otro. Asi nadie puede espiar a otro comercio
 * cambiando el enlace a mano.
 */
export function comercioEfectivo(
  alcance: Alcance,
  comercioPedido?: string | null,
): string | null {
  if (alcance.tipo === "tienda") return alcance.tiendaId;
  return comercioPedido || null;
}
