import "server-only";

import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  baseDesdePublicado,
  COMISION_TARJETA_PB,
  PROCESADOR_FIJO_CENTAVOS,
  PROCESADOR_PORCENTAJE_PB,
  precioConAjusteCentavos,
} from "@/lib/dinero";

/**
 * ¿ESTÁN TODOS LOS PRECIOS BIEN?
 *
 * El 5 ago 2026 un producto se infló solo de $500 a $595 y el dueño perdió la
 * confianza en el catálogo entero — con razón: si un precio se movió solo,
 * ninguno vale hasta que se compruebe. La respuesta a "¿están todos
 * correctos?" no puede ser la palabra de nadie; tiene que ser una pantalla
 * que se abre y lo dice.
 *
 * QUÉ COMPRUEBA, producto por producto:
 *
 *   1. Que el precio publicado sea EXACTAMENTE el que sale de aplicarle la
 *      fórmula al precio del proveedor. Ni un centavo más ni uno menos.
 *   2. Que después de que el procesador cobre su parte (2.9% + $0.30) y de
 *      apartar el margen del 2%, al proveedor le quede su precio COMPLETO.
 *      Esta es la que de verdad importa: si falla, estamos vendiendo a
 *      pérdida sin saberlo.
 *
 * Es de solo lectura. No arregla nada: para eso está el botón de aplicar el
 * ajuste al catálogo, y conviene mirarlo antes y después de pulsarlo.
 */
export type ProductoDesalineado = {
  id: string;
  titulo: string;
  tienda: string | null;
  /** Lo que el proveedor cobra. */
  baseCentavos: number;
  /** Lo que está publicado hoy. */
  publicadoCentavos: number;
  /** Lo que debería estar publicado. */
  deberiaCentavos: number;
  /** Positivo: el cliente está pagando de más. Negativo: vendemos a pérdida. */
  diferenciaCentavos: number;
  /** Verdadero si al proveedor no le alcanza para cobrar su precio. */
  aPerdida: boolean;
};

export type AuditoriaPrecios = {
  revisados: number;
  correctos: number;
  sinBase: number;
  /**
   * CUÁNTOS ESTÁN MAL EN TOTAL, no cuántos caben en la tabla.
   *
   * La lista se corta en 50 para que la pantalla no se vuelva ilegible, pero
   * el número que se enseña tiene que ser el de verdad: decir "50 por
   * recalcular" cuando son 674 es justo el tipo de dato que hace perder la
   * confianza en el sistema.
   */
  totalDesalineados: number;
  /** Los 50 peores, para mirarlos. */
  desalineados: ProductoDesalineado[];
  /** Cuántos de los desalineados dejan al proveedor corto. */
  aPerdida: number;
};

export async function auditarPrecios(): Promise<AuditoriaPrecios> {
  const db = getDb();

  const filas = await db
    .select({
      id: productos.id,
      titulo: productos.tituloEs,
      tienda: tiendas.nombre,
      precioCentavos: productos.precioCentavos,
      precioBaseCentavos: productos.precioBaseCentavos,
    })
    .from(productos)
    .leftJoin(tiendas, eq(tiendas.id, productos.tiendaId));

  let correctos = 0;
  let sinBase = 0;
  let aPerdida = 0;
  const desalineados: ProductoDesalineado[] = [];

  for (const f of filas) {
    const publicado = Number(f.precioCentavos);
    if (publicado <= 0) {
      // Un borrador sin precio no está mal: está a medio cargar.
      correctos++;
      continue;
    }

    if (f.precioBaseCentavos === null) sinBase++;
    const base = f.precioBaseCentavos ?? baseDesdePublicado(publicado);
    const deberia = precioConAjusteCentavos(base);

    /* Lo que de verdad importa: que al proveedor le quede su precio entero
       después del procesador y del margen. Se calcula sobre lo PUBLICADO,
       que es lo que el cliente paga de verdad. */
    const procesador =
      Math.round((publicado * PROCESADOR_PORCENTAJE_PB) / 10_000) +
      PROCESADOR_FIJO_CENTAVOS;
    const margen = Math.round((publicado * COMISION_TARJETA_PB) / 10_000);
    const leQueda = publicado - procesador - margen;
    const corto = leQueda < base;

    if (deberia === publicado && !corto) {
      correctos++;
      continue;
    }

    if (corto) aPerdida++;
    desalineados.push({
      id: f.id,
      titulo: f.titulo,
      tienda: f.tienda,
      baseCentavos: base,
      publicadoCentavos: publicado,
      deberiaCentavos: deberia,
      diferenciaCentavos: publicado - deberia,
      aPerdida: corto,
    });
  }

  return {
    revisados: filas.length,
    correctos,
    sinBase,
    aPerdida,
    totalDesalineados: desalineados.length,
    // Primero los que nos hacen perder dinero, y de esos los peores.
    desalineados: desalineados
      .sort((a, b) => {
        if (a.aPerdida !== b.aPerdida) return a.aPerdida ? -1 : 1;
        return Math.abs(b.diferenciaCentavos) - Math.abs(a.diferenciaCentavos);
      })
      .slice(0, 50),
  };
}
