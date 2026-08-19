/**
 * QUÉ NOMBRE SE ENSEÑA EN LA PÁGINA DE PAGO.
 *
 * ══ POR QUÉ EXISTE (19 ago 2026) ══
 *
 * Hay cobros donde **quien paga no conoce al comercio, y no debe conocerlo**.
 *
 * El caso real: Ferremateriales Bley le fía a la Ferretería B, y quien pone el
 * dinero es un cliente de la Ferretería B. Ese cliente le compró a B, no a
 * Bley. Nombrar a Bley en su pantalla de pago sería enseñarle un negocio con el
 * que él no tiene nada que ver.
 *
 * Y nombrar a la **Ferretería B** tampoco: le estaría contando a su propio
 * cliente **a quién le compra y cuánto le debe**. Eso es información comercial
 * de B, y no es nuestra para repartirla.
 *
 * ══ ENTONCES, ¿QUIÉN APARECE? MERCATREN, Y YA ══
 *
 * Y no es un truco: **Mercatren es quien cobra y quien factura.** Es lo mismo
 * que ve alguien que paga en Amazon o en Mercado Libre — la plataforma, no el
 * vendedor de atrás. El cargo le aparecerá en el banco como Mercatren, la
 * factura se la emite Mercatren, y la conciliación se hace contra Mercatren.
 * Que la pantalla diga otra cosa es lo que provoca contracargos.
 *
 * ══ EL DEFECTO ES NOMBRAR AL COMERCIO, A PROPÓSITO ══
 *
 * En el cobro normal —el cliente de la ferretería pagando su propia factura—
 * ver el nombre de su ferretería es lo que le da confianza para pagar.
 * **Quitarlo por defecto haría que dejaran de pagar los cobros que hoy sí
 * funcionan.** El modo callado se pide expresamente, cobro por cobro.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Decide qué información sale a una pantalla que ve alguien de fuera. Un error
 * aquí no rompe nada visible: filtra un dato comercial de un tercero, y de eso
 * nadie se entera hasta que se queja el que lo sufrió.
 */

/** Cómo se presenta un cobro a quien lo va a pagar. */
export type ModoDeCobro =
  /** El de siempre: se ve el nombre del comercio. */
  | "comercio"
  /** Solo Mercatren. Para cadenas donde el pagador no conoce al comercio. */
  | "solo_mercatren";

export type QueSeEnsena = {
  /**
   * El nombre que va arriba del todo, o `null` para no nombrar a nadie.
   *
   * `null` NO es «falta el dato»: es «a propósito no se nombra». La pantalla
   * tiene que saber distinguirlo, o va a enseñar un hueco donde no debe haber
   * nada.
   */
  comercio: string | null;
  /** Si el pie dice «tu compra es en …». */
  nombrarEnElPie: boolean;
  /**
   * Si se enseña la referencia y el concepto.
   *
   * **Siempre sí, en los dos modos.** Cuando no se nombra al comercio, esto es
   * lo ÚNICO que le dice al pagador qué está pagando. Sin ello quedaría una
   * pantalla que pide dinero sin decir por qué — que es exactamente como se ve
   * una estafa.
   */
  mostrarReferencia: true;
};

/**
 * Qué se le enseña a quien va a pagar.
 *
 * `modo` puede venir vacío —un cobro de antes de que esto existiera, o uno
 * creado sin pedir nada— y entonces se comporta como siempre.
 */
export function queSeEnsena(
  modo: ModoDeCobro | null | undefined,
  nombreDelComercio: string,
): QueSeEnsena {
  if (modo === "solo_mercatren") {
    return { comercio: null, nombrarEnElPie: false, mostrarReferencia: true };
  }

  return {
    comercio: nombreDelComercio,
    nombrarEnElPie: true,
    mostrarReferencia: true,
  };
}

/** ¿Es un modo que conocemos? Lo que llegue de fuera se comprueba. */
export function esModoDeCobro(valor: unknown): valor is ModoDeCobro {
  return valor === "comercio" || valor === "solo_mercatren";
}

/**
 * El modo que pide el sistema de un comercio, traducido.
 *
 * ══ LO QUE NO SE ENTIENDE CAE EN EL MODO NORMAL ══
 *
 * Un sistema de comercio puede mandar cualquier cosa en ese campo. Si un dato
 * mal escrito activara el modo callado, un cobro corriente perdería el nombre
 * de su ferretería y el cliente dejaría de pagarlo sin que nadie supiera por
 * qué. Al revés no pasa nada: se nombra al comercio, que es lo de siempre.
 */
export function modoPedido(valor: unknown): ModoDeCobro {
  return valor === "solo_mercatren" ? "solo_mercatren" : "comercio";
}
