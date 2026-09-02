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
