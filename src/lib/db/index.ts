import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { cache } from "react";

import * as schema from "./schema";

export { schema };

/**
 * Acceso a la base de datos del sitio (env.DB de YaDominios Cloud).
 *
 * Usar esta version en paginas y acciones que se generan por peticion.
 */
export const getDb = cache(() => {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
});

/**
 * Igual que getDb, pero para paginas estaticas o generadas en el build,
 * donde el contexto de Cloudflare llega de forma asincrona.
 */
export const getDbAsync = cache(async () => {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
});

export type Db = ReturnType<typeof getDb>;
