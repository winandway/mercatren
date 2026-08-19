/**
 * DEVOLUCIONES: QUIÉN PUEDE, HASTA CUÁNDO, Y CUÁNDO SE ENSEÑA LA DIRECCIÓN.
 *
 * ══ LA REGLA QUE MANDA SOBRE TODO ESTO (18 ago 2026) ══
 *
 * **La dirección de devolución NO se publica en ninguna parte.** Se le enseña
 * a una persona concreta, con un pedido concreto, después de que pida la
 * devolución y suba sus fotos. Antes de eso no existe: ni en la política, ni en
 * el correo, ni en el HTML de una página que alguien pueda guardar.
 *
 * Lo pidió el dueño y el motivo es práctico: **esa dirección puede cambiar
 * dentro de un año, o antes.** Una dirección publicada se copia, se guarda, se
 * reenvía y se queda circulando; el día que cambie, van a seguir llegando cajas
 * a un sitio donde ya no hay nadie que las reciba. Una dirección que se entrega
 * en el momento siempre es la de hoy.
 *
 * De paso evita que llegue mercancía que nadie pidió devolver: un paquete sin
 * trámite abierto es un paquete que no se sabe de quién es ni qué se le
 * reembolsa.
 *
 * ══ POR QUÉ EL PROVEEDOR NO ENTRA EN ESTA HISTORIA ══
 *
 * CJ solo acepta devoluciones **en su almacén de China**, incluso lo que sale
 * de los suyos de Estados Unidos, y lo desaconsejan ellos mismos: tres meses de
 * tránsito y «la mayoría de los productos devueltos se pierden o llegan
 * dañados».
 *
 * Y sobre todo: **el que le vendió al comprador es Mercatren LLC**, que compra
 * a nombre propio y revende. Poner la dirección de CJ sería declarar como
 * vendedor a alguien que no lo es — y desde abril de 2026 Google cruza la
 * dirección de devolución contra la identidad declarada del comercio. Un
 * comercio de Michigan que devuelve a China es justo el patrón que suspenden.
 *
 * La mercancía vuelve a Mercatren LLC y Mercatren asume lo que valga. Es el
 * costo de vender, no un accidente.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Decide si alguien tiene derecho a que le devuelvan su dinero. Un error aquí
 * es un cliente al que se le niega algo que le corresponde —o al revés— y las
 * dos cosas cuestan caro. Se prueba entera, sin base y sin navegador.
 */

/** Los días que tiene el comprador desde que RECIBE, no desde que compra. */
export const DIAS_PARA_DEVOLVER = 30;

/** En qué va una devolución. */
export type EstadoDevolucion =
  "solicitada" | "en_camino" | "recibida" | "reembolsada" | "rechazada";

/**
 * Los estados de un pedido, tal como los guarda la base.
 *
 * `preparando` está entre `pagado` y `enviado`: el comercio lo está armando.
 * Se escribe entero y no se abrevia porque **el compilador comprueba que
 * estén todos**; con una lista a medias, el día que alguien agregue un estado
 * esto pasaría en silencio y el pedido caería en la rama equivocada.
 */
export type EstadoPedido =
  | "pendiente_pago"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "reembolsado";

export type Veredicto =
  { puede: true; venceEl: Date } | { puede: false; motivo: MotivoNo };

export type MotivoNo =
  "sinPagar" | "sinEntregar" | "fueraDePlazo" | "yaSolicitada" | "cancelado";

/**
 * ¿Puede este pedido devolverse hoy?
 *
 * ══ EL PLAZO CUENTA DESDE LA ENTREGA ══
 *
 * Google rechaza las políticas que cuentan desde la compra, y con razón: entre
 * comprar y recibir pueden pasar quince días, y contar desde el pedido le come
 * al comprador la mitad de su plazo por algo de lo que no es responsable.
 *
 * ══ Y SI NO SE SABE CUÁNDO LLEGÓ, EL PLAZO NO CORRE ══
 *
 * Un pedido sin fecha de entrega es un dato que nos falta a NOSOTROS. Cerrarle
 * la puerta a alguien por un hueco de nuestros registros es cobrarle nuestro
 * descuido. Mientras no conste la entrega, se puede pedir.
 */
