"use server";

import { and, eq, isNull } from "drizzle-orm";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { fleteDeProducto } from "@/lib/cj/flete";
import { getDb } from "@/lib/db";
import { enviosProducto, productos, tiendas } from "@/lib/db/schema";
import { desglosarUs } from "@/lib/destino/precio-us";

/**
 * RECALCULAR EL PRECIO DE LOS PRODUCTOS QUE SE PUBLICARON SIN ENVÍO.
 *
 * ══ QUÉ ARREGLA ══
 *
 * Los 78 productos de Estados Unidos que ya estaban publicados el 19 ago 2026
 * tienen el precio calculado con el envío en CERO. Cada venta suya deja un
 * tercio de lo declarado. Esto los vuelve a cotizar contra CJ y les corrige el
 * precio.
 *
 * ══ POR QUÉ NO HAY QUE «ARREGLAR» NADA MÁS ══
 *
 * El precio publicado es lo único que estaba mal. El costo del producto ya
 * estaba bien guardado (`precio_base_centavos`), la comisión sale de una
 * constante y el procesador se calcula. Solo faltaba el sumando del envío.
 *
 * ══ EL ORDEN IMPORTA, Y ESTÁ AL REVÉS DE LO QUE PARECE ══
 *
 * Primero se cotiza y se guarda el flete, DESPUÉS se escribe el precio. Si se
 * hiciera al revés y la cotización fallara a mitad, quedarían productos con
 * precio nuevo y sin constancia de con qué envío se armó — imposible de
 * auditar después. Así, el peor caso es un producto cotizado cuyo precio se
 * escribe en la siguiente pasada.
 *
 * ══ IDEMPOTENTE ══
 *
 * Solo mira los que NO tienen fila en `envios_producto`. Un producto ya
 * recalculado no se vuelve a tocar, así que se puede pulsar las veces que haga
 * falta y retomar donde se quedó.
 */

/** De cuántos en cuántos. Cada uno son dos llamadas a CJ, así que la tanda es
 *  corta: en el borde, una petición tiene su tiempo contado. */
const POR_TANDA = 8;

export type ResultadoRecalculo = {
  ok: boolean;
  recalculados: number;
  restantes: number;
  motivo?: string;
};

export async function recalcularPreciosUs(): Promise<ResultadoRecalculo> {
  if (!(await esSoporteDeVerdad())) {
    return {
      ok: false,
      recalculados: 0,
      restantes: 0,
      motivo: "no-autorizado",
    };
  }

  const db = getDb();

  /* Solo las columnas que hacen falta, nunca la tabla entera: pedir
     `productos` completo lista columnas que en producción pueden no existir
     todavía, y eso ya tumbó una pantalla el 5 ago 2026. */
  const pendientes = await db
    .select({
      id: productos.id,
      externoId: productos.externoId,
      costoCentavos: productos.precioBaseCentavos,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(
      and(eq(tiendas.paisOrigen, "US"), isNull(enviosProducto.productoId)),
    );

  if (pendientes.length === 0) {
    return { ok: true, recalculados: 0, restantes: 0 };
  }

  let hechos = 0;
  const ahora = new Date();

  for (const p of pendientes.slice(0, POR_TANDA)) {
    if (!p.externoId || !p.costoCentavos || p.costoCentavos <= 0) {
      /* Sin id de origen no se puede cotizar, y sin costo no hay precio que
         recalcular. Se deja constancia con el estimado para que no vuelva a
         entrar en esta cola cada vez — si no, la barra nunca llegaría al
         final y quien la mira creería que algo se colgó. */
      await marcarEstimado(p.id, ahora);
      hechos += 1;
      continue;
    }

    try {
      const envio = await fleteDeProducto(p.externoId);

      await db.insert(enviosProducto).values({
        productoId: p.id,
        costoCentavos: envio.costoCentavos,
        origen: envio.origen,
        transporte: envio.transporte,
        cotizadoEn: ahora,
      });

      const precio = desglosarUs(p.costoCentavos, envio.costoCentavos);
      await db
        .update(productos)
        .set({
          precioCentavos: precio.publicadoCentavos,
          actualizadoEn: ahora,
        })
        .where(eq(productos.id, p.id));

      hechos += 1;
    } catch (fallo) {
      /* Que uno falle no detiene a los demás: son productos independientes y
         el que falle vuelve a entrar solo en la siguiente pasada, porque
         sigue sin fila de envío. */
      console.error("[precio-us] no se pudo recalcular", p.id, fallo);
    }
  }

  return {
    ok: true,
    recalculados: hechos,
    restantes: Math.max(0, pendientes.length - hechos),
  };
}

async function marcarEstimado(productoId: string, ahora: Date) {
  const { ENVIO_ESTIMADO_CENTAVOS } = await import("@/lib/destino/envio-us");
  try {
    await getDb().insert(enviosProducto).values({
      productoId,
      costoCentavos: ENVIO_ESTIMADO_CENTAVOS,
      origen: "estimado",
      transporte: null,
      cotizadoEn: ahora,
    });
  } catch (fallo) {
    console.error("[precio-us] no se pudo marcar", productoId, fallo);
  }
}

/** Cuántos siguen con el precio armado sin envío. Para pintar la pantalla. */
export async function contarSinEnvio(): Promise<number> {
  if (!(await esSoporteDeVerdad())) return 0;

  const filas = await getDb()
    .select({ id: productos.id })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(
      and(eq(tiendas.paisOrigen, "US"), isNull(enviosProducto.productoId)),
    );

  return filas.length;
}
