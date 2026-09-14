/**
 * ══ EL STOCK DE FÁBRICA CUENTA EN CHINA (14 sep 2026) ══
 *
 * CJ lleva dos cuentas: lo que tiene en SU bodega (`cjInventoryNum`) y lo
 * que tiene la fábrica del proveedor (`factoryInventoryNum`). En su almacén
 * de EE. UU. solo existe la primera. En China, la mayoría de la mercancía
 * es de fábrica: CJ la compra al proveedor cuando entra el pedido, y eso es
 * exactamente el modelo con el que se surten Chile y Colombia.
 *
 * `/product/variant/query` solo trae la primera (`inventoryNum`). Por eso
 * el limpiador de gorras que pidió Richard —9.953 unidades en fábrica—
 * salía «sin existencias», y por eso hay fichas de Chile y Colombia que
 * nunca pasan de revisión: no es que no haya, es que no se miraba donde
 * estaba. `/product/stock/queryByVid` trae las dos cuentas por almacén.
 *
 * Esta función es pura: mezcla las variantes con lo que dijo esa segunda
 * consulta. Cuenta el TOTAL (bodega + fábrica) solo en el almacén pedido.
 */
export type FilaDeStock = {
  vid?: string;
  countryCode?: string;
  totalInventoryNum?: number | string | null;
  cjInventoryNum?: number | string | null;
  factoryInventoryNum?: number | string | null;
};

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/** El total de una variante en ese almacén: bodega de CJ + fábrica. */
export function stockTotalEn(
  filas: ReadonlyArray<FilaDeStock>,
  almacen: string,
): number {
  return filas
    .filter(
      (f) => (f.countryCode ?? "").toUpperCase() === almacen.toUpperCase(),
    )
    .reduce((t, f) => {
      const total = n(f.totalInventoryNum);
      return (
        t + (total > 0 ? total : n(f.cjInventoryNum) + n(f.factoryInventoryNum))
      );
    }, 0);
}

/**
 * Devuelve las variantes con `inventoryNum` completado desde la consulta de
 * stock. Solo pisa el cero: si `variant/query` ya trajo un número, se
 * respeta (es el más fresco que tiene CJ).
 */
export function mezclarStockDeFabrica<
  V extends { vid?: string; inventoryNum?: unknown },
>(variantes: ReadonlyArray<V>, porVid: ReadonlyMap<string, number>): V[] {
  return variantes.map((v) => {
    const propio = n(v.inventoryNum);
    if (propio > 0 || !v.vid) return v;
    const fabrica = porVid.get(v.vid) ?? 0;
    return fabrica > 0 ? { ...v, inventoryNum: fabrica } : v;
  });
}

/** ¿Hace falta preguntar? Solo en China y solo si TODAS dicen cero. */
export function haceFaltaMirarLaFabrica(
  variantes: ReadonlyArray<{ inventoryNum?: unknown }>,
  almacen: string,
): boolean {
  if (almacen.toUpperCase() !== "CN") return false;
  if (variantes.length === 0) return false;
  return variantes.every((v) => n(v.inventoryNum) === 0);
}

/** Cuántas variantes se consultan como máximo: cada una cuesta una llamada. */
export const MAX_VARIANTES_A_MIRAR = 6;
