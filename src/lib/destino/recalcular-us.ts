"use server";

import { and, eq, isNull, like, or, sql } from "drizzle-orm";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { fleteDeProducto } from "@/lib/cj/flete";
import { plazaDelMercado, type Plaza } from "@/lib/cj/plazas";
import { REGIONALES } from "@/lib/cj/riesgo";
import { precioPublicadoDe } from "@/lib/destino/precio-plaza";
import { mercadoDelPanel } from "@/lib/mercado/panel";
import { tasaVigente } from "@/lib/mercado/tasas";
import { getDb } from "@/lib/db";
import { enviosProducto, productos, tiendas } from "@/lib/db/schema";

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

export async function recalcularPreciosUs(
  /**
   * ══ VOLVER A COTIZAR TODO (2 sep 2026) ══
   * Si llega `antesDe` (milisegundos), entran también los productos cuya
   * cotización es anterior a ese instante — o sea, TODOS al pulsar el botón,
   * y cada tanda va sacando los que ya se recotizaron en esta corrida.
   */
  opciones?: { antesDe?: number },
): Promise<ResultadoRecalculo> {
  if (!(await esSoporteDeVerdad())) {
    return {
      ok: false,
      recalculados: 0,
      restantes: 0,
      motivo: "no-autorizado",
    };
  }

  /* ══ LA PLAZA LA DECIDE EL SELECTOR DEL PANEL (2 sep 2026) ══
     Antes esto era solo de Estados Unidos. Chile y Colombia se cotizan
     desde China con su propia fórmula (IVA y tope en Chile, sin ellos en
     Colombia) y su tasa del día — la regla de «toda consulta del panel del
     equipo obedece al selector de país». */
  const plaza = plazaDelMercado(await mercadoDelPanel());
  const tasa = plaza.mercado === "US" ? null : await tasaVigente(plaza.mercado);
  if (plaza.mercado !== "US" && tasa === null) {
    return {
      ok: false,
      recalculados: 0,
      restantes: 0,
      motivo: `Falta la tasa del dólar de ${plaza.mercado === "CL" ? "Chile" : "Colombia"}: cárgala en Configuración → La tasa del dólar.`,
    };
  }

  const db = getDb();

  /* ══ TAMBIÉN LOS QUE SE COTIZARON CON UN REGIONAL (2 sep 2026) ══
     La MT-000011 se publicó con GOFO+ a $1.70 y CJ la cobró con USPS a
     $6.70. Todo lo que tenga un repartidor regional en su fila de envío
     vuelve a la cola y se recotiza con un transporte nacional. */
  const antesDe = opciones?.antesDe;
  const toca = or(
    isNull(enviosProducto.productoId),
    ...REGIONALES.map((r) =>
      like(sql`lower(${enviosProducto.transporte})`, `%${r}%`),
    ),
    ...(antesDe
      ? [sql`${enviosProducto.cotizadoEn} < ${Math.floor(antesDe / 1000)}`]
      : []),
  );

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
    .where(and(eq(tiendas.paisOrigen, plaza.paisEntrega), toca));

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
      await marcarEstimado(p.id, ahora, plaza);
      hechos += 1;
      continue;
    }

    try {
      const envio = await fleteDeProducto(p.externoId, plaza);

      /* La fila vieja (la del regional) se va: una sola cotización por
         producto, la de hoy. */
      await db
        .delete(enviosProducto)
        .where(eq(enviosProducto.productoId, p.id))
        .catch(() => undefined);

      await db.insert(enviosProducto).values({
        productoId: p.id,
        costoCentavos: envio.costoCentavos,
        origen: envio.origen,
        transporte: envio.transporte,
        cotizadoEn: ahora,
      });

      const precio = precioPublicadoDe(
        plaza,
        p.costoCentavos,
        envio.costoCentavos,
        tasa,
      );
      /* Un producto que ya no cabe en la plaza (en Chile, el que pasa del
         tope de USD 500 con el envío nuevo) conserva su precio y queda
         escrito en el registro; no se publica un precio inventado. */
      if (precio.ok) {
        await db
          .update(productos)
          .set({
            precioCentavos: precio.publicadoCentavos,
            actualizadoEn: ahora,
          })
          .where(eq(productos.id, p.id));
      } else {
        console.error(
          "[precio] sin precio calculable en la plaza",
          plaza.mercado,
          p.id,
        );
      }

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

async function marcarEstimado(productoId: string, ahora: Date, plaza: Plaza) {
  try {
    await getDb().insert(enviosProducto).values({
      productoId,
      costoCentavos: plaza.envioEstimadoUsdCentavos,
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
  const plaza = plazaDelMercado(await mercadoDelPanel());

  const filas = await getDb()
    .select({ id: productos.id })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(
      and(
        eq(tiendas.paisOrigen, plaza.paisEntrega),
        or(
          isNull(enviosProducto.productoId),
          ...REGIONALES.map((r) =>
            like(sql`lower(${enviosProducto.transporte})`, `%${r}%`),
          ),
        ),
      ),
    );

  return filas.length;
}
