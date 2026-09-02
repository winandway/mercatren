import "server-only";

import { eq, inArray } from "drizzle-orm";

import {
  LLAVE_POLITICA_ZELLE,
  politicaZelleDe,
  zelleHabilitadaPara,
} from "@/lib/cobros/zelle";
import { getDb } from "@/lib/db";
import { configuracion, zelleCobrosTienda } from "@/lib/db/schema";

/**
 * ¿Se les puede ofrecer Zelle a estas tiendas? (2 sep 2026)
 *
 * La política global manda (cerrado por defecto = solo tarjeta) y el
 * interruptor de cada tienda es la excepción que enciende el equipo. Se usa
 * en el checkout de los PEDIDOS: en la pantalla (para no dibujar el método)
 * y en el servidor (para rechazarlo aunque la pantalla se salte).
 */
export async function zelleAbiertoParaTiendas(
  tiendaIds: string[],
): Promise<boolean> {
  if (tiendaIds.length === 0) return false;
  const db = getDb();
  const [politicaFila] = await db
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVE_POLITICA_ZELLE))
    .limit(1);
  const politica = politicaZelleDe(politicaFila?.valor);

  const filas = await db
    .select({
      tiendaId: zelleCobrosTienda.tiendaId,
      habilitado: zelleCobrosTienda.habilitado,
    })
    .from(zelleCobrosTienda)
    .where(inArray(zelleCobrosTienda.tiendaId, tiendaIds));
  const porTienda = new Map(
    filas.map((f) => [f.tiendaId, Boolean(f.habilitado)]),
  );

  /* Todas las tiendas del carrito tienen que poder: un carrito con una
     tienda sin Zelle no se paga por Zelle. */
  return tiendaIds.every((id) =>
    zelleHabilitadaPara(
      politica,
      porTienda.has(id) ? porTienda.get(id)! : null,
    ),
  );
}
