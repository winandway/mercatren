/**
 * UN CÓDIGO = UN PRODUCTO, aunque el comercio lo tenga en varios galpones.
 *
 * ══ DE DÓNDE SALE ESTO (8 ago 2026) ══
 *
 * El sistema de Ferremateriales Bley manda UNA LÍNEA POR SUCURSAL: el mismo
 * tubo aparece dos veces, una con las existencias de El Vigía y otra con las de
 * Caracas, cada una con su propio identificador. De 757 líneas, 690 son
 * productos distintos.
 *
 * Sin agrupar, el comprador ve el mismo producto repetido con dos cantidades
 * distintas y no entiende por qué. **Eso ya está pasando**: de los 689
 * productos cargados a mano, solo 638 son códigos distintos — hoy hay 51
 * fichas duplicadas publicadas.
 *
 * ══ Y HAY UNA RAZÓN MÁS FUERTE QUE LA ESTÉTICA ══
 *
 * Las ventas se van a contar mirando cuánto BAJARON las existencias entre una
 * lectura y la siguiente. Si cada sucursal fuera un producto aparte, mover mil
 * unidades de un galpón al otro haría que una línea bajara mil — y como las
 * subidas no se cuentan, la del otro galpón no lo compensaría: mil ventas
 * inventadas. **Sumadas, un traslado da exactamente cero.**
 *
 * ══ LAS DOS REGLAS QUE NO SON OBVIAS ══
 *
 * 1. **El identificador canónico NO puede depender de las existencias.** Si se
 *    eligiera "la línea que más tiene", cambiaría de sucursal en cuanto se
 *    venda algo, y Mercatren dejaría de reconocer el producto: lo duplicaría.
 *    Se elige por orden alfabético del identificador, que no cambia nunca — o
 *    el que Mercatren ya tenga guardado, que manda sobre todo lo demás.
 *
 * 2. **Dos líneas de la MISMA sucursal no se suman.** Eso no es más mercancía:
 *    es el mismo producto cargado dos veces por error (hay 14 así, y el
 *    comercio los está limpiando). Sumarlas diría que hay el doble de lo que
 *    hay, y se vendería algo que no está. Se toma la que más tiene.
 */

export type ProductoDeOrigen = {
  id?: string;
  sku?: string | null;
  slug?: string | null;
  title_es?: string | null;
  title_en?: string | null;
  description_es?: string | null;
  description_en?: string | null;
  category_id?: string | null;
  brand?: string | null;
  price?: number | null;
  compare_at_price?: number | null;
  stock?: number | null;
  unit?: string | null;
  weight_grams?: number | null;
  status?: string | null;
  featured?: boolean | null;
  /** De qué galpón son estas existencias. Opcional: no todos los comercios
   *  tienen más de uno, y quien no lo mande cae en un único grupo. */
  sucursal?: string | null;
  images?: { url?: string | null; alt?: string | null; position?: number }[];
};

export type ArchivoDeOrigen = {
  categories?: {
    id?: string;
    slug?: string;
    name_es?: string;
    name_en?: string | null;
  }[];
  products?: ProductoDeOrigen[];
};

export type ProductoAgrupado = {
  /** La línea de la que salen el título, el precio y las fotos. */
  principal: ProductoDeOrigen;
  /** La suma de los galpones. Reemplaza al `stock` de la línea principal. */
  existencias: number;
  /**
   * Todos los identificadores del grupo, en orden estable. El primero es el
   * candidato a canónico; quien llame puede preferir otro si ya lo tiene
   * guardado, y los demás son fichas viejas que hay que retirar.
   */
  ids: string[];
};

export type ResumenAgrupacion = {
  grupos: ProductoAgrupado[];
  /** Líneas que se fundieron con otra: 757 líneas → 690 productos. */
  fusionadas: number;
  /** Códigos cargados dos veces en el MISMO galpón. No se suman. */
  repetidasEnUnGalpon: number;
  /** Grupos donde dos galpones no coinciden en el precio. */
  preciosDiscrepantes: number;
};

/** El código por el que se agrupa. Sin código, el producto va solo. */
function clave(p: ProductoDeOrigen): string {
  const sku = p.sku?.trim().toUpperCase();
  return sku ? `sku:${sku}` : `id:${p.id ?? ""}`;
}

/** El galpón. Quien no lo declare cae todo en el mismo. */
function galpon(p: ProductoDeOrigen): string {
  return p.sucursal?.trim().toLowerCase() || "";
}

const cantidad = (p: ProductoDeOrigen) => {
  const n = Number(p.stock ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/**
 * De la lista cruda del comercio a un producto por código.
 *
 * No toca la base: es una función pura y por eso tiene pruebas propias.
 */
export function agruparPorCodigo(lista: ProductoDeOrigen[]): ResumenAgrupacion {
  const porClave = new Map<string, ProductoDeOrigen[]>();

  for (const p of lista) {
    // Sin identificador no hay forma de reconocerlo después: se descarta.
    if (!p.id?.trim()) continue;
    const k = clave(p);
    const grupo = porClave.get(k);
    if (grupo) grupo.push(p);
    else porClave.set(k, [p]);
  }

  const grupos: ProductoAgrupado[] = [];
  let fusionadas = 0;
  let repetidasEnUnGalpon = 0;
  let preciosDiscrepantes = 0;

  for (const lineas of porClave.values()) {
    /* UNA LÍNEA POR GALPÓN. Si el mismo código viene dos veces del mismo
       galpón es una carga duplicada, no más mercancía: se queda la que más
       tiene y la otra se ignora para la suma. */
    const porGalpon = new Map<string, ProductoDeOrigen>();
    for (const l of lineas) {
      const g = galpon(l);
      const previa = porGalpon.get(g);
      if (!previa) {
        porGalpon.set(g, l);
        continue;
      }
      repetidasEnUnGalpon++;
      if (cantidad(l) > cantidad(previa)) porGalpon.set(g, l);
    }

    const aportan = [...porGalpon.values()];
    const existencias = aportan.reduce((suma, l) => suma + cantidad(l), 0);

    /* EL CANÓNICO SE ELIGE POR IDENTIFICADOR, NUNCA POR EXISTENCIAS. Elegir
       "el que más tiene" lo haría saltar de galpón con cada venta, y Mercatren
       perdería el rastro del producto. El orden alfabético no cambia nunca. */
    const ids = [...new Set(lineas.map((l) => l.id!.trim()))].sort();
    const principal = lineas.find((l) => l.id!.trim() === ids[0]) ?? lineas[0]!;

    const precios = new Set(
      aportan
        .map((l) => l.price)
        .filter((v): v is number => typeof v === "number" && v > 0),
    );
    if (precios.size > 1) preciosDiscrepantes++;

    fusionadas += lineas.length - 1;
    grupos.push({ principal, existencias, ids });
  }

  return { grupos, fusionadas, repetidasEnUnGalpon, preciosDiscrepantes };
}
