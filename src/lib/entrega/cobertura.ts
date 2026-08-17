import "server-only";
import type { Mercado } from "@/lib/mercado/mercados";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";

import { zonaPorSlug } from "./zonas";

/**
 * DÓNDE ESTÁ MERCATREN: cuántos productos se pueden retirar en cada ciudad.
 *
 * Es lo que enciende el bombillo verde del selector. El cliente que abre la
 * lista ve de un vistazo en qué ciudades ya hay mercancía — y, con el tiempo,
 * los vendedores verán dónde NO hay: cada ciudad apagada es un negocio que
 * falta por abrir. La cobertura no se escribe a mano en ninguna parte; sale
 * de los depósitos con productos publicados, así que crece sola cuando un
 * comercio nuevo carga su catálogo.
 */
export async function coberturaPorCiudad(
  mercado: Mercado,
): Promise<Record<string, number>> {
  try {
    const db = getDb();
    const filas = await db.all<{ zona: string; cuantos: number }>(sql`
      SELECT d.zona AS zona, COUNT(*) AS cuantos
        FROM depositos d
        JOIN productos p ON p.deposito_id = d.id
        JOIN tiendas t ON t.id = p.tienda_id
       WHERE d.activo = 1
         AND d.zona IS NOT NULL
         AND p.estado = 'publicado'
         AND p.precio_centavos > 0
         AND t.estado = 'activa'
         -- El bombillo cuenta lo que se retira EN ESTE PAIS. Sin esto, el
         -- selector de un dominio prometia mercancia de otro.
         AND t.mercado = ${mercado.codigo}
       GROUP BY d.zona
    `);

    const cobertura: Record<string, number> = {};
    for (const f of filas) {
      // Solo ciudades que existen en el mapa: un depósito con una zona
      // escrita a mano y mal no puede inventar una ciudad en el selector.
      if (zonaPorSlug(f.zona)) cobertura[f.zona] = Number(f.cuantos);
    }
    return cobertura;
  } catch {
    // Sin base no hay bombillos, pero el encabezado jamás tumba la página.
    return {};
  }
}
