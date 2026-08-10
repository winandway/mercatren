/**
 * LAS REGLAS DE UN CONTRACARGO.
 *
 * ══ QUÉ ES ESTO Y POR QUÉ DUELE ══
 *
 * Un contracargo es el comprador diciéndole a su banco que no reconoce el
 * cargo. El banco le devuelve el dinero **quitándolo de nuestra cuenta**, y
 * puede pasar hasta 120 días después de la venta — con el comercio ya
 * acreditado y la mercancía ya entregada.
 *
 * ══ POR QUÉ ES PURO Y ESTÁ PROBADO ══
 *
 * Aquí se decide qué es urgente y cuánto tiempo queda para responder. Un error
 * en ese cálculo se traduce en una disputa perdida por no contestar a tiempo,
 * que es la forma más tonta de perder dinero: se pierde sola, sin que nadie
 * decida nada.
 */

export type EstadoDisputa = "abierta" | "ganada" | "perdida" | "retirada";

/**
 * Cómo llama Stripe a los desenlaces, traducido a los nuestros.
 *
 * `warning_*` son avisos previos: el banco todavía no abrió la disputa formal,
 * pero ya hay una queja. Se tratan como abiertas porque la acción que toca es
 * la misma — mirar el pedido y preparar la respuesta.
 */
export function estadoDesdeStripe(
  estado: string | null | undefined,
): EstadoDisputa {
  switch (estado) {
    case "won":
      return "ganada";
    case "lost":
      return "perdida";
    /* El aviso previo se cerró sin llegar a disputa formal: no hay nada que
       responder y no salió dinero. */
    case "warning_closed":
      return "retirada";
    default:
      return "abierta";
  }
}

/** Si todavía se puede hacer algo. Una cerrada ya no admite pruebas. */
export function sigueAbierta(estado: EstadoDisputa): boolean {
  return estado === "abierta";
}

/**
 * Cuántos días quedan para mandar pruebas.
 *
 * Devuelve `null` cuando Stripe no dio fecha límite. **No devuelve 0**: cero
 * significa «hoy es el último día», que es una alarma, y confundir «no sé» con
 * «se acaba hoy» haría que el equipo corriera sin motivo o —peor— dejara de
 * correr cuando sí hay que hacerlo.
 */
export function diasParaResponder(
  respondeHasta: Date | null,
  ahora: Date,
): number | null {
  if (!respondeHasta) return null;

  const MS_POR_DIA = 86_400_000;
  const dias = Math.ceil(
    (respondeHasta.getTime() - ahora.getTime()) / MS_POR_DIA,
  );

  // Vencida es vencida: no se enseñan días negativos.
  return Math.max(0, dias);
}

/**
 * Si hay que gritar.
 *
 * Una disputa abierta con tres días o menos para responder es lo que se mira
 * antes que nada en la mañana. Sin fecha límite también cuenta: no saber
 * cuánto queda es motivo de mirarlo, no de dejarlo pasar.
 */
export function esUrgente(
  estado: EstadoDisputa,
  diasRestantes: number | null,
): boolean {
  if (!sigueAbierta(estado)) return false;
  return diasRestantes === null || diasRestantes <= 3;
}
