import "server-only";

import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { cjConfigurado, llamarCj } from "@/lib/cj/cliente";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import { cotizarFlete } from "@/lib/cj/flete";
import { guardarTallas } from "@/lib/cj/guardar";
import { DEPARTAMENTO_CON_TALLAS, stockDeVariante } from "@/lib/cj/masivo";
import { plazaDelMercado, type Plaza } from "@/lib/cj/plazas";
import { ESPERA_MS, esperar } from "@/lib/cj/ritmo";
import { elegirVariante, variantesDeCj } from "@/lib/cj/variantes";
import { getDb, type Db } from "@/lib/db";
import { enviosProducto, productos, tiendas } from "@/lib/db/schema";
import { precioPublicadoDe } from "@/lib/destino/precio-plaza";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { tasaVigente } from "@/lib/mercado/tasas";

/**
 * AFINAR LO QUE ENTRÓ CON ENVÍO ESTIMADO: flete real, tallas y stock.
 *
 * La importación masiva publica con un envío estimado (marcado así en
 * `envios_producto`). Esto toma esos productos —la ropa primero, que sin
 * talla no se puede vender bien— y por cada uno hace DOS llamadas a CJ: las
 * variantes (de ahí salen las tallas Y el stock de hoy) y el flete de la
 * variante más barata. Con eso rearma el precio con la fórmula de su plaza.
 *
 * Lo llama el reloj de `/datos/sincronizar` en cada vuelta y el botón del
 * panel. Lo que decide qué falta es el propio dato (`origen = 'estimado'`),
 * así que se puede cortar y retomar cuando sea.
 *
 * Un producto que en Chile pasa del tope de USD 500 con el flete real se
 * pasa a BORRADOR: venderlo sería mandarle una sorpresa de aduana al
 * comprador, y un precio inventado no se publica.
 */

export type ResultadoAfinado = {
  afinados: number;
  agotados: number;
  fallidos: number;
  restantes: number;
  motivo?: string;
};

function condicionDeCola(paises: string[]) {
  return and(
    eq(productos.fuenteId, FUENTE_CJ),
    inArray(tiendas.paisOrigen, paises),
    or(
      isNull(enviosProducto.productoId),
      eq(enviosProducto.origen, "estimado"),
    ),
  );
}

