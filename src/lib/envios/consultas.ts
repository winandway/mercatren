import "server-only";

import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { enviosTienda } from "@/lib/db/schema";
import {
  acotarPorcentaje,
  POLITICA_POR_DEFECTO,
  type ModoEnvio,
  type PoliticaEnvio,
} from "@/lib/envios/politica";

/** Lo que se guarda, más los textos que escribe el comercio. */
export type PoliticaCompleta = PoliticaEnvio & {
  coberturaEs: string | null;
  coberturaEn: string | null;
  plazoEs: string | null;
  plazoEn: string | null;
};

export const POLITICA_COMPLETA_POR_DEFECTO: PoliticaCompleta = {
  ...POLITICA_POR_DEFECTO,
  coberturaEs: null,
  coberturaEn: null,
  plazoEs: null,
  plazoEn: null,
};

/**
 * La política de un comercio.
 *
 * **Un comercio sin fila devuelve `sin_definir`**, que es lo correcto: nunca
 * dijo nada. Devolver "no envía" por no tener fila sería inventarle una
 * respuesta y quitarle ventas a quien sí despacha.
 *
 * Se nombran las columnas una por una: pedir la tabla entera hace que Drizzle
 * liste todas las del esquema, y una base que ya existe no recibe las nuevas
 * porque `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`.
 */
export async function politicaDeEnvio(
  tiendaId: string,
): Promise<PoliticaCompleta> {
  const [fila] = await getDb()
    .select({
      modo: enviosTienda.modo,
      porcentajePuntosBase: enviosTienda.porcentajePuntosBase,
      coberturaEs: enviosTienda.coberturaEs,
      coberturaEn: enviosTienda.coberturaEn,
      plazoEs: enviosTienda.plazoEs,
      plazoEn: enviosTienda.plazoEn,
    })
    .from(enviosTienda)
    .where(eq(enviosTienda.tiendaId, tiendaId))
    .limit(1);

  if (!fila) return POLITICA_COMPLETA_POR_DEFECTO;

  return {
    modo: fila.modo as ModoEnvio,
    porcentajePuntosBase: acotarPorcentaje(fila.porcentajePuntosBase),
    coberturaEs: fila.coberturaEs,
    coberturaEn: fila.coberturaEn,
    plazoEs: fila.plazoEs,
    plazoEn: fila.plazoEn,
  };
}

/**
 * Las políticas de varios comercios de una vez.
 *
 * La usa el checkout: un carrito puede traer productos de tres comercios y
 * cada uno despacha a su manera. Una consulta por comercio dentro de un bucle
 * sería una consulta por renglón — aquí van todas juntas.
 */
export async function politicasDeEnvio(
  tiendaIds: string[],
): Promise<Map<string, PoliticaCompleta>> {
  const mapa = new Map<string, PoliticaCompleta>();
  const unicos = [...new Set(tiendaIds)];
  if (unicos.length === 0) return mapa;

  const filas = await getDb()
    .select({
      tiendaId: enviosTienda.tiendaId,
      modo: enviosTienda.modo,
      porcentajePuntosBase: enviosTienda.porcentajePuntosBase,
      coberturaEs: enviosTienda.coberturaEs,
      coberturaEn: enviosTienda.coberturaEn,
      plazoEs: enviosTienda.plazoEs,
      plazoEn: enviosTienda.plazoEn,
    })
    .from(enviosTienda)
    .where(inArray(enviosTienda.tiendaId, unicos));

  for (const f of filas) {
    mapa.set(f.tiendaId, {
      modo: f.modo as ModoEnvio,
      porcentajePuntosBase: acotarPorcentaje(f.porcentajePuntosBase),
      coberturaEs: f.coberturaEs,
      coberturaEn: f.coberturaEn,
      plazoEs: f.plazoEs,
      plazoEn: f.plazoEn,
    });
  }

  // Los que no tienen fila: sin definir, no "no envía".
  for (const id of unicos) {
    if (!mapa.has(id)) mapa.set(id, POLITICA_COMPLETA_POR_DEFECTO);
  }

  return mapa;
}
