/**
 * EN QUÉ PASO VA LA COMPRA, Y QUÉ SE LE DICE A QUIEN ESTÁ MIRANDO.
 *
 * ══ POR QUÉ EXISTE (18 ago 2026) ══
 *
 * El dueño pagó de verdad —$7.95 con tarjeta, Stripe lo confirma— y la
 * pantalla le siguió diciendo **«Ahora falta el pago»**. El aviso verde de
 * arriba estaba escrito fijo, sin mirar en qué estado estaba el pedido.
 *
 * Y el único sitio donde SÍ decía «Pagado» era una etiqueta gris minúscula al
 * lado del número. Quien acaba de meter su tarjeta necesita ver **grande y en
 * verde** que su plata llegó; una palabra en gris a 12 píxeles no tranquiliza
 * a nadie, y quien no se queda tranquilo llama, escribe, o peor: le pide a su
 * banco que lo devuelva.
 *
 * ══ Y LOS PASOS ══
 *
 * Antes no había forma de saber cuánto faltaba. Se pagaba y la pantalla
 * quedaba igual, así que la persona no sabía si había terminado o si le
 * faltaba algo. Ahora se dice **«Paso 2 de 3»**, y al llegar al final se ve
 * que terminó.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Es la pieza que decide qué lee alguien que acaba de pagar. Se prueba entera,
 * sin base de datos y sin navegador: un error aquí es una pantalla que miente.
 */

/**
 * Los estados de un pedido que le importan a quien compró.
 *
 * ══ `preparando` FALTABA, Y ERA EL MISMO FALLO OTRA VEZ (18 ago 2026) ══
 *
 * La lista se escribió sin él y las pantallas lo colaban con `as
 * EstadoDePedido`, así que nadie se enteró. Consecuencia: un pedido marcado
 * como «preparando» —que está PAGADO y lo está armando el comercio— caía en la
 * rama de «recién creado» y la pantalla volvía a decirle **«ahora falta el
 * pago»** a alguien que ya había pagado.
 *
 * O sea: el fallo que se arregló para `pagado` seguía vivo por otra puerta, y
 * habría vuelto a aparecer en cuanto alguien tocara ese botón en el panel.
 *
 * Ahora está la lista entera y el compilador la comprueba: si mañana se agrega
 * un estado, esto no pasa en silencio.
 */
export type EstadoDePedido =
  | "pendiente_pago"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "reembolsado";

/** Cómo se pagó. Cambia lo que hay que hacer en el paso 2. */
export type MetodoDePago = "stripe" | "zelle" | "billetera" | null;

export type Paso = {
  /** 1, 2, 3… Lo que se enseña en la bolita. */
  numero: number;
  /** La llave del texto. Los textos viven en messages/. */
  clave: "creado" | "pago" | "listo";
};

/** Los tres pasos de una compra. Siempre son estos y siempre en este orden. */
export const PASOS: readonly Paso[] = [
  { numero: 1, clave: "creado" },
  { numero: 2, clave: "pago" },
  { numero: 3, clave: "listo" },
];

/**
 * En qué paso está: 1, 2 o 3.
 *
 * - **1** no se devuelve nunca desde aquí: el pedido ya existe, así que el
 *   paso 1 siempre está cumplido. Se deja en la lista porque quien mira tiene
 *   que ver de dónde viene.
 * - **2** mientras falte el pago.
 * - **3** en cuanto el pago está confirmado, aunque todavía no se haya
 *   despachado. Para quien compró, «ya pagué» ES el final de su parte.
 */
export function pasoActual(estado: EstadoDePedido): number {
  return estado === "pendiente_pago" ? 2 : 3;
}

/**
 * ¿Está el pedido ya pagado? Lo que decide el aviso verde grande.
 *
 * `preparando` cuenta: significa que el comercio lo está armando, y a eso no
 * se llega sin haber cobrado.
 */
export function estaPagado(estado: EstadoDePedido): boolean {
  return (
    estado === "pagado" ||
    estado === "preparando" ||
    estado === "enviado" ||
    estado === "entregado"
  );
}

export type Aviso = {
  /** La llave del texto que se enseña arriba del todo. */
  clave:
    | "reciénCreado"
    | "esperandoVerificacion"
    | "pagado"
    | "cancelado"
    | "reembolsado";
  /** El color, que es lo que se lee antes que la letra. */
  tono: "verde" | "ambar" | "gris";
};

/**
 * El aviso de arriba, según dónde esté el pedido de verdad.
 *
 * ══ ZELLE Y TARJETA NO DICEN LO MISMO ══
 *
 * Con tarjeta el cobro es inmediato: o se pagó o no. Con Zelle hay un paso en
 * medio —una persona comprueba el comprobante contra el banco— y decirle a
 * quien ya subió su captura que «falta el pago» es falso: lo que falta es que
 * alguien lo mire. Son dos frases distintas porque son dos situaciones
 * distintas, y confundirlas hace que la gente pague dos veces.
 */
export function avisoDelPedido(
  estado: EstadoDePedido,
  metodo: MetodoDePago,
  hayComprobanteEsperando: boolean,
): Aviso {
  if (estado === "cancelado") return { clave: "cancelado", tono: "gris" };
  if (estado === "reembolsado") return { clave: "reembolsado", tono: "gris" };

  if (estaPagado(estado)) return { clave: "pagado", tono: "verde" };

  /* Subió su captura y espera a que un validador la compruebe. NO es «falta
     el pago»: el pago puede estar hecho y solo falta mirarlo. */
  if (metodo === "zelle" && hayComprobanteEsperando) {
    return { clave: "esperandoVerificacion", tono: "ambar" };
  }

  return { clave: "reciénCreado", tono: "verde" };
}
