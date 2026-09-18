import "server-only";
import type { Mercado } from "@/lib/mercado/mercados";

import { conteosDe } from "@/lib/catalogo/conteos";

/**
 * DÓNDE ESTÁ MERCATREN: cuántos productos se pueden retirar en cada ciudad.
 *
 * Es lo que enciende el bombillo verde del selector. El cliente que abre la
 * lista ve de un vistazo en qué ciudades ya hay mercancía — y, con el tiempo,
 * los vendedores verán dónde NO hay: cada ciudad apagada es un negocio que
 * falta por abrir. La cobertura no se escribe a mano en ninguna parte; sale
 * de los depósitos con productos publicados, así que crece sola cuando un
 * comercio nuevo carga su catálogo.
 *
 * ══ SALE DE LA FOTO GUARDADA (emergencia de costo, 17 sep 2026) ══
 *
 * Esto era un `GROUP BY d.zona` sobre productos JOIN tiendas JOIN depósitos
 * en CADA página (va en el encabezado): 32.500 filas por visita, 4 mil
 * millones a la semana. Ahora lo cuenta el reloj cada pocos minutos y aquí
 * se lee la fila (`src/lib/catalogo/conteos.ts`). El filtro es el mismo:
 * publicado, con precio, depósito activo con zona, tienda activa DE ESTE
 * PAÍS — sin eso, el selector de un dominio prometía mercancía de otro.
 */
export async function coberturaPorCiudad(
  mercado: Mercado,
): Promise<Record<string, number>> {
  try {
    return (await conteosDe(mercado)).cobertura;
  } catch {
    // Sin base no hay bombillos, pero el encabezado jamás tumba la página.
    return {};
  }
}
