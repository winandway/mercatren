/**
 * CANCELAR UN COBRO YA CREADO.
 *
 * ══ POR QUÉ HACE FALTA (20 ago 2026) ══
 *
 * Lo pidió el comercio piloto con un caso real: el cobro `VIG-02497-A1` salió
 * hacia `hernandezbleider@gmai.com` — le falta la «l» de gmail. Ese correo no
 * existe, así que el enlace nació muerto… **y sigue vivo y cobrable hasta que
 * venza**. Nadie podía apagarlo.
 *
 * Los otros dos motivos pasan igual de seguido: el cliente pagó en efectivo o
 * por Zelle mientras el enlace andaba por ahí —y si después alguien lo abre y
 * lo paga, pagó dos veces— o se equivocaron de monto, de cliente o de factura.
 *
 * ══ NO SE INVENTA UN ESTADO NUEVO ══
 *
 * El comercio pidió el estado `anulado`. Aquí se usa **`cancelado`**, que ya
 * existía en `ESTADOS_COBRO` desde antes y que la página de pago ya sabía
 * dibujar. Dos palabras para lo mismo es como empiezan los fallos que nadie
 * encuentra: un día alguien compara contra la que no es y el cobro sigue
 * cobrable. **Se les avisa expresamente**, porque de su lado es una línea.
 *
 * Puro a propósito: decide sobre valores, sin tocar la base.
 */

/** Lo más largo que se acepta como motivo. */
export const MOTIVO_MAXIMO = 200;

export type EstadoDeCobro =
  "abierto" | "pagado" | "vencido" | "cancelado" | "devuelto";

export type DecisionAnular =
  | { sePuede: true }
  /* Ya estaba cancelado: NO es un error. Si a alguien se le va el doble clic,
     el segundo intento no puede parecer un fallo — quedaría dudando de si de
     verdad se canceló. */
  | { sePuede: false; yaEstaba: true }
  | { sePuede: false; yaEstaba: false; motivo: "pagado" | "devuelto" };

/**
 * ¿Se puede cancelar este cobro?
 *
 * ══ UN COBRO PAGADO NO SE CANCELA, Y NO ES UN DETALLE ══
 *
 * Cancelarlo taparía dinero que YA entró: el comercio dejaría de verlo en su
 * cola, la conciliación bancaria no cuadraría, y el cliente se quedaría sin
 * comprobante de algo que sí pagó. Si hay que devolverle el dinero, eso es una
 * devolución —que tiene su propio camino— y no una cancelación.
 */
export function sePuedeAnular(estado: EstadoDeCobro): DecisionAnular {
  if (estado === "cancelado") return { sePuede: false, yaEstaba: true };
  if (estado === "pagado") {
    return { sePuede: false, yaEstaba: false, motivo: "pagado" };
  }
  /* Uno devuelto ya está cerrado por su propio camino: el dinero entró y
     volvió a salir. Cancelarlo encima borraría el rastro de las dos cosas. */
  if (estado === "devuelto") {
    return { sePuede: false, yaEstaba: false, motivo: "devuelto" };
  }
  /* `abierto` y `vencido` se cancelan los dos. Uno vencido se puede
     reactivar, así que cancelarlo es lo que impide que reviva por esa puerta. */
  return { sePuede: true };
}

/**
 * El motivo, recortado y limpio.
 *
 * ══ EL MOTIVO NO SE LE ENSEÑA NUNCA A QUIEN IBA A PAGAR ══
 *
 * Es para el panel del comercio y para la bitácora. Un motivo escrito a la
 * ligera puede nombrar al comercio —«lo canceló Bley porque…»— y en el modo
 * sin nombre eso es justo lo que no puede salir. Que quede guardado, sí; que
 * salga en la página de pago, jamás.
 *
 * Se recorta en vez de rechazar: rechazar la cancelación entera porque el
 * motivo venía largo dejaría el enlace vivo, que es lo único que de verdad
 * importa apagar.
 */
export function motivoLimpio(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  if (!limpio) return null;
  return limpio.slice(0, MOTIVO_MAXIMO);
}
