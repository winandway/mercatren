/**
 * EL PLAZO PARA DESISTIR DE UNA COMPRA (5 nov 2026, Fase 5: España).
 *
 * En España, quien compra a distancia puede desistir desde que hace el pedido
 * hasta 14 días naturales después de recibirlo, sin dar motivos (TRLGDCU arts.
 * 102 y 104). La directiva europea 2023/2673 pide además una función
 * «Desistir del contrato aquí», siempre a la vista durante el plazo, con un
 * paso de «Confirmar desistimiento» y un acuse con la fecha y la hora.
 *
 * Puro, para probarlo sin base de datos. Solo España: en Estados Unidos rige la
 * política de devoluciones de 30 días y en Venezuela el retiro con revisión.
 */

export const DIAS_PARA_DESISTIR = 14;

/** Los mercados donde la ley da este derecho y está construido. */
export const MERCADOS_CON_DESISTIMIENTO = ["ES"] as const;

/** Estados en los que ya no hay nada de qué desistir. */
const SIN_CONTRATO_VIVO = new Set(["cancelado", "devuelto", "reembolsado"]);

export type SituacionDelPedido = {
  mercado: string;
  estado: string;
  /** Cuándo se marcó «entregado», o null si todavía no llegó. */
  entregadoEn: Date | null;
  /** Cuándo se desistió, o null. */
  desistidoEn: Date | null;
};

/** Hasta cuándo se puede desistir; null si todavía no se recibió. */
export function venceElPlazo(entregadoEn: Date | null): Date | null {
  if (!entregadoEn) return null;
  return new Date(
    entregadoEn.getTime() + DIAS_PARA_DESISTIR * 24 * 60 * 60 * 1000,
  );
}

/** Por qué no se puede desistir, o null si se puede. */
export function motivoParaNoDesistir(
  p: SituacionDelPedido,
  ahora: Date = new Date(),
): "no_aplica" | "ya_desistio" | "fuera_de_plazo" | null {
  if (
    !(MERCADOS_CON_DESISTIMIENTO as readonly string[]).includes(
      p.mercado.trim().toUpperCase(),
    )
  )
    return "no_aplica";
  if (p.desistidoEn) return "ya_desistio";
  /* Un pedido sin pagar no es un contrato que haya que deshacer: se cancela.
     Y uno cancelado o reembolsado ya no tiene nada de qué desistir. */
  if (p.estado === "pendiente_pago" || SIN_CONTRATO_VIVO.has(p.estado))
    return "no_aplica";
  const vence = venceElPlazo(p.entregadoEn);
  if (vence !== null && ahora.getTime() > vence.getTime())
    return "fuera_de_plazo";
  return null;
}

export function puedeDesistir(
  p: SituacionDelPedido,
  ahora: Date = new Date(),
): boolean {
  return motivoParaNoDesistir(p, ahora) === null;
}
