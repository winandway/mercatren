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
