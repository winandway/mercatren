/**
 * ══ CERRAR UNA CUENTA CON TIENDA: LAS REGLAS (5 nov 2026) ══
 *
 * Pedido de Gerencia por la regla 5.1.1(v) de Apple: una cuenta con tienda no
 * se manda a «escribir a soporte»; la persona EMPIEZA el borrado ella misma,
 * desde la app o desde la web, y se le dicen los pasos y los días.
 *
 * Como lo hace el mercado (Etsy, Shopify): al pedirlo, la tienda se apaga a la
 * venta en ese momento; se terminan los pedidos abiertos, se resuelven los
 * pagos que esperan revisión y se le paga su saldo; cuando ya no queda nada,
 * la cuenta se borra sola (anonimizada, como cualquier otra: los pedidos y las
 * facturas se guardan cinco años por ley) y se le avisa por correo.
 *
 * Puro: decide con números, sin tocar la base.
 */
export const DIAS_TIPICOS_DEL_CIERRE = 30;

export type SituacionDelCierre = {
  /** Pedidos con productos de la tienda, pagados y todavía en camino. */
  pedidosAbiertos: number;
  /** Pagos que esperan revisión (Zelle sin aprobar). */
  pagosPendientes: number;
  /** Lo que la tienda tiene a su favor, incluido lo que ya pidió retirar. */
  saldoCentavos: number;
};

export type PasoDelCierre = "pedidos" | "pagos" | "saldo";

/** Lo que todavía falta, en el orden en que se resuelve. */
export function pasosPendientes(s: SituacionDelCierre): PasoDelCierre[] {
  const faltan: PasoDelCierre[] = [];
  if (s.pedidosAbiertos > 0) faltan.push("pedidos");
  if (s.pagosPendientes > 0) faltan.push("pagos");
  if (s.saldoCentavos > 0) faltan.push("saldo");
  return faltan;
}

/** ¿Ya se puede borrar la cuenta? Solo sin nada pendiente. */
export function cierreListo(s: SituacionDelCierre): boolean {
  return pasosPendientes(s).length === 0;
}
