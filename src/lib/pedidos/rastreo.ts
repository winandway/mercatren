/**
 * EL NÚMERO DE GUÍA, Y DÓNDE SE MIRA.
 *
 * ══ POR QUÉ EXISTE (21 sep 2026) ══
 *
 * Un comprador de Estados Unidos que paga y no recibe nada más se queda
 * mirando el techo: el sitio tenía correo de «tu pedido está listo para
 * retirar» —que es el modelo de Venezuela, con su depósito y su cédula— y
 * correo de «entregado», y NADA en medio. Entre pagar y recibir la caja
 * pasan días; en esos días la persona no sabe si su compra existe.
 *
 * Peor: a quien compraba en mercatren.com se le mandaba el correo de retirar
 * en un mostrador. Le decía que fuera a buscar con su documento algo que ya
 * venía en camino a su casa.
 *
 * ══ LA REGLA DE ESTE ARCHIVO: NUNCA SE INVENTA UNA DIRECCIÓN ══
 *
 * Un enlace de rastreo equivocado es peor que ninguno: la persona lo abre,
 * ve «número no encontrado» y concluye que le vendieron humo. Aquí solo hay
 * transportistas cuyo formato de URL está comprobado; cualquier otro sale
 * con su nombre y su número, sin enlace, y ahí el correo dice que se busque
 * en la página del transportista. Sin enlace se sigue pudiendo copiar el
 * número; con un enlace roto se pierde la confianza.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Decide lo que lee alguien que está esperando una caja. Se prueba sin base
 * y sin red.
 */

/**
 * Los transportistas que sabemos rastrear.
 *
 * `marcas` son los trozos que CJ escribe en `logisticName` (llega como
 * «USPS+», «CJPacket USPS», «UPS Ground»…). Se compara en minúsculas.
 */
const TRANSPORTISTAS: readonly {
  nombre: string;
  marcas: readonly string[];
  url: (guia: string) => string;
}[] = [
  {
    nombre: "USPS",
    marcas: ["usps"],
    url: (g) =>
      `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(g)}`,
  },
  {
    nombre: "UPS",
    marcas: ["ups"],
    url: (g) => `https://www.ups.com/track?tracknum=${encodeURIComponent(g)}`,
  },
  {
    nombre: "FedEx",
    marcas: ["fedex"],
    url: (g) =>
      `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(g)}`,
  },
  {
    nombre: "DHL",
    marcas: ["dhl"],
    url: (g) =>
      `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(g)}`,
  },
  /**
   * SPEEDX: EL QUE CJ USA DE VERDAD EN ESTADOS UNIDOS (25 sep 2026).
   *
   * Faltaba, y era el más importante de la lista. Las dos primeras compras
   * reales a CJ salieron con «SpeedX US to US #2», y con esta lista sin él
   * el comprador recibía su número de guía SIN enlace para rastrearlo.
   *
   * El enlace NO es inventado: es exactamente el `trackingUrl` que CJ nos
   * devolvió para esas dos compras (YWE00001552040292 y YWE00001552040285),
   * leído de su API el 25 sep 2026. Es 17track, el rastreador que CJ les da a
   * sus propios clientes. Y el nombre sale limpio: «SpeedX», no la etiqueta
   * interna de CJ con su «US to US #2».
   */
  {
    nombre: "SpeedX",
    marcas: ["speedx", "speed x"],
    url: (g) => `https://t.17track.net/en#nums=${encodeURIComponent(g)}`,
  },
  {
    nombre: "Amazon",
    marcas: ["amazon", "amzl"],
    url: (g) => `https://track.amazon.com/tracking/${encodeURIComponent(g)}`,
  },
];

export type Rastreo = {
  /** El número, ya limpio. Es lo único que siempre está. */
  guia: string;
  /** Cómo se llama el transportista para la persona. */
  transportista: string | null;
  /** La página donde se mira, si la conocemos. Nunca inventada. */
  url: string | null;
};

