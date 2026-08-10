/**
 * QUÉ SIGNIFICA CADA ESTADO DE UN INTENTO DE COBRO DE STRIPE.
 *
 * ══ POR QUÉ ESTO ES UNA PIEZA APARTE Y PURA ══
 *
 * De esta decisión cuelga que se le acredite dinero a un comercio y que se
 * despache mercancía. Stripe tiene siete estados y solo UNO significa que el
 * dinero entró; los otros seis se parecen lo suficiente como para equivocarse
 * leyendo rápido — `requires_capture` suena a cobrado y no lo está, y
 * `processing` es justo el que invita a adelantarse.
 *
 * Escrito aquí y probado, en vez de un `=== "succeeded"` suelto dentro de una
 * consulta que nadie vuelve a mirar.
 */

/** Los estados que devuelve Stripe para un PaymentIntent. */
export type EstadoIntento =
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "processing"
  | "requires_capture"
  | "canceled"
  | "succeeded";

/**
 * SOLO `succeeded` ES DINERO QUE ENTRÓ.
 *
 * En particular NO cuentan:
 *
 * - `processing`: el cobro está en camino y todavía puede fallar. Es el que
 *   más se presta a error, porque en la pantalla de Stripe se ve avanzando.
 * - `requires_capture`: la tarjeta está autorizada pero el dinero no se ha
 *   tomado. Aquí no se usa autorización diferida, así que si aparece es que
 *   algo se configuró distinto — y ante eso, no acreditar.
 */
export function cobroConfirmado(estado: string | null | undefined): boolean {
  return estado === "succeeded";
}

/**
 * Si todavía tiene sentido volver a preguntarle a Stripe por este intento.
 *
 * Un intento cancelado o ya cobrado no cambia más: seguir preguntando por él
 * en cada carga de la página es gastar una llamada a un servicio ajeno para
 * recibir siempre la misma respuesta.
 */
export function valeLaPenaPreguntar(
  estado: string | null | undefined,
): boolean {
  return estado !== "canceled" && estado !== "succeeded";
}

/**
 * Si el intento murió y al comprador hay que darle uno nuevo.
 *
 * `canceled` es definitivo. Los `requires_*` no lo son: el comprador puede
 * volver mañana y terminar de pagar con el mismo intento, que es justo lo que
 * hace `crearIntentoDePago` al reutilizarlo.
 */
export function intentoMuerto(estado: string | null | undefined): boolean {
  return estado === "canceled";
}
