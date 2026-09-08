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
import {
  enviosProducto,
  productos,
  tiendas,
  variantesProducto,
} from "@/lib/db/schema";

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

  /**
   * ══ SI NINGUNA TALLA SE PUEDE COMPRAR, EL PRODUCTO NO ESTÁ A LA VENTA ══
   *
   * Medido el 8 sep 2026: **2.642 fichas publicadas** —863 en Colombia y
   * 1.779 en Estados Unidos— decían «Quedan 2» arriba y «Sin existencias»
   * en TODAS sus tallas. El stock del producto se refrescaba; el de cada
   * variante se guardaba en cero (ya corregido en `cj/guardar.ts`), y la
   * ficha decide con el de la variante.
   *
   * El total del producto no basta como filtro: hay que preguntar si queda
   * ALGUNA combinación que una persona pueda meter al carrito. Un producto
   * sin variantes cargadas no entra aquí — ese se rige por su propio stock.
   */
  const conVariantes = db
    .select({ id: variantesProducto.productoId })
    .from(variantesProducto);
  const conVarianteComprable = db
    .select({ id: variantesProducto.productoId })
    .from(variantesProducto)
    .where(gt(variantesProducto.existencias, 0));

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
          and(
            inArray(productos.id, conVariantes),
            notInArray(productos.id, conVarianteComprable),
          ),
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
        /* Vuelve solo si hay dónde comprar: o no tiene tallas, o alguna
           tiene existencia. Sin esto, el barrido lo retiraría y lo
           republicaría en la misma vuelta, para siempre. */
        or(
          notInArray(productos.id, conVariantes),
          inArray(productos.id, conVarianteComprable),
        ),
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

  /**
   * ══ SI NINGUNA TALLA SE PUEDE COMPRAR, EL PRODUCTO NO ESTÁ A LA VENTA ══
   *
   * Medido el 8 sep 2026: **2.642 fichas publicadas** —863 en Colombia y
   * 1.779 en Estados Unidos— decían «Quedan 2» arriba y «Sin existencias»
   * en TODAS sus tallas. El stock del producto se refrescaba; el de cada
   * variante se guardaba en cero (ya corregido en `cj/guardar.ts`), y la
   * ficha decide con el de la variante.
   *
   * El total del producto no basta como filtro: hay que preguntar si queda
   * ALGUNA combinación que una persona pueda meter al carrito. Un producto
   * sin variantes cargadas no entra aquí — ese se rige por su propio stock.
   */
  const conVariantes = db
    .select({ id: variantesProducto.productoId })
    .from(variantesProducto);
  const conVarianteComprable = db
    .select({ id: variantesProducto.productoId })
    .from(variantesProducto)
    .where(gt(variantesProducto.existencias, 0));
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
