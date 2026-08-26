/**
 * COBRAR POR MERCATREN SIN SALIR DEL SISTEMA DEL COMERCIO.
 *
 * ══ QUÉ RESUELVE ══
 *
 * El cliente de una ferretería en Venezuela quiere comprar y no consigue
 * efectivo ni divisas. Tiene un hijo o un socio en Estados Unidos que sí puede
 * pagarle, pero esa persona tiene que averiguar a quién mandar el dinero, por
 * dónde y cuánto cobra el que lo manda. Entre una cosa y otra se pierden días,
 * y a veces se pierde la venta.
 *
 * Con esto, la cajera hace la factura como todos los días, toca un botón, y
 * **el correo con el enlace de pago sale solo** en ese mismo momento. Quien
 * paga abre y paga con tarjeta o por Zelle, desde donde esté.
 *
 * ══ POR QUÉ ESTE ARCHIVO ES PURO ══
 *
 * Aquí se decide qué monto se acepta, cuánto dura un enlace y cuándo se puede
 * pagar. Son reglas de dinero: se prueban aquí, no en una pantalla ni dentro de
 * una consulta.
 */

/** En qué punto está un cobro pedido desde el sistema de un comercio. */
export type EstadoCobro =
  /** El enlace se mandó y nadie ha pagado todavía. */
  | "abierto"
  /** Ya se pagó. El comercio puede entregar. */
  | "pagado"
  /** Nadie pagó a tiempo. Se puede volver a pedir uno nuevo. */
  | "vencido"
  /**
   * Se pagó y se le devolvió el dinero a quien pagó. Cerrado: un cobro
   * devuelto no se vuelve a cobrar por el mismo enlace — si hay que cobrar
   * otra vez, se crea otro. Solo llega aquí lo pagado con tarjeta.
   */
  | "devuelto"
  /** El comercio lo canceló desde su sistema. */
  | "cancelado";

/**
 * CUÁNTO DURA UN ENLACE SIN USAR.
 *
 * ══ ERAN 48 HORAS Y ESTABA MAL (19 ago 2026) ══
 *
 * Lo puse yo suponiendo que «alcanza de sobra para que alguien lo vea, lo
 * pague, o lo reenvíe». **Esa suposición no describe el negocio real.**
 *
 * Lo reportó el comercio piloto con el caso medido: en un abono de una
 * ferretería del interior de Venezuela **la cadena es de tres personas** — el
 * cliente llama a la ferretería y dice cuánto va a abonar, la ferretería
 * llama al vendedor y le pide el enlace, y recién ahí quien paga tiene que
 * conseguir la tarjeta o hablar con el familiar en Estados Unidos que se lo va
 * a pagar. **Sus clientes tardan hasta una semana en cerrar un pago**, y eso
 * no es un cliente lento: es cómo funciona cobrar con dinero que viene de
 * afuera.
 *
 * Y mi consuelo de «vencer no pierde la venta, el comercio pide otro» tampoco
 * era cierto: cada vencimiento obliga a escribirle otra vez al cliente, y cada
 * vez que hay que volver a escribirle **se pierden cobros**.
 *
 * ══ AHORA: SIETE DÍAS POR DEFECTO, HASTA QUINCE SI LO PIDEN ══
 *
 * Sigue habiendo tope, y el motivo original sigue en pie: un enlace que no
 * caduca nunca es una factura viva para siempre, y el precio de la mercancía
 * cambia. Pero el plazo lo decide quien conoce a su cliente, no yo.
 */
export const DIAS_DE_VIDA_POR_DEFECTO = 7;

/**
 * El techo, y no es un capricho.
 *
 * Un enlace con monto fijo que vive un mes acaba circulando por WhatsApp
 * mucho después de que el abono se saldó por otra vía. Quince días cubre el
 * caso más lento que reportó el comercio con margen de sobra.
 */
export const DIAS_DE_VIDA_MAXIMO = 15;

/** Menos de un día no da tiempo ni a leer el correo. */
export const DIAS_DE_VIDA_MINIMO = 1;

/**
 * EL MÍNIMO Y EL MÁXIMO.
 *
 * El mínimo existe porque por debajo de un dólar el costo del procesador se
 * come el cobro entero: en $0.50, Stripe se lleva $0.31. Cobrar eso es
 * trabajar gratis y encima quedar mal.
 *
 * El máximo es un freno de emergencia contra el dedo pegado en el teclado. Un
 * cobro de cien mil dólares por un error de tecleo llega al correo de un
 * cliente y ahí ya no se puede deshacer la impresión que deja.
 */
export const MINIMO_CENTAVOS = 100;
export const MAXIMO_CENTAVOS = 5_000_000;

export type FalloDeCobro =
  | "montoInvalido"
  | "montoMuyBajo"
  | "montoMuyAlto"
  | "sinReferencia"
  | "sinContacto"
  | "contactoInvalido";

