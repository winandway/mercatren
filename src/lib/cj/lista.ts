/**
 * LEER LO QUE MANDA CJ: DÓNDE ESTÁN LOS PRODUCTOS, Y CÓMO SE ENTIENDEN.
 *
 * ══ POR QUÉ ESTO VIVE APARTE DE `catalogo.ts` ══
 *
 * Porque `catalogo.ts` es `server-only` —lleva la llave de CJ— y un archivo
 * `server-only` no se puede probar. La primera versión resolvió eso copiando la
 * función dentro de la prueba, y esa copia es justo cómo se esconde un fallo:
 * la prueba pasaba en verde mientras el código que corría de verdad devolvía
 * cero productos para cualquier búsqueda.
 *
 * Aquí no hay llaves ni red: solo cómo se lee la respuesta. Se prueba de verdad.
 */

/** Un producto tal como lo manda CJ, con los nombres que usa su API. */
export type FilaCj = {
  /** `listV2` manda `id`; el endpoint viejo manda `pid`. */
  id?: string;
  pid?: string;
  nameEn?: string;
  sku?: string;
  bigImage?: string;
  sellPrice?: number | string;
  nowPrice?: number | string;
  threeCategoryName?: string;
  twoCategoryName?: string;
  oneCategoryName?: string;
  warehouseInventoryNum?: number | string;
  totalVerifiedInventory?: number | string;
};

/**
 * ══ LA LISTA NO VIENE DONDE PARECE, Y ESE ERA EL FALLO ══
 *
 * `listV2` **no** devuelve `data.list`. Devuelve:
 *
 *   data.content[].productList[]
 *
 * Un nivel de más: `content` es un arreglo de bloques, y cada bloque trae su
 * `productList` junto con las categorías relacionadas y el término buscado.
 *
 * Yo leía `data.list`, que en ese endpoint no existe. Salía `undefined`, se
 * convertía en una lista vacía, y **cualquier búsqueda daba cero productos** —
 * sin ningún error, porque la llamada a CJ sí había ido bien. La pantalla decía
 * «nada con existencias» y el fallo parecía ser de la palabra escrita.
 *
 * Comprobado contra la documentación de CJ, no supuesto.
 *
 * El endpoint viejo (`/product/list`, el de la sonda de Configuración) sí
 * devuelve `data.list`. Se leen los dos sitios porque los dos existen de verdad
 * en su API, y así la sonda y el buscador comparten este parseo en vez de tener
 * cada uno el suyo.
 */
export type RespuestaLista = {
  content?: Array<{ productList?: FilaCj[] }>;
  /** La forma del endpoint viejo `/product/list`. */
  list?: FilaCj[];
  totalRecords?: number;
  totalPages?: number;
};

export function filasDeCj(datos: RespuestaLista | undefined): FilaCj[] {
  const bloques = Array.isArray(datos?.content) ? datos.content : [];
  const deBloques = bloques.flatMap((b) =>
    Array.isArray(b?.productList) ? b.productList : [],
  );

  if (deBloques.length > 0) return deBloques;

  return Array.isArray(datos?.list) ? datos.list : [];
}

/**
 * Un precio de CJ llega en dólares con decimales y a veces como texto.
 *
 * `toPrecision` antes de multiplicar: `45.90 * 100` da 4589.999999999999 en
 * coma flotante, y ese centavo perdido aparece después en una factura que no
 * cuadra. Es el mismo cuidado que ya se tiene en el cobro por enlace.
 *
 * ══ Y CJ MANDA RANGOS, NO SIEMPRE UN NÚMERO ══
 *
 * Un producto con variantes —tallas, colores— llega con el precio así:
 * `"12.50 -- 15.30"`. Pasarlo por `Number()` da NaN, ese NaN se convertía en
 * cero, y el cero hacía que el producto se descartara por «sin precio».
 *
 * Se toma el número más bajo del rango, que es lo que de verdad cuesta la
 * variante más barata.
 */
export function aCentavos(valor: number | string | undefined): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) && valor > 0
      ? Math.round(Number((valor * 100).toPrecision(12)))
      : 0;
  }

  if (!valor) return 0;

  const numeros = String(valor)
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!numeros?.length) return 0;

  return Math.round(Number((Math.min(...numeros) * 100).toPrecision(12)));
}

function aEntero(valor: number | string | undefined): number | null {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = typeof valor === "string" ? Number(valor) : valor;
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

/**
 * Las existencias, o `null` si CJ no las mandó.
 *
 * Se prefiere el inventario verificado, que es el que de verdad está en el
 * almacén. Si ninguno de los dos viene, no se sabe — y **no saber no es cero**.
 * Tratar la ausencia como cero descartaba productos buenos en silencio.
 */
export function existenciasDe(f: FilaCj): number | null {
  const verificado = aEntero(f.totalVerifiedInventory);
  const almacen = aEntero(f.warehouseInventoryNum);
  if (verificado === null && almacen === null) return null;
  return Math.max(verificado ?? 0, almacen ?? 0);
}
