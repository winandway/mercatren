import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";

import { conPresupuesto } from "./presupuesto";
import * as schema from "./schema";

export { schema };

/**
 * Acceso a la base de datos del sitio (env.DB de YaDominios Cloud).
 *
 * Usar esta version en paginas y acciones que se generan por peticion.
 */
/* Toda la base pasa por el presupuesto (5 nov 2026, regla «La nube no se
   come el dinero»): cuenta lo leído y escrito y frena las escrituras si se
   pasan del tope. Ver `presupuesto.ts`. */
export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(conPresupuesto(env.DB), { schema });
});

/**
 * Igual que getDb, pero para paginas estaticas o generadas en el build,
 * donde el contexto de Cloudflare llega de forma asincrona.
 */
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(conPresupuesto(env.DB), { schema });
});

export type Db = ReturnType<typeof getDb>;
