import "server-only";

import { eq } from "drizzle-orm";

import { contarFotosRotas as contar } from "@/lib/catalogo/fotos-automaticas";
import {
  LLAVE_FOTOS_POR_HORA,
  fotosPorHoraDe,
} from "@/lib/catalogo/fotos-reglas";
import { getDb } from "@/lib/db";
import { configuracion } from "@/lib/db/schema";

/** Lo que la pantalla de Configuración necesita saber del copiado. */
export async function contarFotosRotas(): Promise<number> {
  try {
    return await contar();
  } catch {
    return 0;
  }
}

export async function fotosPorHoraVigente(): Promise<number> {
  try {
    const [f] = await getDb()
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(eq(configuracion.clave, LLAVE_FOTOS_POR_HORA))
      .limit(1);
    return fotosPorHoraDe(f?.valor);
  } catch {
    return fotosPorHoraDe(null);
  }
}
