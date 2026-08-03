import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Direcciones que rebotan de forma permanente.
 *
 * Cuando el servicio de correo dice que una direccion no existe, insistir no
 * sirve de nada y ademas hace dano: los proveedores miden cuantos correos
 * nuestros rebotan, y si el numero sube empiezan a mandar a spam TODO lo que
 * sale de mercatren.com — incluidos los avisos de pago que si importan.
 *
 * Se guarda en la tabla de configuracion con el prefijo `rebote:` para no
 * pedir una migracion por algo tan pequeno. Si algun dia hay muchos, se le
 * hace su propia tabla.
 *
 * Nunca lanza: no poder consultar los rebotes no puede impedir un envio.
 */

const PREFIJO = "rebote:";

export async function tieneRebote(correo: string): Promise<boolean> {
  try {
    const db = getDb();
    const [fila] = await db
      .select({ clave: schema.configuracion.clave })
      .from(schema.configuracion)
      .where(eq(schema.configuracion.clave, PREFIJO + correo))
      .limit(1);

    return Boolean(fila);
  } catch {
    return false;
  }
}

export async function anotarRebote(correo: string): Promise<void> {
  try {
    const db = getDb();
    await db
      .insert(schema.configuracion)
      .values({ clave: PREFIJO + correo, valor: "permanente" })
      .onConflictDoNothing();
  } catch {
    // Si no se puede anotar, el proximo envio lo intentara otra vez. Molesto,
    // pero no es motivo para romper la operacion que pidio el aviso.
  }
}
