import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { cjConfigurado } from "@/lib/cj/cliente";
import { llamarCjConRitmo } from "@/lib/cj/ritmo";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import { stockDeVariante } from "@/lib/cj/masivo";
import { almacenDeEntrega } from "@/lib/cj/plazas";
import { variantesDeCj } from "@/lib/cj/variantes";
import { getDb } from "@/lib/db";
import { productos, tiendas, variantesProducto } from "@/lib/db/schema";

/**
 * EL STOCK DE CJ, PREGUNTADO A CJ (2 sep 2026).
 *
 * La existencia que guardamos es la del día que se importó el producto, y
 * CJ vende esa misma mercancía a miles de tiendas: se agota sin avisar. La
 * MT-000011 se cobró con «15 en almacén» aquí y cero en los almacenes de
 * EE. UU. allá. Dos usos:
 *
 *  · `hayExistenciaEnCj` — en el checkout, ANTES de cobrar.
 *  · `refrescarExistenciasCj` — desde el reloj, por tandas, para que lo
 *    agotado allá se vea agotado aquí sin que nadie compre primero.
 *
 * `/product/variant/query?countryCode=US` devuelve SOLO las variantes con
 * inventario en ese país (doc de CJ). Es la señal más barata que existe:
 * una llamada por producto.
 */

type VarianteConStock = {
  vid?: string;
  variantSku?: string;
  variantStock?: number | string;
  stockNum?: number | string;
  /** El nombre que de verdad usa `/product/variant/query` (medido 8 sep). */
  inventoryNum?: number | string;
};

/* La regla vive en `masivo.ts` (pura): el afinado de la importación masiva
   cuenta el stock igual que aquí, y dos copias se separan al primer arreglo. */
const stockDe = (v: VarianteConStock): number => stockDeVariante(v);

async function variantesConStockEn(
  pid: string,
  almacen: "US" | "CN",
): Promise<VarianteConStock[] | null> {
  const r = await llamarCjConRitmo<unknown>(
    `/product/variant/query?pid=${encodeURIComponent(pid)}&countryCode=${almacen}`,
  );
  if (!r.ok) return null;
  return variantesDeCj(r.datos) as VarianteConStock[];
}

/**
 * ¿Hay stock en EE. UU. para vender `cantidad` de este producto (y de esta
 * talla, si se eligió)? `null` = CJ no contestó: no se bloquea la venta por
 * una caída ajena; el candado de margen y el panel lo atrapan después.
 */
export async function hayExistenciaEnCj(
  pid: string | null | undefined,
  skuVariante: string | null,
  cantidad: number,
  /** El almacén del que sale ESA plaza: EE. UU. para el .com, China para CL/CO. */
  almacen: "US" | "CN" = "US",
): Promise<boolean | null> {
  if (!pid || !cjConfigurado()) return null;
  const variantes = await variantesConStockEn(pid, almacen);
  if (variantes === null) return null;
  const candidatas = skuVariante
    ? variantes.filter(
        (v) => (v.variantSku ?? "").trim() === skuVariante.trim(),
      )
    : variantes;
  return candidatas.some((v) => stockDe(v) >= cantidad);
}

/**
 * Una tanda del refresco: los productos de CJ publicados en la vitrina de
 * EE. UU., del más viejo sin mirar al más nuevo. Cada uno recibe la
 * existencia que CJ dice hoy — cero si no queda ninguna talla allá.
 */
export async function refrescarExistenciasCj(limite = 25): Promise<{
  mirados: number;
  agotados: number;
  fallidos: number;
}> {
  if (!cjConfigurado()) return { mirados: 0, agotados: 0, fallidos: 0 };
  const db = getDb();
  /* Las tres plazas: cada producto se mira en el almacén del que sale su
     tienda (EE. UU. o China). */
  const cola = await db
    .select({
      id: productos.id,
      pid: productos.externoId,
      pais: tiendas.paisOrigen,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        /* También lo que está en revisión: cuando vuelva a tener stock, el
           barrido del vigilante lo publica. */
        inArray(productos.estado, ["publicado", "en_revision"]),
        inArray(tiendas.paisOrigen, ["US", "CL", "CO"]),
      ),
    )
    /* Lo PUBLICADO primero (3 sep 2026): es lo que se puede comprar, y
       con cuarenta mil fichas en revisión el turno de las doscientas a la
       venta llegaba cada varios días. Lo que está en revisión lo refresca
       el afinado al publicarlo. */
    .orderBy(
      sql`case when ${productos.estado} = 'publicado' then 0 else 1 end`,
      sql`${productos.sincronizadoEn} IS NOT NULL`,
      asc(productos.sincronizadoEn),
    )
    .limit(limite)
    .catch(() => []);

  let agotados = 0;
  let fallidos = 0;
  for (const p of cola) {
    if (!p.pid) continue;
    const variantes = await variantesConStockEn(
      p.pid,
      almacenDeEntrega(p.pais ?? "US"),
    );
    if (variantes === null) {
      fallidos += 1;
      continue;
    }
    const total = variantes.reduce((t, v) => t + stockDe(v), 0);
    if (total === 0) agotados += 1;
    await db
      .update(productos)
      .set({
        existencias: total,
        controlaExistencias: true,
        sincronizadoEn: new Date(),
        actualizadoEn: new Date(),
      })
      .where(eq(productos.id, p.id))
      .catch(() => undefined);

    /**
     * ══ Y CADA TALLA CON LO SUYO (8 sep 2026) ══
     *
     * Hasta hoy este refresco actualizaba el total del producto y TIRABA las
     * variantes que tenía en la mano. La ficha decide si una talla se puede
     * comprar por el stock de la VARIANTE, así que el producto decía «Quedan
     * 2» y cada talla «Sin existencias»: 2.642 fichas así en producción.
     *
     * CJ devuelve SOLO las variantes con inventario en ese país (su doc),
     * así que primero se ponen todas a cero y después se escribe lo que
     * vino, por SKU. Una talla que allá se agotó queda en cero de verdad.
     */
    await db
      .update(variantesProducto)
      .set({ existencias: 0, actualizadoEn: new Date() })
      .where(eq(variantesProducto.productoId, p.id))
      .catch(() => undefined);
    for (const v of variantes) {
      const sku = v.variantSku?.trim();
      if (!sku) continue;
      await db
        .update(variantesProducto)
        .set({ existencias: stockDe(v), actualizadoEn: new Date() })
        .where(
          and(
            eq(variantesProducto.productoId, p.id),
            eq(variantesProducto.sku, sku),
          ),
        )
        .catch(() => undefined);
    }
  }
  return { mirados: cola.length, agotados, fallidos };
}
