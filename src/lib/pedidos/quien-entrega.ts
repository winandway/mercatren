/**
 * QUIÉN PUEDE MARCAR UNA ENTREGA.
 *
 * ══ LA REGLA, Y POR QUÉ (14 ago 2026) ══
 *
 * **Solo el comercio que vendió.** Es quien tiene la mercancía en la mano y
 * quien se la da al comprador; nadie más sabe si salió del mostrador.
 *
 * Lo pidió el dueño y la razón es concreta: si el equipo de Mercatren pulsa
 * «entregado» por error, el comprador llama al comercio reclamándole una
 * entrega que nunca ocurrió. El sistema habría metido a dos personas en una
 * discusión por algo que no hizo ninguna de las dos.
 *
 * ══ SE MIRA EL ROL **REAL**, NO EL PRESTADO ══
 *
 * Soporte puede entrar con «Ver su panel» y navegar con el alcance de un
 * comercio. Ese modo es **solo para mirar** —la misma regla que ya impide pedir
 * un retiro desde ahí—, así que si esta decisión mirara el alcance prestado, el
 * botón reaparecería justo para quien no debe tocarlo. Por eso se pregunta por
 * el rol de la sesión.
 *
 * ══ LO QUE ESTO NO RESUELVE, Y SE SABE ══
 *
 * Si un comercio no puede entrar a su panel, hoy nadie puede cerrarle esa
 * entrega. Se deja así a propósito: es preferible un pedido que se queda en
 * «pagado» a un pedido que dice «entregado» sin que nadie haya entregado nada.
 * El día que haga falta, se agrega para el equipo con su nombre delante —
 * «marcado por Soporte en nombre del comercio»— y no en silencio.
 */

/** Los roles del equipo de Mercatren. Ninguno entrega mercancía. */
const ROLES_INTERNOS = ["soporte", "validador"];

export function puedeMarcarEntrega(
  rolReal: string | null | undefined,
): boolean {
  if (!rolReal) return false;
  return rolReal === "vendedor";
}

/**
 * Por qué no se le enseña el botón. Es para el comentario del código y para
 * poder explicarlo en pantalla el día que se quiera, no para decidir nada.
 */
export function motivoSinBotonDeEntrega(
  rolReal: string | null | undefined,
): "no_entrega_mercancia" | "sin_sesion" | null {
  if (puedeMarcarEntrega(rolReal)) return null;
  if (!rolReal) return "sin_sesion";
  if (ROLES_INTERNOS.includes(rolReal)) return "no_entrega_mercancia";
  return "sin_sesion";
}
