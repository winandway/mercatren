/**
 * QUÉ VARIANTE SE LE COMPRA A CJ.
 *
 * ══ EL FALLO QUE ESTO ARREGLA (18 ago 2026) ══
 *
 * La primera compra de prueba —MT-000004, pagada de verdad— murió en CJ con
 * este mensaje:
 *
 *     No variants found for provided SKUs
 *
 * La causa, comprobada en su documentación y no supuesta: **CJ tiene dos SKU
 * distintos y nosotros mandábamos el que no era.**
 *
 * | Cuál            | Ejemplo               | De qué es              |
 * | --------------- | --------------------- | ---------------------- |
 * | `productSku`    | `CJJJJTJT05843`       | Del producto (el SPU)  |
 * | **`variantSku`**| `CJJJJTJT05843-Black` | **De la variante**     |
 *
 * El buscador guarda el del producto —es el que manda `listV2`— y
 * `createOrderV3` pide el de la **variante**: su documentación lo dice con esas
 * palabras, «CJ variant SKU». Un producto no se compra; se compra una talla y
 * un color concretos.
 *
 * Por eso el pedido nunca se creó, y por eso no había ningún botón de pagar: el
 * enlace de pago lo devuelve CJ **al crear** el pedido, así que si el pedido no
 * nace, no hay dónde pagar. No faltaba una pantalla — faltaba el pedido.
 *
 * ══ CÓMO SE ARREGLA, Y POR QUÉ NO HIZO FALTA TOCAR EL CATÁLOGO ══
 *
 * Se le pregunta a CJ por las variantes del producto (`/product/variant/query`
 * con el `pid`, que ya guardamos en `productos.externo_id`) **en el momento de
 * comprar**, y se manda el `vid`.
 *
 * Se resuelve al comprar y no al importar a propósito: así los 78 productos ya
 * publicados quedan arreglados sin volver a cargarlos, no hace falta una
 * columna nueva, y la existencia que se mira es la de hoy y no la del día que
 * se importó.
 *
 * ══ EL HUECO DE VERDAD QUE ESTO DESTAPA ══
 *
 * Nuestra ficha publica un producto de CJ como **una sola cosa con un solo
 * precio**, y CJ lo tiene con tallas y colores. O sea: el comprador nunca
 * eligió variante. Alguien tiene que elegirla.
 *
 * Aquí se elige la más barata **y se deja escrito que se eligió sola**, con la
 * lista de las otras. Es honesto porque el pago a CJ **lo hace una persona a
 * mano**: se ve en el panel antes de que salga un centavo y se puede cancelar.
 * Ese botón manual es la red, y por eso se puede automatizar el resto.
 *
 * Se elige **la más barata** porque es exactamente la que se le cobró al
 * comprador: al importar, un precio en rango (`"12.50 -- 15.30"`) se publica
 * por el mínimo. Elegir cualquier otra sería vender a un precio y comprar a
 * otro más caro, y esa diferencia sale de nuestro bolsillo en cada venta.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Aquí no hay red ni llaves: solo cómo se lee la respuesta de CJ y con qué
 * criterio se elige. Es la misma lección que dejó `lista.ts`, donde copiar la
 * función dentro de la prueba dejó pasar meses un fallo que devolvía cero
 * productos para cualquier búsqueda.
 */

/** Una variante tal como la manda CJ, con los nombres que usa su API. */
export type VarianteCj = {
  vid?: string;
  pid?: string;
  variantSku?: string;
  variantNameEn?: string;
  /** Las opciones legibles: «Black-XXL». Es lo que se le enseña a una persona. */
  variantKey?: string;
  variantSellPrice?: number | string;
};

