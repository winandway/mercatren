import type { Idioma } from "./dinero";

/**
 * EL NOMBRE DE CADA ESTADO DE UN PEDIDO, el mismo para quien compra («Mis
 * pedidos») y para quien vende («Mis ventas»). Lo que salió bien va en verde
 * (regla de la casa); lo que espera, en gris.
 */
const NOMBRES: Record<string, { es: string; en: string }> = {
  pendiente_pago: { es: "Por pagar", en: "Awaiting payment" },
  pagado: { es: "Pagado", en: "Paid" },
  preparando: { es: "Preparando", en: "Preparing" },
  enviado: { es: "Enviado", en: "Shipped" },
  entregado: { es: "Entregado", en: "Delivered" },
  cancelado: { es: "Cancelado", en: "Canceled" },
  reembolsado: { es: "Reembolsado", en: "Refunded" },
};

export const ESTADOS_BUENOS = new Set([
  "pagado",
  "preparando",
  "enviado",
  "entregado",
]);

export function nombreDelEstado(estado: string, idioma: Idioma): string {
  return NOMBRES[estado]?.[idioma] ?? estado;
}
