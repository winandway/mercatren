import "server-only";

import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { bitacoraPagos } from "@/lib/db/schema";

/**
 * Anota un paso del circuito de cobro. NUNCA lanza: una bitácora que tumba
 * el pago que vino a vigilar es peor que no tenerla. Si la escritura falla,
 * queda el error en la consola del servidor y el cobro sigue su camino.
 */
export async function anotarEnBitacora(entrada: {
  pedidoId: string;
  metodo: "stripe" | "zelle" | "billetera";
  paso: string;
  detalle?: string | null;
}) {
  try {
    await getDb()
      .insert(bitacoraPagos)
      .values({
        id: `bit-${nanoid(12)}`,
        pedidoId: entrada.pedidoId,
        metodo: entrada.metodo,
        paso: entrada.paso,
        detalle: entrada.detalle?.slice(0, 2000) ?? null,
      });
  } catch (fallo) {
    console.error("[bitacora] no se pudo anotar", entrada.paso, fallo);
  }
}
