/**
 * La regla de contabilidad de los pagos Zelle, en un solo lugar.
 *
 * SOLO SE CUENTA LO QUE ENTRA. Un retiro es dinero que salio de la cuenta:
 * se guarda y se puede listar, pero no puede aparecer en ningun total, porque
 * inflaria las ventas del comercio.
 *
 * Todo lo que calcule dinero debe pasar por aqui o por el filtro equivalente
 * en la base (`tipo = 'entrada'`).
 */

export type MovimientoContable = {
  tipo: "entrada" | "retiro";
  estado: "aprobado" | "pendiente" | "rechazado";
  montoCentavos: number;
  comisionCentavos?: number;
  netoCentavos?: number;
};

/** Un retiro nunca cuenta. Un pago sin aprobar tampoco entro a caja. */
export function cuentaComoIngreso(movimiento: MovimientoContable) {
  return movimiento.tipo === "entrada" && movimiento.estado === "aprobado";
}

/** Suma de lo que de verdad entro, en centavos. */
export function totalizarIngresos(movimientos: MovimientoContable[]) {
  return movimientos.filter(cuentaComoIngreso).reduce(
    (acumulado, m) => ({
      pagos: acumulado.pagos + 1,
      montoCentavos: acumulado.montoCentavos + m.montoCentavos,
      comisionCentavos: acumulado.comisionCentavos + (m.comisionCentavos ?? 0),
      netoCentavos: acumulado.netoCentavos + (m.netoCentavos ?? 0),
    }),
    { pagos: 0, montoCentavos: 0, comisionCentavos: 0, netoCentavos: 0 },
  );
}
