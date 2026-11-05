import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { desistimientos, hitosPedido } from "@/lib/db/schema";
import {
  MERCADOS_CON_DESISTIMIENTO,
  puedeDesistir,
  venceElPlazo,
} from "@/lib/pedidos/desistimiento";

export type SituacionDesistimiento = {
  puede: boolean;
  /** Hasta cuándo, si ya se recibió; null si todavía no llegó. */
  vence: Date | null;
  desistidoEn: Date | null;
};

/**
 * Lo que necesita la pantalla del pedido para el botón «Desistir del contrato
 * aquí». Fuera de España devuelve null SIN tocar la base: mirar un pedido de
 * Estados Unidos no puede costar dos lecturas de más.
 */
export async function situacionDesistimiento(pedido: {
  id: string;
  mercado: string;
  estado: string;
}): Promise<SituacionDesistimiento | null> {
  if (
    !(MERCADOS_CON_DESISTIMIENTO as readonly string[]).includes(
      pedido.mercado.trim().toUpperCase(),
    )
  )
    return null;
  const db = getDb();
  const [[entrega], [hecho]] = await Promise.all([
    db
      .select({ creadoEn: hitosPedido.creadoEn })
      .from(hitosPedido)
      .where(
        and(
          eq(hitosPedido.pedidoId, pedido.id),
          eq(hitosPedido.hito, "entregado"),
        ),
      )
      .orderBy(desc(hitosPedido.creadoEn))
      .limit(1),
    db
      .select({ creadoEn: desistimientos.creadoEn })
      .from(desistimientos)
      .where(eq(desistimientos.pedidoId, pedido.id))
      .limit(1),
  ]);
  const entregadoEn = entrega?.creadoEn ?? null;
  const desistidoEn = hecho?.creadoEn ?? null;
  return {
    puede: puedeDesistir({
      mercado: pedido.mercado,
      estado: pedido.estado,
      entregadoEn,
      desistidoEn,
    }),
    vence: venceElPlazo(entregadoEn),
    desistidoEn,
  };
}
