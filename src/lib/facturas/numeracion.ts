/**
 * LA NUMERACIÓN DE LOS DOCUMENTOS — la parte pura.
 *
 * Aquí no se toca la base. Tomar el siguiente número vive aparte, en
 * `serie.ts`, y es a propósito: así esto se prueba solo, sin base y sin
 * arrastrar las mil cuatrocientas líneas del esquema a la medición de
 * cobertura. Es el mismo reparto que ya tienen `alcance.ts` y `cupo.ts`.
 *
 * ══ POR QUÉ ESTO NO SE HACE COMO LOS PEDIDOS ══
 *
 * El número de pedido sale de `COUNT(*) + 1`, y para un pedido está bien: un
 * hueco no le importa a nadie. Una factura es otra cosa. El correlativo **no
 * puede saltar ni repetir**, y es lo primero que mira una revisión.
 *
 * `COUNT(*) + 1` falla en las dos:
 *
 *   · Dos ventas confirmadas en el mismo instante cuentan lo mismo y piden el
 *     MISMO número. Con tarjeta pasa de verdad: Stripe manda los avisos en
 *     paralelo.
 *   · Si alguna vez se borra una fila, el siguiente número repite uno que ya
 *     se emitió — y ahí hay dos documentos distintos con el mismo número.
 */

/** Las series que existen. Agregar una es agregar una entrada aquí. */
export const SERIES = {
  facturaVenta: { id: "factura_venta", prefijo: "MT-F-" },
  ordenCompra: { id: "orden_compra", prefijo: "MT-OC-" },
  /**
   * LOS COBROS POR ENLACE (26 ago 2026).
   *
   * Su número se proponía sumándole uno al ÚLTIMO que hubiera escrito el
   * comercio. Alguien tecleó `MT-100009` con prisa y el sistema siguió por
   * ahí: `MT-100010`, y de ahí para arriba. El dueño lo cazó: _«las facturas
   * no comienzan por un millón… los números tienen que ser consecutivos»_.
   *
   * Un correlativo no puede salir de adivinar sobre un texto que alguien
   * escribió a mano: un dedazo se propaga para siempre. Sale de una serie en
   * la base, como las facturas de venta y las órdenes de compra — atómica, sin
   * saltos y sin repetidos.
   *
   * Prefijo propio: `MT-C-` no se confunde con el número de PEDIDO
   * (`MT-000009`), que es lo que se copió aquella vez.
   */
  cobroEnlace: { id: "cobro_enlace", prefijo: "MT-C-" },
} as const;

export type Serie = (typeof SERIES)[keyof typeof SERIES];

/**
 * Arma el número visible a partir del prefijo y el correlativo.
 *
 * Seis dígitos con ceros delante para que ordenen bien como texto — que es
 * como los ordena la base — y para que el documento número 7 no se vea como
 * un borrador. Pasado el millón, sigue creciendo sin romperse.
 */
export function formatearNumero(prefijo: string, correlativo: number): string {
  return `${prefijo}${String(correlativo).padStart(6, "0")}`;
}