/** Lo que el sistema del comercio manda para pedir un cobro. */
export type PeticionDeCobro = {
  montoCentavos: number;
  /** El número de factura del comercio. Es su lado del rastro. */
  referencia: string;
  /** A quién se le cobra. */
  correo: string;
  nombre?: string;
  /**
   * Qué métodos acepta este cobro. **Vacío o ausente significa TODOS**, que
   * es como se comportan los cobros creados antes de que esto existiera.
   */
  metodos?: string[];
};

/**
 * Comprueba lo que llega del sistema del comercio.
 *
 * Devuelve la lista de fallos, vacía si está todo bien. **Se devuelven CLAVES,
 * no frases**: quien llama traduce, y el sistema del comercio puede estar en
 * otro idioma que el nuestro.
 */
export function revisarPeticion(p: Partial<PeticionDeCobro>): FalloDeCobro[] {
  const fallos: FalloDeCobro[] = [];

  const monto = Number(p.montoCentavos);
  if (!Number.isInteger(monto) || monto <= 0) {
    fallos.push("montoInvalido");
  } else {
    if (monto < MINIMO_CENTAVOS) fallos.push("montoMuyBajo");
    if (monto > MAXIMO_CENTAVOS) fallos.push("montoMuyAlto");
  }

  /* La referencia de su factura es obligatoria: sin ella, cuando el cliente
     llame preguntando por su pago, nadie sabe de qué venta habla. */
  if (!p.referencia?.trim()) fallos.push("sinReferencia");

  const correo = p.correo?.trim() ?? "";
  if (!correo) {
    fallos.push("sinContacto");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    fallos.push("contactoInvalido");
  }

  return fallos;
}

/**
 * Cuántos días vale el enlace, a partir de lo que pida el comercio.
 *
 * ══ UN DATO RARO NO PUEDE DEJAR UN COBRO SIN VENCIMIENTO ══
 *
 * Lo que llega de fuera puede ser cualquier cosa: texto, un número enorme, un
 * negativo. Todo lo que no se entienda cae en el valor por defecto, y lo que
 * se pase del techo se recorta **en silencio hasta el techo** en vez de
 * rechazar el cobro entero: quien pide 30 días quiere que dure mucho, no que
 * su venta se caiga por un número.
 */
export function diasDeVida(pedido: unknown): number {
  const n = Number(pedido);
  if (!Number.isFinite(n) || n <= 0) return DIAS_DE_VIDA_POR_DEFECTO;

  return Math.min(
    DIAS_DE_VIDA_MAXIMO,
    Math.max(DIAS_DE_VIDA_MINIMO, Math.floor(n)),
  );
}

/**
 * Cuándo vence un cobro pedido ahora.
 *
 * Se recibe `ahora` de fuera para que la función sea previsible al probarla:
 * una que lee el reloj por dentro solo se puede probar con trampas.
 */
export function venceEn(ahora: Date, dias?: unknown): Date {
  return new Date(ahora.getTime() + diasDeVida(dias) * 86_400_000);
}

/**
 * El estado de cara a quien abre el enlace.
 *
 * ══ EL VENCIMIENTO SE CALCULA, NO SE GUARDA ══
 *
 * Un estado `vencido` guardado depende de que algo lo escriba a tiempo. Si ese
 * algo falla —un proceso que no corrió, un despliegue a medias—, un enlace
 * caducado sigue diciendo que se puede pagar, y alguien paga una venta que el
 * comercio ya dio por perdida. Mirando la fecha no hay forma de equivocarse.
 */
export function estadoParaMostrar(
  guardado: EstadoCobro,
  venceEn: Date | null,
  ahora: Date,
): EstadoCobro {
  // Lo que ya se resolvió no cambia por el paso del tiempo.
  if (guardado !== "abierto") return guardado;
  if (venceEn && venceEn.getTime() <= ahora.getTime()) return "vencido";
  return "abierto";
}

/** Si todavía se puede pagar. Es lo que decide si se enseña el botón. */
export function sePuedePagar(
  guardado: EstadoCobro,
  vence: Date | null,
  ahora: Date,
): boolean {
  return estadoParaMostrar(guardado, vence, ahora) === "abierto";
}

/**
 * El enlace que se manda por correo.
 *
 * ══ POR QUÉ NO LLEVA EL IDENTIFICADOR DEL COBRO ══
 *
 * Porque ese identificador aparece en el sistema del comercio, en sus
 * registros y en sus pantallas. Si el enlace fuera el mismo número, cualquiera
 * que lo viera podría abrir el cobro de otro. El enlace es un secreto aparte,
 * de 32 bytes al azar, y solo viaja en ese correo.
 */
export function generarEnlace(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