export async function afinarImportados(o: {
  limite: number;
  presupuestoMs: number;
  plaza?: Plaza;
}): Promise<ResultadoAfinado> {
  const vacio = { afinados: 0, agotados: 0, fallidos: 0, restantes: 0 };
  if (!cjConfigurado())
    return { ...vacio, motivo: "Falta la variable CJ_API_KEY." };

  const db = getDb();
  const paises = o.plaza ? [o.plaza.paisEntrega] : ["US", "CL", "CO"];
  const hasta = Date.now() + o.presupuestoMs;

  const [total] = await db
    .select({ n: sql<number>`count(*)` })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(condicionDeCola(paises));
  const restantesAlEmpezar = Number(total?.n ?? 0);
  if (restantesAlEmpezar === 0) return vacio;

  const cola = await db
    .select({
      id: productos.id,
      pid: productos.externoId,
      costo: productos.precioBaseCentavos,
      pais: tiendas.paisOrigen,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(condicionDeCola(paises))
    .orderBy(
      /* La ropa primero: es lo único que no se puede vender bien sin afinar. */
      sql`case when ${productos.categoriaId} = ${DEPARTAMENTO_CON_TALLAS} then 0 else 1 end`,
      /* Lo que ya se intentó y falló va al final (se le sube la fecha). */
      sql`${enviosProducto.cotizadoEn} is not null`,
      asc(enviosProducto.cotizadoEn),
      asc(productos.creadoEn),
    )
    .limit(o.limite);

  const tasas = new Map<string, number | null>();
  const cuenta = { afinados: 0, agotados: 0, fallidos: 0 };

  for (const p of cola) {
    if (Date.now() >= hasta) break;
    const plaza = plazaDelMercado(mercadoPorCodigo(p.pais ?? "US"));
    if (!tasas.has(plaza.mercado)) {
      tasas.set(
        plaza.mercado,
        plaza.mercado === "US" ? null : await tasaVigente(plaza.mercado),
      );
    }
    const tasa = tasas.get(plaza.mercado) ?? null;
    const ahora = new Date();

    if (!p.pid || !p.costo || p.costo <= 0) {
      cuenta.fallidos += 1;
      await posponer(db, p.id, ahora);
      continue;
    }

    /* 1) Las variantes con stock en el almacén de la plaza. */
    const r = await llamarCj<unknown>(
      `/product/variant/query?pid=${encodeURIComponent(p.pid)}&countryCode=${plaza.almacen}`,
    ).catch(() => ({ ok: false as const, motivo: "no contestó" }));
    await esperar(ESPERA_MS);
    if (!r.ok) {
      cuenta.fallidos += 1;
      await posponer(db, p.id, ahora);
      continue;
    }
    const lista = variantesDeCj(r.datos);
    if (lista.length === 0) {
      /* CJ contestó bien y no hay ninguna variante con stock allá: agotado
         hoy. Se anota y se vuelve a mirar en otra vuelta. */
      cuenta.agotados += 1;
      await db
        .update(productos)
        .set({
          existencias: 0,
          controlaExistencias: true,
          sincronizadoEn: ahora,
          actualizadoEn: ahora,
        })
        .where(eq(productos.id, p.id))
        .catch(() => undefined);
      await posponer(db, p.id, ahora);
      continue;
    }

    /* 2) El flete de la más barata, que es la que se le cobra al comprador. */
    const elegida = elegirVariante(lista);
    const cotizacion = elegida?.vid
      ? await cotizarFlete(elegida.vid, plaza)
      : {};
    await esperar(ESPERA_MS);
    if (!(cotizacion.costoCentavos && cotizacion.costoCentavos > 0)) {
      cuenta.fallidos += 1;
      await posponer(db, p.id, ahora);
      continue;
    }

    const precio = precioPublicadoDe(
      plaza,
      p.costo,
      cotizacion.costoCentavos,
      tasa,
    );
    const stock = lista.reduce(
      (t, v) => t + stockDeVariante(v as Record<string, unknown>),
      0,
    );

    try {
      await db.batch([
        db
          .insert(enviosProducto)
          .values({
            productoId: p.id,
            costoCentavos: cotizacion.costoCentavos,
            origen: "cotizado",
            transporte: cotizacion.transporte ?? null,
            cotizadoEn: ahora,
          })
          .onConflictDoUpdate({
            target: enviosProducto.productoId,
            set: {
              costoCentavos: cotizacion.costoCentavos,
              origen: "cotizado",
              transporte: cotizacion.transporte ?? null,
              cotizadoEn: ahora,
            },
          }),
        db
          .update(productos)
          .set({
            ...(precio.ok
              ? { precioCentavos: precio.publicadoCentavos }
              : { estado: "borrador" as const }),
            existencias: stock,
            controlaExistencias: true,
            sincronizadoEn: ahora,
            actualizadoEn: ahora,
          })
          .where(eq(productos.id, p.id)),
      ]);
      if (precio.ok) {
        await guardarTallas(
          p.id,
          p.pid,
          plaza.almacen,
          precio.publicadoCentavos,
          ahora,
          lista,
        );
      }
      cuenta.afinados += 1;
    } catch (fallo) {
      console.error("[cj-afinar] no se pudo guardar", p.id, fallo);
      cuenta.fallidos += 1;
    }
  }

  return {
    ...cuenta,
    restantes: Math.max(0, restantesAlEmpezar - cuenta.afinados),
  };
}

/** Sube la fecha del estimado para que el producto vaya al final de la cola. */
async function posponer(db: Db, productoId: string, ahora: Date) {
  await db
    .insert(enviosProducto)
    .values({
      productoId,
      costoCentavos: 1,
      origen: "estimado",
      transporte: null,
      cotizadoEn: ahora,
    })
    .onConflictDoUpdate({
      target: enviosProducto.productoId,
      set: { cotizadoEn: ahora },
    })
    .catch(() => undefined);
}

/** Para el panel: cuántos siguen con envío estimado y cuántos ya tienen el real. */
export async function contarPorAfinar(
  plaza: Plaza,
): Promise<{ porAfinar: number; afinados: number }> {
  const db = getDb();
  const [filas] = await db
    .select({
      porAfinar: sql<number>`sum(case when ${enviosProducto.productoId} is null or ${enviosProducto.origen} = 'estimado' then 1 else 0 end)`,
      afinados: sql<number>`sum(case when ${enviosProducto.origen} = 'cotizado' then 1 else 0 end)`,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        eq(tiendas.paisOrigen, plaza.paisEntrega),
      ),
    )
    .catch(() => []);
  return {
    porAfinar: Number(filas?.porAfinar ?? 0),
    afinados: Number(filas?.afinados ?? 0),
  };
}
