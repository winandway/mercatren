/**
 * EL CATÁLOGO SE ARMA A PEDIDO, UNO POR UNO (3 nov 2026).
 *
 * Orden de Richard: vaciar Mercatren y empezar de cero. La web deja de vender
 * por ahora y Mercatren pasa a ser app. Se borraron los 56.650 productos que
 * había (casi todos traídos en masa del proveedor) y sus 48 GB de fotos; solo
 * quedan, escondidos, los 16 que sostienen pedidos ya cobrados.
 *
 * De aquí en adelante un producto entra UNO POR UNO, cuando alguien lo pide:
 * el botón del panel o la acción `agregar` de la puerta (`cj/agregar-por-pid`),
 * que cotizan el flete real y lo publican listo.
 *
 * Lo que queda cerrado mientras esto valga `true`:
 *
 * - La importación masiva del almacén del proveedor (`cj/masivo-servidor`):
 *   ni arrancar, ni reanudar, ni avanzar.
 * - La sincronización automática de catálogos de comercios
 *   (`catalogo/sincronizar`): ni el robot ni el botón traen archivos enteros.
 * - El afinado y el refresco de existencias del reloj (`cj/afinar`,
 *   `cj/existencias`): recorrían el catálogo entero contra el proveedor.
 *   Las existencias se siguen preguntando ANTES de cobrar, que es lo que
 *   protege cada venta.
 *
 * Es una constante del código y no una casilla del panel, igual que
 * `en-pausa.ts`: lo que se cerró por orden del dueño no se abre escribiendo
 * en un formulario. Candado: `tests/unit/catalogo-a-pedido.test.ts`.
 */
export const CATALOGO_A_PEDIDO = true;

export const MOTIVO_CATALOGO_A_PEDIDO =
  "El catálogo se arma a pedido, un producto a la vez: la importación masiva y la sincronización automática están cerradas por orden de Richard (3 nov 2026). Ver src/lib/catalogo/a-pedido.ts.";
