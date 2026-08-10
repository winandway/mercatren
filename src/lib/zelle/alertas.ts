/**
 * LAS SEÑALES DE UN COMPROBANTE QUE HAY QUE MIRAR DOS VECES.
 *
 * ══ POR QUÉ EXISTE ESTE ARCHIVO ══
 *
 * Zelle es una forma de pago peligrosa para una tienda: el comprador manda una
 * CAPTURA, no un cobro. Una captura se edita, se reenvía y se vuelve a subir.
 * Casi ninguna tienda en línea lo acepta; aquí se acepta porque es lo que usan
 * los venezolanos, y por eso el control tiene que ser nuestro.
 *
 * Hasta hoy el validador aprobaba a ojo: la pantalla no le decía ni una sola
 * cosa. Y ya se había colado — en el histórico está el código `kfrcrk9wp` usado
 * dos veces por $100, uno aprobado y otro rechazado. Lo atajó una persona con
 * buena memoria, no el sistema.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Decidir qué es sospechoso es una regla de negocio, no una consulta. Aquí se
 * decide y se prueba; quien llama trae los hechos de la base.
 */

/** Qué tan grave es lo que se encontró. */
export type Gravedad = "bloquea" | "revisar";

export type Alerta = {
  /** La clave del texto: se traduce en pantalla, no se escribe aquí. */
  clave: string;
  gravedad: Gravedad;
  /** Datos para completar la frase (el otro pedido, cuántos rechazos…). */
  datos?: Record<string, string | number>;
};

/** Los hechos que hay que traer de la base para poder juzgar. */
export type HechosDelComprobante = {
  montoCentavos: number;
  /** El total del pedido al que dice corresponder. Null si no tiene pedido. */
  totalDelPedidoCentavos: number | null;
  codigoConfirmacion: string | null;
  /** Otro pago APROBADO con el mismo código de confirmación. */
  codigoYaAprobadoEn: string | null;
  /** Otro pago con el mismo código, todavía sin resolver o rechazado. */
  codigoVistoEn: string | null;
  /** Otro pago APROBADO con exactamente la misma imagen. */
  capturaYaAprobadaEn: string | null;
  /** Otro pago con la misma imagen, sin aprobar. */
  capturaVistaEn: string | null;
  /** Cuántos comprobantes de este mismo comprador se rechazaron antes. */
  rechazosDelPagador: number;
};

/**
 * DOS REGLAS QUE PARECEN LA MISMA Y NO LO SON.
 *
 * Un código o una captura que ya están APROBADOS en otro pago significan que
 * ese dinero ya se contó una vez: aprobarlo otra vez es regalar mercancía.
 * Eso bloquea.
 *
 * Un código o una captura vistos en un pago RECHAZADO o pendiente no bloquean.
 * Rechazar y volver a intentar con la transferencia corregida es lo normal, y
 * cerrarle la puerta a quien pagó de verdad cuesta más caro que el fraude que
 * evita. Eso solo se avisa.
 */
export function alertasDelComprobante(h: HechosDelComprobante): Alerta[] {
  const alertas: Alerta[] = [];

  if (h.codigoYaAprobadoEn) {
    alertas.push({
      clave: "codigoYaAprobado",
      gravedad: "bloquea",
      datos: { pago: h.codigoYaAprobadoEn },
    });
  } else if (h.codigoVistoEn) {
    alertas.push({
      clave: "codigoVisto",
      gravedad: "revisar",
      datos: { pago: h.codigoVistoEn },
    });
  }

  if (h.capturaYaAprobadaEn) {
    alertas.push({
      clave: "capturaYaAprobada",
      gravedad: "bloquea",
      datos: { pago: h.capturaYaAprobadaEn },
    });
  } else if (h.capturaVistaEn) {
    alertas.push({
      clave: "capturaVista",
      gravedad: "revisar",
      datos: { pago: h.capturaVistaEn },
    });
  }

  /* El monto que no cuadra con el pedido NO bloquea: puede ser un pago
     parcial acordado con el comercio, o un error de centavos. Pero es lo
     primero que hay que mirar, porque es como se cuela una captura de otra
     compra más chica. */
  if (
    h.totalDelPedidoCentavos !== null &&
    h.totalDelPedidoCentavos !== h.montoCentavos
  ) {
    alertas.push({
      clave: "montoNoCuadra",
      gravedad: "revisar",
      datos: {
        delPedido: h.totalDelPedidoCentavos,
        delComprobante: h.montoCentavos,
      },
    });
  }

  /* Sin código de confirmación no se puede buscar la transferencia en el
     banco: solo queda creerle a la imagen, que es justo lo que no se hace. */
  if (!h.codigoConfirmacion?.trim()) {
    alertas.push({ clave: "sinCodigo", gravedad: "revisar" });
  }

  if (h.rechazosDelPagador > 0) {
    alertas.push({
      clave: "pagadorConRechazos",
      gravedad: "revisar",
      datos: { veces: h.rechazosDelPagador },
    });
  }

  return alertas;
}

/**
 * Si hay algo que impide aprobar.
 *
 * Se comprueba EN EL SERVIDOR antes de acreditar, no solo en la pantalla: un
 * aviso que solo se dibuja lo saltea cualquiera, y aquí lo que está del otro
 * lado es dinero de un comercio.
 */
export function bloqueaLaAprobacion(alertas: Alerta[]): Alerta | null {
  return alertas.find((a) => a.gravedad === "bloquea") ?? null;
}

/**
 * La huella de una imagen, para reconocerla aunque le cambien el nombre.
 *
 * SHA-256 del archivo tal cual. No detecta una captura reeditada —cambiarle un
 * píxel da otra huella—, y no pretende: lo que atrapa es el caso común y
 * perezoso, que es volver a mandar el mismo archivo. Lo demás lo mira la
 * persona, y para eso están las otras señales.
 */
export async function huellaDelArchivo(datos: ArrayBuffer): Promise<string> {
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(resumen)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
