import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { seguridadProducto } from "@/lib/db/schema";
import { pideSeguridadUe } from "@/lib/productos/seguridad";

export type SeguridadGuardada = {
  fabricanteNombre: string;
  fabricanteDireccion: string;
  fabricanteCorreo: string;
  responsableUe: string | null;
  advertenciasEs: string | null;
  advertenciasEn: string | null;
};

/**
 * Lo guardado de la seguridad de un producto. Fuera de España devuelve null
 * SIN leer la base: mirar una ficha de Estados Unidos no cuesta una lectura.
 */
export async function seguridadDelProducto(
  productoId: string,
  mercado: string | null | undefined,
): Promise<SeguridadGuardada | null> {
  if (!pideSeguridadUe(mercado)) return null;
  const [fila] = await getDb()
    .select({
      fabricanteNombre: seguridadProducto.fabricanteNombre,
      fabricanteDireccion: seguridadProducto.fabricanteDireccion,
      fabricanteCorreo: seguridadProducto.fabricanteCorreo,
      responsableUe: seguridadProducto.responsableUe,
      advertenciasEs: seguridadProducto.advertenciasEs,
      advertenciasEn: seguridadProducto.advertenciasEn,
    })
    .from(seguridadProducto)
    .where(eq(seguridadProducto.productoId, productoId))
    .limit(1);
  return fila ?? null;
}
