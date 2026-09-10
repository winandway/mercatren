/**
 * El ciclo de vida de un paquete, desde que el cliente lo anuncia hasta que
 * llega a su casa. Toda transición queda escrita en `eventos_casillero`:
 * esa lista es la defensa ante un reclamo por un paquete perdido.
 */

export const ESTADOS_PAQUETE = [
  "en_camino",
  "recibido",
  "huerfano",
  "asignado",
  "por_declarar",
  "en_bodega",
  "en_revision",
  "en_envio",
  "despachado",
  "en_transito",
  "en_aduana",
  "ultima_milla",
  "entregado",
  "retenido",
  "en_devolucion",
  "devuelto",
  "abandonado",
] as const;

export type EstadoPaquete = (typeof ESTADOS_PAQUETE)[number];

/** Lo permitido. Cualquier otra cosa es un error de programa, no del operario. */
const TRANSICIONES: Record<EstadoPaquete, readonly EstadoPaquete[]> = {
  en_camino: ["recibido", "huerfano"],
  recibido: ["asignado", "huerfano", "retenido"],
  huerfano: ["asignado", "devuelto", "abandonado"],
  asignado: ["por_declarar", "en_bodega", "retenido", "en_revision"],
  por_declarar: ["en_bodega", "retenido", "abandonado"],
  en_bodega: [
    "en_envio",
    "en_revision",
    "retenido",
    "en_devolucion",
    "abandonado",
  ],
  en_revision: ["en_bodega", "retenido", "devuelto"],
  en_envio: ["despachado", "en_bodega"],
  despachado: ["en_transito", "en_aduana"],
  en_transito: ["en_aduana", "ultima_milla", "retenido"],
  en_aduana: ["ultima_milla", "retenido", "devuelto"],
  ultima_milla: ["entregado", "devuelto"],
  entregado: [],
  retenido: ["en_bodega", "devuelto", "abandonado"],
  en_devolucion: ["devuelto"],
  devuelto: [],
  abandonado: [],
};

/** Estados en los que la caja está FÍSICAMENTE en la bodega de Miami. */
export const ESTADOS_EN_BODEGA: readonly EstadoPaquete[] = [
  "recibido",
  "huerfano",
  "asignado",
  "por_declarar",
  "en_bodega",
  "en_revision",
  "en_envio",
  "retenido",
  "en_devolucion",
];

export function puedeTransicionar(
  de: EstadoPaquete,
  a: EstadoPaquete,
): boolean {
  return TRANSICIONES[de]?.includes(a) ?? false;
}

export function transicionesDesde(de: EstadoPaquete): readonly EstadoPaquete[] {
  return TRANSICIONES[de] ?? [];
}

/**
 * Cómo se le dice al cliente. En su idioma, no en el del sistema: nadie
 * sabe qué es un «huérfano», y «Sin identificar» sí se entiende.
 */
export const ETIQUETA_ESTADO: Record<EstadoPaquete, string> = {
  en_camino: "En camino a Miami",
  recibido: "Recibido en bodega",
  huerfano: "Sin identificar",
  asignado: "En tu casillero",
  por_declarar: "Falta declarar el valor",
  en_bodega: "Listo para enviar",
  en_revision: "En revisión",
  en_envio: "Preparando el envío",
  despachado: "Despachado desde Miami",
  en_transito: "En tránsito",
  en_aduana: "En aduana",
  ultima_milla: "En reparto",
  entregado: "Entregado",
  retenido: "Retenido",
  en_devolucion: "En devolución a la tienda",
  devuelto: "Devuelto",
  abandonado: "Abandonado",
};

/** Lo mismo en inglés: el sitio es bilingüe y esto lo ve el comprador. */
export const ETIQUETA_ESTADO_EN: Record<EstadoPaquete, string> = {
  en_camino: "On its way to Miami",
  recibido: "Received at the warehouse",
  huerfano: "Unidentified",
  asignado: "In your locker",
  por_declarar: "Value still to be declared",
  en_bodega: "Ready to ship",
  en_revision: "Under review",
  en_envio: "Preparing the shipment",
  despachado: "Shipped from Miami",
  en_transito: "In transit",
  en_aduana: "In customs",
  ultima_milla: "Out for delivery",
  entregado: "Delivered",
  retenido: "On hold",
  en_devolucion: "Being returned to the store",
  devuelto: "Returned",
  abandonado: "Abandoned",
};
