import "server-only";

import { eq } from "drizzle-orm";

import { recalcularListados } from "@/lib/catalogo/consultas";
import { recalcularConteos } from "@/lib/catalogo/conteos";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * EL CATÁLOGO SE REHACE CUANDO UN PRODUCTO CAMBIA, NO AL MIRARLO (5 nov 2026).
 *
 * La portada y el catálogo sin filtros salen de una foto guardada (los ids ya
 * ordenados y los conteos: `listados-guardados.ts`, `conteos.ts`) que rehacía
 * el reloj cada cinco minutos. Con el reloj apagado por la pausa de gasto, la
 * foto se quedó congelada y un producto nuevo NO aparecía nunca, ni en la web
 * ni en la app (se vio al subir el primero desde la app).
 *
 * Ahora se rehace la foto del mercado de la tienda cada vez que un producto
 * se guarda o cambia de estado: unas pocas filas escritas por cambio real,
 * cero por visita («la nube no se come el dinero»). Si falla, se anota y el
 * guardado sigue: el producto ya está bien guardado.
 */
export async function catalogoCambioEnTienda(tiendaId: string): Promise<void> {
  try {
    const [tienda] = await getDb()
      .select({ mercado: tiendas.mercado })
      .from(tiendas)
      .where(eq(tiendas.id, tiendaId))
      .limit(1);
    if (!tienda) return;
    const mercado = mercadoPorCodigo(tienda.mercado);
    await recalcularListados(mercado);
    await recalcularConteos(mercado);
  } catch (fallo) {
    console.error(
      "[catalogo] no se pudo rehacer la foto tras un cambio:",
      fallo,
    );
    try {
      const { registrarError } = await import("@/lib/errores/registro");
      await registrarError("catalogo/al-cambiar", fallo);
    } catch {
      /* Anotar el fallo no puede provocar otro. */
    }
  }
}
