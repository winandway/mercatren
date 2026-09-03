import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { cjConfigurado } from "@/lib/cj/cliente";
import { llamarCjConRitmo } from "@/lib/cj/ritmo";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import { stockDeVariante } from "@/lib/cj/masivo";
import { almacenDeEntrega } from "@/lib/cj/plazas";
import { variantesDeCj } from "@/lib/cj/variantes";
import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";

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
    .orderBy(
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
  }
  return { mirados: cola.length, agotados, fallidos };
}
