/**
 * Número de guía: normalización y de qué transportista es.
 *
 * Sirve para dos cosas: cruzar la prealerta del cliente con el paquete que
 * se escanea en la bodega, y saber a qué feed de transportista corresponde
 * cada aviso.
 */

export const CARRIERS = [
  "ups",
  "fedex",
  "usps",
  "amazon",
  "dhl",
  "otro",
] as const;

export type Carrier = (typeof CARRIERS)[number];

/**
 * Mayúsculas, sin espacios ni guiones: la forma con la que se compara y se
 * indexa. El cliente escribe la guía copiándola del correo de Amazon, con
 * espacios; el escáner la lee de corrido. Si no se normalizan las dos, la
 * prealerta no cruza nunca y el paquete cae en huérfanos.
 */
export function normalizarTracking(tracking: string): string {
  return tracking.replace(/[\s\-_.]/g, "").toUpperCase();
}

const PATRONES: Array<{ carrier: Carrier; re: RegExp }> = [
  { carrier: "ups", re: /^1Z[0-9A-Z]{16}$/ },
  { carrier: "amazon", re: /^TBA\d{9,12}$/ },
  { carrier: "usps", re: /^(94|93|92|95|82)\d{18,24}$/ },
  { carrier: "usps", re: /^[A-Z]{2}\d{9}US$/ },
  { carrier: "dhl", re: /^JJD\d{15,20}$/ },
  { carrier: "dhl", re: /^\d{10}$/ },
  { carrier: "fedex", re: /^\d{12}$/ },
  { carrier: "fedex", re: /^\d{15}$/ },
  { carrier: "fedex", re: /^\d{20}$/ },
];

/** El transportista por el patrón de la guía. «otro» si no cuadra ninguno. */
export function detectarCarrier(tracking: string): Carrier {
  const t = normalizarTracking(tracking);
  for (const { carrier, re } of PATRONES) {
    if (re.test(t)) return carrier;
  }
  return "otro";
}

/** Una guía utilizable tiene al menos 8 caracteres alfanuméricos. */
export function trackingPlausible(tracking: string): boolean {
  const t = normalizarTracking(tracking);
  return /^[0-9A-Z]{8,35}$/.test(t);
}
