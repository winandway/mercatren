import "server-only";

import {
  and,
  eq,
  gt,
  inArray,
  isNull,
  like,
  lte,
  notInArray,
  notLike,
  or,
  sql,
} from "drizzle-orm";

import { FUENTE_CJ } from "@/lib/cj/constantes";
import { REGIONALES } from "@/lib/cj/riesgo";
import { getDb } from "@/lib/db";
import { enviosProducto, productos, tiendas } from "@/lib/db/schema";

/**
 * NADA DE CJ SE VENDE SIN PASAR EL ÚLTIMO FILTRO (2 sep 2026).
 *
 * Decisión del dueño, con sus palabras: «hasta que no pase el último filtro
 * —precio correcto, tallas correctas, cálculo del envío correcto— no debería
 * ponerse a la venta». El último filtro es una fila de envío COTIZADA por CJ
 * con un transporte nacional, un costo base conocido y stock de hoy.
 *
 * ══ EL BARRIDO ══
 *
 * 1. **Retira** (a `en_revision`) lo publicado de CJ que no cumpla: sin fila
 *    de envío, envío estimado, transporte regional (los que ya costaron una
 *    venta a pérdida) o sin costo base.
 * 2. **Publica** lo que está en revisión y ya cumple: envío cotizado con
 *    transporte nacional, costo base y stock.
 *
 * Es idempotente: se corre cada vuelta del reloj y cada vez que el
 * vigilante mira. Los comercios (Venezuela) no pasan por aquí: esto es
 * solo para lo que surte CJ.
 */
const PLAZAS = ["US", "CL", "CO"];

function transporteRegional() {
  return or(
    ...REGIONALES.map((r) =>
      like(sql`lower(${enviosProducto.transporte})`, `%${r}%`),
    ),
  );
}

function cambios(resultado: unknown): number {
  const meta = (resultado as { meta?: { changes?: number } } | null)?.meta;
  return Number(meta?.changes ?? 0);
}

export async function barrerNoVerificados(): Promise<{
  retirados: number;
  publicados: number;
}> {
  const db = getDb();
  const ahora = new Date();

  const tiendasDePlaza = db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(inArray(tiendas.paisOrigen, PLAZAS));
  const conEnvio = db
    .select({ id: enviosProducto.productoId })
    .from(enviosProducto);
  const conEnvioMalo = db
    .select({ id: enviosProducto.productoId })
    .from(enviosProducto)
    .where(or(eq(enviosProducto.origen, "estimado"), transporteRegional()));

  const retiro = await db
    .update(productos)
    .set({ estado: "en_revision", actualizadoEn: ahora })
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        eq(productos.estado, "publicado"),
        inArray(productos.tiendaId, tiendasDePlaza),
        or(
          notInArray(productos.id, conEnvio),
          inArray(productos.id, conEnvioMalo),
          isNull(productos.precioBaseCentavos),
          lte(productos.precioBaseCentavos, 0),
        ),
      ),
    );

  const conEnvioBueno = db
    .select({ id: enviosProducto.productoId })
    .from(enviosProducto)
    .where(
      and(
        eq(enviosProducto.origen, "cotizado"),
        gt(enviosProducto.costoCentavos, 0),
        or(
          isNull(enviosProducto.transporte),
          and(
            ...REGIONALES.map((r) =>
              notLike(sql`lower(${enviosProducto.transporte})`, `%${r}%`),
            ),
          ),
        ),
      ),
    );

  const publicacion = await db
    .update(productos)
    .set({ estado: "publicado", actualizadoEn: ahora })
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        eq(productos.estado, "en_revision"),
        inArray(productos.tiendaId, tiendasDePlaza),
        gt(productos.existencias, 0),
        gt(productos.precioBaseCentavos, 0),
        inArray(productos.id, conEnvioBueno),
      ),
    );

  return { retirados: cambios(retiro), publicados: cambios(publicacion) };
}

/** Cuántos publicados de CJ NO cumplen hoy (lo que el barrido retiraría). */
export async function contarPublicadosSinVerificar(): Promise<number> {
  const db = getDb();
  const tiendasDePlaza = db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(inArray(tiendas.paisOrigen, PLAZAS));
  const conEnvio = db
    .select({ id: enviosProducto.productoId })
    .from(enviosProducto);
  const conEnvioMalo = db
    .select({ id: enviosProducto.productoId })
    .from(enviosProducto)
    .where(or(eq(enviosProducto.origen, "estimado"), transporteRegional()));
  const [fila] = await db
    .select({ n: sql<number>`count(*)` })
    .from(productos)
    .where(
      and(
        eq(productos.fuenteId, FUENTE_CJ),
        eq(productos.estado, "publicado"),
        inArray(productos.tiendaId, tiendasDePlaza),
        or(
          notInArray(productos.id, conEnvio),
          inArray(productos.id, conEnvioMalo),
          isNull(productos.precioBaseCentavos),
          lte(productos.precioBaseCentavos, 0),
        ),
      ),
    )
    .catch(() => []);
  return Number(fila?.n ?? 0);
}
