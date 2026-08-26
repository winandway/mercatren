/**
 * PAGAR UN COBRO POR TRANSFERENCIA ACH DIRECTA (26 ago 2026).
 *
 * Lo pidió el dueño: _«hay que agregar la opción de que haga una
 * transferencia ACH a nuestra cuenta»_. Y tiene razón en el motivo — una
 * factura de siete mil dólares con tarjeta deja **más de $200 en comisiones
 * del procesador**; por ACH directo a la cuenta de Mercatren LLC, cero.
 *
 * ══ LO QUE HAY QUE ENTENDER DE ESTE MÉTODO ══
 *
 * Una transferencia ACH a nuestro banco **no pasa por Stripe**, así que el
 * sistema NO se entera solo de que llegó. Es exactamente el mismo camino que
 * Zelle: quien paga sube el comprobante, una persona lo compara contra el
 * banco y al aprobarlo se acredita. Por eso reusa la misma cola de validación
 * y el mismo número de conciliación — no se duplica nada.
 *
 * ══ POR QUÉ TIENE UN MÍNIMO ══
 *
 * Validar a mano cuesta lo mismo por $20 que por $7.000. Por debajo del
 * mínimo, ese trabajo se come el margen entero: ahí la tarjeta es el método
 * correcto aunque cobre comisión. Es la misma decisión que ya se tomó con
 * Zelle, y por eso comparten el número.
 */

export type DatosDeTransferencia = {
  beneficiario: string;
  banco: string;
  cuenta: string;
  rutaAch: string;
};

export type DecisionTransferencia =
  | { disponible: true; datos: DatosDeTransferencia }
  | { disponible: false; motivo: "sin_datos" | "monto_bajo" };

/**
 * ¿Se le ofrece la transferencia a quien va a pagar este cobro?
 *
 * Puro a propósito: decide con lo que se le pasa, y las variables de entorno
 * las lee quien lo llama. Así se puede probar sin montar medio sistema.
 */
export function decidirTransferencia(
  datos: Partial<DatosDeTransferencia>,
  montoCentavos: number,
  minimoCentavos: number,
): DecisionTransferencia {
  const beneficiario = datos.beneficiario?.trim();
  const banco = datos.banco?.trim();
  const cuenta = datos.cuenta?.trim();
  const rutaAch = datos.rutaAch?.trim();

  /* Las CUATRO cosas o ninguna. Enseñar una cuenta sin su número de ruta —o
     al revés— es mandar a alguien al banco con media instrucción, y ese
     dinero se va a otra parte o se queda sin salir. */
  if (!beneficiario || !banco || !cuenta || !rutaAch) {
    return { disponible: false, motivo: "sin_datos" };
  }
  if (montoCentavos < minimoCentavos) {
    return { disponible: false, motivo: "monto_bajo" };
  }
  return {
    disponible: true,
    datos: { beneficiario, banco, cuenta, rutaAch },
  };
}

/**
 * EL NÚMERO DE RUTA DE ACH NO ES EL DE WIRE, Y CONFUNDIRLOS CUESTA DÍAS.
 *
 * Chase da uno para depósitos directos y ACH y **otro distinto** para wire
 * (está documentado en el CLAUDE.md del proyecto desde el 19 ago). Quien
 * recibe por ACH necesita el de ACH; con el de wire, la transferencia rebota.
 *
 * Aquí solo se ofrece ACH —que es lo que pidió el dueño y lo que usa alguien
 * pagando desde su banco en Estados Unidos— y por eso se lee de
 * `PAGO_RUTA_ACH` y nunca de `PAGO_RUTA_WIRE`.
 */
export const VARIABLE_DE_RUTA = "PAGO_RUTA_ACH" as const;
