/**
 * CÓMO SE PAGÓ UN COBRO POR ENLACE — la parte pura.
 *
 * ══ POR QUÉ HAY QUE DEDUCIRLO ══
 *
 * `cobros_solicitados` no guarda el método: guarda `pago_id`. Y está bien que
 * sea así —el método es un hecho del pago, no del cobro— pero para enseñarle a
 * alguien «esta factura ya se pagó» hace falta decirle **cómo**, o el aviso no
 * responde la pregunta que trae quien lo abre.
 *
 * ══ CÓMO SE DISTINGUE ══
 *
 *  - Con tarjeta, Stripe deja su identificador: empieza por `pi_` (el intento
 *    de pago) o por `ch_` (el cargo).
 *  - Por Zelle, lo que hay es una fila en `cobros_zelle` — ahí no hay ningún
 *    identificador de Stripe porque Stripe no interviene.
 *
 * Se mira el prefijo y no «si hay pagoId, es tarjeta»: el día que entre otro
 * procesador, esa suposición se rompe en silencio y el aviso empezaría a decir
 * «tarjeta» de cobros que no lo son.
 */

export type ComoSePago = "tarjeta" | "zelle" | "desconocido";

export function comoSePago(datos: {
  pagoId: string | null | undefined;
  tieneZelle: boolean;
}): ComoSePago {
  /* Zelle primero: si hay captura validada, eso es lo que ocurrió, aunque
     quedara un intento de tarjeta abierto de cuando la persona lo dudó. */
  if (datos.tieneZelle) return "zelle";

  const id = (datos.pagoId ?? "").trim().toLowerCase();
  if (id.startsWith("pi_") || id.startsWith("ch_")) return "tarjeta";

  /**
   * NI SE ADIVINA NI SE DEJA EN BLANCO.
   *
   * Un cobro pagado del que no se puede saber el método sigue estando pagado,
   * y eso es lo que importa decir. Inventar «tarjeta» porque es lo más común
   * sería poner en una pantalla un dato que nadie comprobó — y esa pantalla la
   * mira alguien que está conciliando su banco.
   */
  return "desconocido";
}