/**
 * Lo que se le puede decir a quien espera su caja.
 *
 * Devuelve `null` cuando no hay número: sin guía no hay nada que rastrear, y
 * un renglón vacío en un correo solo genera la pregunta de por qué está ahí.
 */
export function rastreoDe(
  guia: string | null | undefined,
  transportista: string | null | undefined,
): Rastreo | null {
  const numero = (guia ?? "").trim();
  if (!numero) return null;

  const nombreCrudo = (transportista ?? "").trim();
  const t = nombreCrudo.toLowerCase();
  const conocido = TRANSPORTISTAS.find((c) =>
    c.marcas.some((m) => t.includes(m)),
  );

  return {
    guia: numero,
    /* El nombre que el transportista usa de verdad, no la etiqueta interna
       del proveedor: «CJPacket USPS» se lee «USPS». Si no lo reconocemos se
       enseña lo que vino, que es más que nada. */
    transportista: conocido?.nombre ?? (nombreCrudo || null),
    url: conocido ? conocido.url(numero) : null,
  };
}

/**
 * QUÉ SE LE ENSEÑA DEL ENVÍO A QUIEN COMPRÓ (25 sep 2026).
 *
 * Richard miró su pedido MT-000014 como lo ve un comprador y pidió que ahí se
 * vea, en cada compra, el número de guía. Existía desde el 22 sep, pero solo
 * dentro del pedido y solo cuando ya había guía: en «Mis pedidos» no salía
 * nunca, y mientras la guía no llegaba la pantalla no decía ni dónde iba a
 * aparecer. Quien compró no tenía dónde mirar.
 *
 * Tres respuestas, y solo tres:
 *
 * - `guia`: ya hay número. Se enseña con su transportista y su enlace.
 * - `pendiente`: pagado, se despacha a su dirección, y todavía sin guía. Se
 *   dice que aparece aquí —y que le llega por correo— en cuanto salga.
 * - `nada`: sin pagar, cancelado, entregado sin guía, o se retira en un
 *   mostrador. Un renglón de envío ahí solo confunde.
 *
 * Sale de las MISMAS dos piezas que el correo (`rastreoDe` y
 * `formaDeEntrega`), para que el correo y la pantalla cuenten lo mismo.
 */
export type QueMostrarDelEnvio =
  { tipo: "guia"; rastreo: Rastreo } | { tipo: "pendiente" } | { tipo: "nada" };

export function queMostrarDelEnvio(
  estado: string,
  seDespacha: boolean,
  rastreo: Rastreo | null,
  compraEnMarcha: boolean,
): QueMostrarDelEnvio {
  /* Con guía se enseña siempre, se haya entregado o no: es el comprobante de
     por dónde viajó, y quien reclama lo necesita. */
  if (rastreo && estado !== "cancelado" && estado !== "reembolsado") {
    return { tipo: "guia", rastreo };
  }
  if (!seDespacha) return { tipo: "nada" };
  /* ══ «APARECE AQUÍ» SOLO SI DE VERDAD VA A APARECER (25 sep 2026) ══

     Richard abrió la MT-000014 y leyó «todavía no tiene número de guía,
     aparece aquí en cuanto salga». Esa compra no iba a salir nunca: su pedido
     a CJ se quedó en el carrito el 5 sep, sin pagar, y se cerró como prueba.
     La pantalla le prometía para siempre una guía que no existe.

     La guía solo llega si hay una compra al proveedor EN MARCHA (por pagar,
     pagada o enviada): de ahí la saca el reloj. Cerrada, con error, o sin
     compra ninguna —un comercio que despacha por su cuenta todavía no carga
     guía— no hay nada que esperar, y no se promete. */
  if (!compraEnMarcha) return { tipo: "nada" };
  if (estado === "pagado" || estado === "preparando" || estado === "enviado") {
    return { tipo: "pendiente" };
  }
  return { tipo: "nada" };
}

/** Los estados de una compra al proveedor de los que SÍ sale una guía. */
export const COMPRA_EN_MARCHA = ["por_pagar", "pagado", "enviado"] as const;
