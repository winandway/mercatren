import "server-only";

import { and, eq, ne, sql } from "drizzle-orm";

import { FUENTE_CJ } from "@/lib/cj/constantes";
import { getDb } from "@/lib/db";
import {
  enviosProducto,
  fuentesCatalogo,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";

/**
 * LA CONTABILIDAD DEL CATÁLOGO: CUÁNTO HAY Y QUÉ LE FALTA (3 sep 2026).
 *
 * Lo pidió el dueño con esta lista: «cuántos productos tenemos en Chile, en
 * Colombia, en Estados Unidos; cuántas tiendas de Venezuela; cuántos están
 * procesados, cuántos traducidos, cuántos tienen el texto, las tallas, todo
 * correcto y disponible… yo no sé nada de eso».
 *
 * Va aquí y no en la pantalla porque el vigilante lo mide en cada corrida y
 * lo manda por correo: la pantalla es UNA de las salidas, no la única.
 *
 * ══ DOS REGLAS ══
 *
 * 1. **Una sola consulta por plaza, no una por número.** Son once cuentas
 *    sobre la misma tabla; en once consultas, con cincuenta mil fichas, la
 *    pantalla tarda. Se hacen con `sum(case when …)`, que SQLite resuelve
 *    en una pasada.
 * 2. **Nunca se pide la tabla entera** (regla del proyecto): solo columnas
 *    nombradas y agregados.
 */

export type PlazaInventario = {
  mercado: "US" | "CL" | "CO";
  /** Lo que un comprador puede ver y comprar hoy. */
  publicados: number;
  enRevision: number;
  borradores: number;
  agotados: number;
  /** Con flete real cotizado (no estimado ni vacío). */
  conFleteReal: number;
  conFleteEstimado: number;
  sinFlete: number;
  sinCostoBase: number;
  /** Título aún en inglés (español igual al inglés). */
  sinTraducir: number;
  sinDescripcion: number;
  /** Fotos que todavía viven en el servidor de origen. */
  fotosDeOrigen: number;
};

export type TiendaInventario = {
  id: string;
  nombre: string;
  slug: string;
  pais: string | null;
  estado: string;
  publicados: number;
  borradores: number;
  agotados: number;
  sinFoto: number;
  /** Cuándo se leyó su catálogo por última vez (si publica uno). */
  sincronizadoEnMs: number | null;
};

const PAIS: Record<string, "US" | "CL" | "CO"> = {
  US: "US",
  CL: "CL",
  CO: "CO",
};

/** Las tres plazas donde vende Mercatren directo, con sus once números. */
export async function inventarioPorPlaza(): Promise<PlazaInventario[]> {
  const db = getDb();
  const salida: PlazaInventario[] = [];

  for (const mercado of Object.values(PAIS)) {
    const [f] = await db
      .select({
        publicados: sql<number>`sum(case when ${productos.estado} = 'publicado' then 1 else 0 end)`,
        enRevision: sql<number>`sum(case when ${productos.estado} = 'en_revision' then 1 else 0 end)`,
        borradores: sql<number>`sum(case when ${productos.estado} = 'borrador' then 1 else 0 end)`,
        agotados: sql<number>`sum(case when ${productos.controlaExistencias} = 1 and ${productos.existencias} <= 0 then 1 else 0 end)`,
        conFleteReal: sql<number>`sum(case when ${enviosProducto.origen} is not null and ${enviosProducto.origen} <> 'estimado' then 1 else 0 end)`,
        conFleteEstimado: sql<number>`sum(case when ${enviosProducto.origen} = 'estimado' then 1 else 0 end)`,
        sinFlete: sql<number>`sum(case when ${enviosProducto.productoId} is null then 1 else 0 end)`,
        sinCostoBase: sql<number>`sum(case when coalesce(${productos.precioBaseCentavos}, 0) <= 0 then 1 else 0 end)`,
        sinTraducir: sql<number>`sum(case when ${productos.tituloEn} is not null and ${productos.tituloEs} = ${productos.tituloEn} then 1 else 0 end)`,
        sinDescripcion: sql<number>`sum(case when coalesce(trim(${productos.descripcionEs}), '') = '' then 1 else 0 end)`,
      })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
      .where(eq(tiendas.paisOrigen, mercado));

    const [g] = await db
      .select({ n: sql<number>`count(*)` })
      .from(imagenesProducto)
      .innerJoin(productos, eq(productos.id, imagenesProducto.productoId))
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .where(
        and(
          eq(tiendas.paisOrigen, mercado),
          sql`${imagenesProducto.url} is not null`,
        ),
      );

    salida.push({
      mercado,
      publicados: Number(f?.publicados ?? 0),
      enRevision: Number(f?.enRevision ?? 0),
      borradores: Number(f?.borradores ?? 0),
      agotados: Number(f?.agotados ?? 0),
      conFleteReal: Number(f?.conFleteReal ?? 0),
      conFleteEstimado: Number(f?.conFleteEstimado ?? 0),
      sinFlete: Number(f?.sinFlete ?? 0),
      sinCostoBase: Number(f?.sinCostoBase ?? 0),
      sinTraducir: Number(f?.sinTraducir ?? 0),
      sinDescripcion: Number(f?.sinDescripcion ?? 0),
      fotosDeOrigen: Number(g?.n ?? 0),
    });
  }

  return salida;
}

/**
 * Las tiendas de comercios (todo lo que NO es catálogo de CJ), con lo suyo.
 * Es lo que el dueño pidió saber de Venezuela: cuántas hay y qué tiene cada
 * una a la venta.
 */
export async function inventarioPorTienda(
  limite = 60,
): Promise<TiendaInventario[]> {
  const filas = await getDb()
    .select({
      id: tiendas.id,
      nombre: tiendas.nombre,
      slug: tiendas.slug,
      pais: tiendas.paisOrigen,
      estado: tiendas.estado,
      publicados: sql<number>`sum(case when ${productos.estado} = 'publicado' then 1 else 0 end)`,
      borradores: sql<number>`sum(case when ${productos.estado} = 'borrador' then 1 else 0 end)`,
      agotados: sql<number>`sum(case when ${productos.controlaExistencias} = 1 and ${productos.existencias} <= 0 then 1 else 0 end)`,
      sinFoto: sql<number>`sum(case when not exists (select 1 from imagenes_producto ip where ip.producto_id = ${productos.id}) then 1 else 0 end)`,
      sincronizadoEn: sql<
        number | null
      >`(select max(${fuentesCatalogo.ultimaSincronizacion}) from ${fuentesCatalogo} where ${fuentesCatalogo.tiendaId} = ${tiendas.id})`,
    })
    .from(tiendas)
    .leftJoin(
      productos,
      and(
        eq(productos.tiendaId, tiendas.id),
        ne(productos.fuenteId, FUENTE_CJ),
      ),
    )
    .groupBy(tiendas.id)
    .orderBy(sql`6 desc`)
    .limit(limite);

  return filas
    .filter((f) => Number(f.publicados) + Number(f.borradores) > 0)
    .map((f) => ({
      id: f.id,
      nombre: f.nombre,
      slug: f.slug,
      pais: f.pais,
      estado: f.estado,
      publicados: Number(f.publicados ?? 0),
      borradores: Number(f.borradores ?? 0),
      agotados: Number(f.agotados ?? 0),
      sinFoto: Number(f.sinFoto ?? 0),
      sincronizadoEnMs: f.sincronizadoEn
        ? Number(f.sincronizadoEn) * 1000
        : null,
    }));
}

/**
 * ══ EL TABLERO NO HACE ESTA CUENTA: LA LEE (3 sep 2026) ══
 *
 * `inventarioPorPlaza()` recorre las ~55.000 fichas tres veces, y eso en el
 * borde es caro. Puesto en el Tablero —la primera pantalla que abre
 * cualquiera del equipo— agotaba la petición, y cuando eso pasa la
 * comprobación de sesión del panel se cae y **devuelve a la persona a la
 * pantalla de entrar**: se entra bien, y el panel te saca. Le pasó al dueño
 * a los cuarenta minutos de publicarlo, y no pudo entrar a su propio panel.
 *
 * El vigilante ya hace esta cuenta cada 20 minutos y la guarda entera en su
 * latido. El Tablero lee esa fila —una sola, por id— y dice de cuándo es.
 * Un número de hace un rato es infinitamente mejor que un panel que expulsa.
 */
import type { PlazaVista } from "@/lib/vigilante/reglas";

export type InventarioGuardado = {
  /* Lo que el VIGILANTE guarda en su latido es `PlazaVista`, no el
     inventario largo del panel: son dos medidas distintas y confundirlas
     hacía que el canario pidiera campos que en el JSON no están. */
  plazas: PlazaVista[];
  /** Hace cuántos minutos se midió, para poder decirlo en pantalla. */
  haceMinutos: number;
};

export async function inventarioDelUltimoLatido(): Promise<InventarioGuardado | null> {
  const { latidosVigilante } = await import("@/lib/db/schema");
  const { desc } = await import("drizzle-orm");
  const [fila] = await getDb()
    .select({
      hechos: latidosVigilante.hechos,
      corridoEn: latidosVigilante.corridoEn,
    })
    .from(latidosVigilante)
    .orderBy(desc(latidosVigilante.corridoEn))
    .limit(1);
  if (!fila) return null;
  try {
    const hechos = JSON.parse(fila.hechos) as { plazas?: PlazaVista[] };
    const plazas = Array.isArray(hechos.plazas) ? hechos.plazas : [];
    if (plazas.length === 0) return null;
    return {
      plazas,
      haceMinutos: Math.max(
        0,
        Math.round((Date.now() - fila.corridoEn.getTime()) / 60_000),
      ),
    };
  } catch {
    return null;
  }
}
