import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { medidasProducto, productos, variantesProducto } from "@/lib/db/schema";
import { precioDeVariante } from "@/lib/productos/heredar";

/**
 * LAS VARIANTES Y LAS MEDIDAS DE UN PRODUCTO.
 *
 * Dos cosas que se piden juntas pero que NO son lo mismo, y confundirlas es el
 * error clásico:
 *
 *   · Una VARIANTE se elige y cambia lo que se compra. Talla M azul y talla M
 *     roja son dos cosas distintas en el depósito, con su precio y su stock.
 *   · Una MEDIDA se consulta, no se elige. El peso de un producto no crea otro
 *     producto: es ficha técnica.
 *
 * Un producto sin variantes funciona igual que siempre — la lista viene vacía
 * y la ficha se ve como se ha visto hasta hoy. Los 689 del catálogo actual no
 * tienen ninguna, y un tubo de PVC no tiene talla.
 */
export type VarianteVista = {
  id: string;
  talla: string | null;
  color: string | null;
  colorHex: string | null;
  sku: string | null;
  /** Lo que el proveedor cobra por esta variante. */
  precioBaseCentavos: number;
  /** Lo que se publica, con el ajuste ya aplicado. */
  precioCentavos: number;
  existencias: number;
  orden: number;
};

export type MedidasVista = {
  pesoGramos: number | null;
  largoMm: number | null;
  anchoMm: number | null;
  altoMm: number | null;
  materialEs: string | null;
  materialEn: string | null;
};

/**
 * Las variantes activas de un producto, en el orden que puso el comercio.
 *
 * SE ORDENAN A MANO, no alfabéticamente: S, M, L, XL alfabéticamente sale
 * "L, M, S, XL", que no le sirve a nadie. Por eso existe la columna `orden`.
 */
export async function variantesDe(
  productoId: string,
): Promise<VarianteVista[]> {
  try {
    const db = getDb();
    const filas = await db
      .select({
        id: variantesProducto.id,
        talla: variantesProducto.talla,
        color: variantesProducto.color,
        colorHex: variantesProducto.colorHex,
        sku: variantesProducto.sku,
        precioBaseCentavos: variantesProducto.precioBaseCentavos,
        precioCentavos: variantesProducto.precioCentavos,
        existencias: variantesProducto.existencias,
        orden: variantesProducto.orden,
        activo: variantesProducto.activo,
        /* El precio del PADRE, para la herencia: una variante guardada en
           cero vale lo del producto, no cero (31 ago 2026 — el router a
           $0.00 con un cliente delante). */
        precioDelProducto: productos.precioCentavos,
      })
      .from(variantesProducto)
      .innerJoin(productos, eq(productos.id, variantesProducto.productoId))
      .where(eq(variantesProducto.productoId, productoId))
      .orderBy(asc(variantesProducto.orden), asc(variantesProducto.id));

    return filas
      .filter((v) => v.activo)
      .map((v) => ({
        id: v.id,
        talla: v.talla,
        color: v.color,
        colorHex: v.colorHex,
        sku: v.sku,
        precioBaseCentavos: v.precioBaseCentavos,
        precioCentavos: precioDeVariante(v.precioCentavos, v.precioDelProducto),
        existencias: v.existencias,
        orden: v.orden,
      }));
  } catch {
    /* Una ficha sin variantes es peor que una con ellas, pero infinitamente
       mejor que una pantalla caída: se devuelve vacío y el producto se vende
       como siempre. */
    return [];
  }
}

/** Las medidas de un producto, o null si el comercio no cargó ninguna. */
export async function medidasDe(
  productoId: string,
): Promise<MedidasVista | null> {
  try {
    const db = getDb();
    const [fila] = await db
      .select({
        pesoGramos: medidasProducto.pesoGramos,
        largoMm: medidasProducto.largoMm,
        anchoMm: medidasProducto.anchoMm,
        altoMm: medidasProducto.altoMm,
        materialEs: medidasProducto.materialEs,
        materialEn: medidasProducto.materialEn,
      })
      .from(medidasProducto)
      .where(eq(medidasProducto.productoId, productoId))
      .limit(1);

    if (!fila) return null;
    // Una ficha técnica con todos los campos vacíos es una sección vacía en
    // pantalla: mejor decir que no hay medidas.
    const algo = Object.values(fila).some((v) => v !== null && v !== "");
    return algo ? fila : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Lo que se deriva de las variantes para pintarlas                           */
/* -------------------------------------------------------------------------- */

/** Las tallas distintas que hay, en el orden en que aparecen. */
export function tallasDe(variantes: VarianteVista[]): string[] {
  return [
    ...new Set(variantes.map((v) => v.talla).filter(Boolean)),
  ] as string[];
}

/** Los colores distintos que hay, con su muestra si la tiene. */
export function coloresDe(
  variantes: VarianteVista[],
): { nombre: string; hex: string | null }[] {
  const vistos = new Map<string, string | null>();
  for (const v of variantes) {
    if (v.color && !vistos.has(v.color)) vistos.set(v.color, v.colorHex);
  }
  return [...vistos].map(([nombre, hex]) => ({ nombre, hex }));
}

/**
 * La variante que corresponde a una talla y un color elegidos.
 *
 * Devuelve null cuando la combinación no existe —talla XL solo en negro, por
 * ejemplo—, y eso es información útil: la ficha desactiva esa opción en vez
 * de dejar comprar algo que no hay.
 */
export function varianteDe(
  variantes: VarianteVista[],
  talla: string | null,
  color: string | null,
): VarianteVista | null {
  return (
    variantes.find(
      (v) =>
        (talla === null || v.talla === talla) &&
        (color === null || v.color === color),
    ) ?? null
  );
}

/**
 * El precio desde el que arranca un producto con variantes.
 *
 * En la tarjeta del catálogo no se puede enseñar el precio de una variante
 * cualquiera: si la talla S vale $10 y la XXL $18, poner $18 espanta y poner
 * $10 engaña. Se enseña el más barato, que es lo que hacen las tiendas
 * grandes, y la ficha ya aclara el de cada talla.
 */
export function precioDesde(variantes: VarianteVista[]): number | null {
  const conStock = variantes.filter((v) => v.precioCentavos > 0);
  if (conStock.length === 0) return null;
  return Math.min(...conStock.map((v) => v.precioCentavos));
}
