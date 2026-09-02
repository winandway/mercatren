/**
 * RECONCILIAR CON CJ — puro, para poder probarlo (1 sep 2026).
 *
 * ══ EL FALLO QUE TENÍA EL CIRCUITO PARADO ══
 *
 * La MT-000011 quedó marcada «No se pudo crear» y cada reintento chocaba con
 * «Order exist, please do not duplicate create»: CJ SÍ tenía el pedido desde
 * un intento anterior, y de nuestro lado no había forma de adoptarlo — solo
 * de volver a crearlo, que CJ rechaza. Un callejón sin salida con el
 * comprador ya cobrado.
 *
 * Las integraciones que funcionan (Shopify, WooCommerce) hacen lo mismo que
 * hace falta aquí: ANTES de crear, preguntan por su propio número de pedido
 * —`getOrderDetail` acepta «Custom order id», comprobado en la doc de CJ—
 * y si ya existe lo adoptan. Y si crear devuelve «ya existe», es la señal
 * de adoptar, no un error.
 */

/** ¿CJ está diciendo que el pedido YA existe con nuestro número? */
export function esPedidoYaCreado(motivo: string | null | undefined): boolean {
  const m = (motivo ?? "").toLowerCase();
  return (
    m.includes("order exist") ||
    m.includes("already exist") ||
    m.includes("duplicate") ||
    m.includes("duplicat")
  );
}

/**
 * Qué significa el estado que devuelve CJ, en nuestras palabras.
 *
 * Los valores salen de su documentación (1 sep 2026): CREATED e IN_CART son
 * pedidos sin confirmar, UNPAID espera el pago; PENDING, PROCESSING y
 * UNSHIPPED ya están PAGADOS y en cola; SHIPPED y DELIVERED, en camino o
 * entregados; CANCELLED, cancelado por CJ.
 */
export type LecturaDeEstadoCj = {
  /** Se puede (y hay que) pagar. */
  pagable: boolean;
  /** CJ ya lo cobró: NO se vuelve a pagar. */
  pagado: boolean;
  /** CJ lo canceló: no se paga y hay que decirlo. */
  cancelado: boolean;
};

export function leerEstadoDeCj(
  orderStatus: string | null | undefined,
): LecturaDeEstadoCj {
  const s = (orderStatus ?? "").trim().toUpperCase();
  if (s === "CANCELLED" || s === "CANCELED") {
    return { pagable: false, pagado: false, cancelado: true };
  }
  if (["CREATED", "IN_CART", "UNPAID", ""].includes(s)) {
    return { pagable: true, pagado: false, cancelado: false };
  }
  /* PENDING, PROCESSING, UNSHIPPED, SHIPPED, DELIVERED y cualquier otro
     estado que no conozcamos: se trata como ya cobrado. Pagar dos veces es
     el error caro; no pagar se arregla con un clic. */
  return { pagable: false, pagado: true, cancelado: false };
}

/**
 * Con qué identificador se paga.
 *
 * `payBalanceV2` pide el `shipmentOrderId` —lo dice su doc y su ejemplo—;
 * el `orderId` es el del pedido padre. Se mandaba el `orderId` dentro del
 * campo `shipmentOrderId`, y por eso el saldo nunca se descontó.
 */
export function idsParaPagar(datos: {
  shipmentOrderId?: string | null;
  orderId?: string | null;
  cjOrderId?: string | null;
}): string[] {
  const candidatos = [datos.shipmentOrderId, datos.orderId, datos.cjOrderId]
    .map((v) => (v ?? "").toString().trim())
    .filter((v) => v.length > 0);
  return Array.from(new Set(candidatos));
}

/**
 * ══ EL FALLO DE INVENTARIO AL CONFIRMAR (1 sep 2026) ══
 *
 * CJ se negó a confirmar la MT-000011: «The selected logistics is assigned
 * to a warehouse with insufficient inventory… (Elk Grove Village, IL, US)».
 * La variante SÍ tiene existencia en Estados Unidos —por eso pasó el filtro
 * del `countryCode`— pero en OTRO almacén del país, y el transporte elegido
 * (el más barato del `freightCalculate`) está atado al que no la tiene.
 */
export function esFalloDeInventario(
  motivo: string | null | undefined,
): boolean {
  const m = (motivo ?? "").toLowerCase();
  return (
    m.includes("insufficient inventory") ||
    m.includes("inventory has not arrived") ||
    m.includes("change the logistics option") ||
    m.includes("change to another warehouse")
  );
}

export type OpcionLogisticaCj = {
  id?: number | string;
  logisticsName?: string;
  postage?: number | string;
  hasStock?: boolean | string | number;
  arrivalTime?: string;
  startCountry?: string;
};

/**
 * De las opciones que CJ ofrece para un pedido YA creado, la más barata
 * CON existencia. CJ es quien sabe qué almacén surte cada transporte; no
 * se adivina de este lado.
 */
export function elegirLogisticaConStock(
  opciones: readonly OpcionLogisticaCj[],
): OpcionLogisticaCj | null {
  const conStock = opciones.filter(
    (o) =>
      o.logisticsName?.trim() &&
      (o.hasStock === true || o.hasStock === "true" || o.hasStock === 1),
  );
  if (conStock.length === 0) return null;
  return [...conStock].sort((a, b) => {
    const pa = Number(a.postage);
    const pb = Number(b.postage);
    if (!Number.isFinite(pa)) return 1;
    if (!Number.isFinite(pb)) return -1;
    return pa - pb;
  })[0]!;
}

/**
 * CON QUÉ CÓDIGO PEDIRLE A CJ LOS TRANSPORTES DE UN PEDIDO (2 sep 2026).
 *
 * `getOrderLogisticsInfo` quiere el código SD…/DP… — pero en un pedido sin
 * confirmar `getOrderDetail` devuelve `cjOrderId: null` (su propio ejemplo
 * lo enseña), y con el id numérico contesta «The CJ order does not exist».
 * Así que se prueban TODOS los identificadores que haya, del más probable
 * al menos, y se anota cuál sirvió. Adivinar uno ya costó un clic.
 */
export function candidatosDeCodigoCj(
  detalle: {
    cjOrderId?: string | null;
    shipmentOrderId?: string | null;
    orderNum?: string | null;
    orderId?: string | null;
  },
  numeroNuestro: string,
): string[] {
  const lista = [
    detalle.cjOrderId,
    detalle.shipmentOrderId,
    numeroNuestro,
    detalle.orderNum,
    detalle.orderId,
  ]
    .map((v) => (v ?? "").toString().trim())
    .filter((v) => v.length > 0);
  return Array.from(new Set(lista));
}
