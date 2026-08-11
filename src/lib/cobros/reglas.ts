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
  /** El comercio lo canceló desde su sistema. */
  | "cancelado";

/**
 * CUÁNTO DURA UN ENLACE SIN USAR: 48 horas.
 *
 * Lo sugirió el documento del modelo y tiene sentido: un enlace de cobro que
 * no caduca nunca es una factura viva para siempre, y el precio de la
 * mercancía cambia. 48 horas alcanza de sobra para que alguien en otro huso
 * horario lo vea, lo pague, o lo reenvíe a quien va a pagar.
 *
 * Vencer no pierde la venta: el comercio pide otro y sale otro correo.
 */
export const HORAS_DE_VIDA = 48;

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
 * Cuándo vence un cobro pedido ahora.
 *
 * Se recibe `ahora` de fuera para que la función sea previsible al probarla:
 * una que lee el reloj por dentro solo se puede probar con trampas.
 */
export function venceEn(ahora: Date): Date {
  return new Date(ahora.getTime() + HORAS_DE_VIDA * 3_600_000);
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
