import "server-only";

import { desc, eq } from "drizzle-orm";

import { ESTADOS_EN_BODEGA, type EstadoPaquete } from "@/lib/casillero/estados";
import { getDb } from "@/lib/db";
import { eventosPaquete, paquetesCasillero } from "@/lib/db/schema";

/**
 * Los paquetes de un casillero, con lo que el cliente necesita saber:
 * qué llegó, cuánto pesa lo que se le va a cobrar, y si le falta declarar.
 *
 * ══ SIN VALOR DECLARADO NO SALE DE LA BODEGA ══
 *
 * Lo exige la aduana, no el sistema. Por eso «falta declarar» se enseña
 * como una tarea del cliente y no como un estado más de la lista: es lo
 * único que él tiene que hacer para que su caja se mueva.
 */
export async function paquetesDe(casilleroId: string) {
  const filas = await getDb()
    .select({
      id: paquetesCasillero.id,
      wr: paquetesCasillero.wr,
      tracking: paquetesCasillero.tracking,
      carrier: paquetesCasillero.carrier,
      remitente: paquetesCasillero.remitente,
      pesoLb: paquetesCasillero.pesoLb,
      pesoFacturableLb: paquetesCasillero.pesoFacturableLb,
      largoIn: paquetesCasillero.largoIn,
      anchoIn: paquetesCasillero.anchoIn,
      altoIn: paquetesCasillero.altoIn,
      estado: paquetesCasillero.estado,
      valorDeclaradoCentavos: paquetesCasillero.valorDeclaradoCentavos,
      recibidoEn: paquetesCasillero.recibidoEn,
    })
    .from(paquetesCasillero)
    .where(eq(paquetesCasillero.casilleroId, casilleroId))
    .orderBy(desc(paquetesCasillero.recibidoEn))
    .limit(200)
    .catch(() => []);

  return filas.map((p) => ({
    ...p,
    estado: p.estado as EstadoPaquete,
    enBodega: ESTADOS_EN_BODEGA.includes(p.estado as EstadoPaquete),
    faltaDeclarar: p.valorDeclaradoCentavos === null,
  }));
}

/** El historial de un paquete, solo lo que el cliente puede ver. */
export async function historialDe(paqueteId: string) {
  return getDb()
    .select({
      id: eventosPaquete.id,
      tipo: eventosPaquete.tipo,
      creadoEn: eventosPaquete.creadoEn,
    })
    .from(eventosPaquete)
    .where(eq(eventosPaquete.paqueteId, paqueteId))
    .orderBy(desc(eventosPaquete.creadoEn))
    .limit(50)
    .catch(() => []);
}