/** Lo que se decidió comprar, listo para mandarle a CJ y para enseñar. */
export type VarianteElegida = {
  /** El identificador de la variante. Es lo que viaja en el pedido. */
  vid: string;
  /** El SKU de la VARIANTE, no el del producto. */
  sku: string | null;
  /** Cómo se llama, para que se lea en el panel: «Black-XXL». */
  nombre: string | null;
  /**
   * Había más de una y se eligió por criterio, no porque fuera la única.
   *
   * Esto se enseña en ámbar en el panel: quien va a pagar tiene que saber que
   * el color o la talla los eligió el sistema, no el comprador.
   */
  ambigua: boolean;
  /** Cuántas había en total. */
  deCuantas: number;
  /** Las otras, para poder cambiar de idea antes de pagar. */
  otras: string[];
};

/**
 * ══ LA LISTA VIENE DE DOS FORMAS, COMO EN `listV2` ══
 *
 * `/product/variant/query` devuelve el arreglo directo en `data`, pero otras
 * rutas de CJ lo envuelven en `{ list: [] }`. Se leen las dos porque las dos
 * existen de verdad en su API, y leerlo donde no está devuelve una lista vacía
 * **sin ningún error** — que es exactamente cómo se perdió una noche con el
 * buscador.
 */
export function variantesDeCj(datos: unknown): VarianteCj[] {
  if (Array.isArray(datos)) return datos as VarianteCj[];

  const envuelto = (datos ?? {}) as { list?: unknown; content?: unknown };
  if (Array.isArray(envuelto.list)) return envuelto.list as VarianteCj[];
  if (Array.isArray(envuelto.content)) return envuelto.content as VarianteCj[];

  return [];
}

/** El precio de una variante en centavos, o `null` si CJ no lo mandó. */
function precio(v: VarianteCj): number | null {
  const n = Number(v.variantSellPrice);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

/** Cómo se llama la variante de cara a una persona. */
function comoSeLlama(v: VarianteCj): string | null {
  return (
    v.variantKey?.trim() ||
    v.variantNameEn?.trim() ||
    v.variantSku?.trim() ||
    null
  );
}

/**
 * Elige qué variante se compra.
 *
 * Devuelve `null` cuando CJ no manda ninguna utilizable — y eso NO se arregla
 * solo: significa que el producto ya no se puede comprar y hay que decirlo, no
 * mandar un pedido a ciegas.
 *
 * ══ EL ORDEN DE DESEMPATE IMPORTA ══
 *
 * Con varias del mismo precio se ordena por SKU. Sin ese segundo criterio, dos
 * reintentos de la misma compra podrían elegir variantes distintas según cómo
 * viniera la lista ese día, y entonces el panel diría una cosa y CJ despacharía
 * otra.
 */
export function elegirVariante(
  variantes: readonly VarianteCj[],
): VarianteElegida | null {
  /* Sin `vid` no sirve: es lo único que identifica la variante sin lugar a
     dudas. Una fila a medias de CJ se descarta en vez de mandarla y fallar. */
  const utiles = variantes.filter((v) => v.vid?.trim());
  if (utiles.length === 0) return null;

  const ordenadas = [...utiles].sort((a, b) => {
    const pa = precio(a);
    const pb = precio(b);

    /* Una variante sin precio va al final: no se puede afirmar que sea la más
       barata, y elegirla sería comprar sin saber cuánto cuesta. */
    if (pa === null && pb !== null) return 1;
    if (pb === null && pa !== null) return -1;
    if (pa !== null && pb !== null && pa !== pb) return pa - pb;

    return (a.variantSku ?? "").localeCompare(b.variantSku ?? "");
  });

  const elegida = ordenadas[0]!;

  return {
    vid: elegida.vid!.trim(),
    sku: elegida.variantSku?.trim() || null,
    nombre: comoSeLlama(elegida),
    ambigua: ordenadas.length > 1,
    deCuantas: ordenadas.length,
    /* Solo las primeras: un producto de CJ puede traer cuarenta combinaciones
       y una lista de cuarenta en el panel no se lee, tapa el botón de pagar. */
    otras: ordenadas
      .slice(1, 7)
      .map((v) => comoSeLlama(v))
      .filter((n): n is string => Boolean(n)),
  };
}