export function puedeDevolver({
  estado,
  entregadoEn,
  yaHayDevolucion,
  hoy,
}: {
  estado: EstadoPedido;
  entregadoEn: Date | null;
  /** Ya hay un trámite abierto. Dos por el mismo pedido no se pueden atender. */
  yaHayDevolucion: boolean;
  hoy: Date;
}): Veredicto {
  if (estado === "cancelado" || estado === "reembolsado") {
    return { puede: false, motivo: "cancelado" };
  }

  if (estado === "pendiente_pago") {
    return { puede: false, motivo: "sinPagar" };
  }

  if (yaHayDevolucion) {
    return { puede: false, motivo: "yaSolicitada" };
  }

  /**
   * Pagado o armándose: todavía no ha salido nada, así que no hay nada que
   * devolver. Lo que toca ahí es cancelar, que es otra cosa y otra pantalla.
   *
   * ══ `enviado` SÍ PUEDE, Y ES IMPORTANTE ══
   *
   * Un paquete que salió y no aparece es **justo** el reclamo de «no me llegó».
   * Cerrarle la puerta a esa persona no evita nada: la manda a pedirle a su
   * banco que le devuelva el cargo, que nos cuesta el dinero, la comisión de la
   * disputa y el historial con el procesador. Como no consta la entrega, el
   * plazo tampoco ha empezado a correr.
   */
  if (estado === "pagado" || estado === "preparando") {
    return { puede: false, motivo: "sinEntregar" };
  }

  /* Sin fecha de entrega el plazo no ha empezado: el hueco es nuestro. */
  if (!entregadoEn) {
    return { puede: true, venceEl: sumarDias(hoy, DIAS_PARA_DEVOLVER) };
  }

  const venceEl = sumarDias(entregadoEn, DIAS_PARA_DEVOLVER);

  return hoy.getTime() <= venceEl.getTime()
    ? { puede: true, venceEl }
    : { puede: false, motivo: "fueraDePlazo" };
}

function sumarDias(desde: Date, dias: number): Date {
  const d = new Date(desde.getTime());
  d.setDate(d.getDate() + dias);
  return d;
}

/**
 * ¿SE LE PUEDE ENSEÑAR YA LA DIRECCIÓN?
 *
 * Solo con el trámite abierto. Es la regla entera de este módulo y por eso
 * vive en su propia función, con su prueba: enterrada dentro de un componente
 * se saltaría el día que alguien copie esa pantalla.
 *
 * `rechazada` NO la ve: mandar la caja después de un rechazo es perderla, y
 * encima creyendo que el dinero vuelve.
 */
export function puedeVerLaDireccion(estado: EstadoDevolucion | null): boolean {
  if (!estado) return false;
  return (
    estado === "solicitada" || estado === "en_camino" || estado === "recibida"
  );
}

/**
 * ¿Está la devolución cerrada?
 *
 * Sirve para saber si el pedido admite otro trámite. Una devolución rechazada
 * o ya reembolsada no bloquea un reclamo nuevo por otra cosa.
 */
export function estaCerrada(estado: EstadoDevolucion): boolean {
  return estado === "reembolsada" || estado === "rechazada";
}

/** Cuántos días le quedan. Nunca negativo: fuera de plazo es cero. */
export function diasQueQuedan(venceEl: Date, hoy: Date): number {
  const ms = venceEl.getTime() - hoy.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** Los motivos que puede elegir quien devuelve. */
export const MOTIVOS = [
  "noEsLoQuePedi",
  "llegoDanado",
  "noFunciona",
  "noLlego",
  "yaNoLoQuiero",
] as const;

export type Motivo = (typeof MOTIVOS)[number];

export function esMotivoValido(valor: string): valor is Motivo {
  return (MOTIVOS as readonly string[]).includes(valor);
}

/**
 * ¿Hacen falta fotos para este motivo?
 *
 * ══ NO SE PIDEN SIEMPRE, Y ES A PROPÓSITO ══
 *
 * De un producto **que no llegó** no hay foto que sacar, y de uno que
 * simplemente ya no se quiere tampoco hay nada que fotografiar. Exigirlas en
 * esos casos es poner una pared donde no hay nada que comprobar: la persona se
 * queda mirando un formulario que no puede completar y termina llamando al
 * banco, que es el camino al contracargo.
 *
 * Donde SÍ hacen falta es cuando lo que se afirma es el estado de la mercancía
 * —rota, distinta, no funciona—, porque eso es exactamente lo que hay que ver
 * antes de devolver el dinero.
 */
export function exigeFotos(motivo: Motivo): boolean {
  return (
    motivo === "llegoDanado" ||
    motivo === "noEsLoQuePedi" ||
    motivo === "noFunciona"
  );
}

/** Cuántas fotos se admiten. Más de esto no aporta y llena el bucket. */
export const MAXIMO_FOTOS = 4;
