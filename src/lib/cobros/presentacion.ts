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

/* El buzón que contesta cuando el comercio no tiene uno cargado, o cuando
   pidió no aparecer. Se IMPORTA y no se copia: hay un candado
   (`correo-contacto.test.ts`) que prohíbe escribir una dirección a mano
   fuera de donde se declaran, justamente para que no haya dos verdades. */
import { CORREO_EQUIPO } from "@/lib/correo/direcciones";

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
  /**
   * A QUIÉN LE ESCRIBE QUIEN PAGA SI ALGO NO CUADRA (22 sep 2026).
   *
   * ══ LO QUE PASÓ ══
   *
   * El dueño abrió su propio enlace de cobro de $6.483,77 y no encontró
   * ningún correo: «se perdió el seller de la empresa, no lo encuentro…
   * no aparece el correo de Seller». Tenía razón. La página enseñaba el
   * nombre del comercio arriba y abajo, y **ni una forma de contactar a
   * nadie**. Quien duda de una página que le pide seis mil dólares y no
   * tiene a quién escribirle, no paga: cierra.
   *
   * ══ Y EN EL MODO CALLADO, MERCATREN ══
   *
   * Cuando el comercio pidió no aparecer, tampoco aparece su correo —sería
   * la misma filtración por otra puerta—: se enseña el de Mercatren, que es
   * quien cobra y quien factura.
   */
  contacto: {
    /** El nombre de quien atiende, o `null` para no nombrar a nadie. */
    nombre: string | null;
    /** Un correo que existe y recibe de verdad. Nunca inventado. */
    correo: string;
  };
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
  correoDelComercio?: string | null,
): QueSeEnsena {
  if (modo === "solo_mercatren") {
    return {
      comercio: null,
      nombrarEnElPie: false,
      mostrarReferencia: true,
      /* Ni el nombre ni el correo del comercio: en este modo quien paga no
         tiene que saber que existe. Contesta Mercatren, que es quien cobra. */
      contacto: { nombre: null, correo: CORREO_EQUIPO },
    };
  }

  const suyo = (correoDelComercio ?? "").trim();

  return {
    comercio: nombreDelComercio,
    nombrarEnElPie: true,
    mostrarReferencia: true,
    contacto: {
      nombre: nombreDelComercio,
      /* SIN CORREO DEL COMERCIO CONTESTA MERCATREN, nunca un hueco. Un
         comercio puede empezar a vender con el nombre y completar su ficha
         después; dejar la pantalla sin a quién escribir por un campo vacío
         es perder el pago. */
      correo: suyo || CORREO_EQUIPO,
    },
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
