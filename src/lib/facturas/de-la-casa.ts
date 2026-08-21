import { TIENDA_MAYORISTA } from "@/lib/cj/mayorista";
import { PREFIJO_TIENDA_RUBRO, TIENDA_US_GENERAL } from "@/lib/cj/rubros";

/**
 * ¿ESTA TIENDA SOMOS NOSOTROS?
 *
 * ══ EL FALLO QUE CIERRA (20 ago 2026) ══
 *
 * En «Órdenes de compra» apareció `MT-OC-000003` con el estado «Falta tu
 * factura», a nombre de **Sole & Thread**. Y Sole & Thread es una tienda
 * NUESTRA: es `us-ropa-calzado`, una de las que se crean por rubro para el
 * catálogo de Estados Unidos, con «Vendido y facturado por Mercatren LLC» en
 * su propia ficha.
 *
 * O sea que el sistema le estaba pidiendo una factura a Mercatren… para
 * Mercatren. **Nadie se factura a sí mismo.**
 *
 * ══ POR QUÉ PASÓ ══
 *
 * El par de facturas se diseñó para el modelo de Venezuela, donde detrás de
 * cada tienda hay un comercio de verdad que nos vende la mercancía y nos la
 * factura. Cuando entró el catálogo de Estados Unidos, esas tiendas por rubro
 * empezaron a comportarse como comercios para todo el sistema — incluida esta
 * parte, donde no lo son.
 *
 * ══ Y EL COSTO SIGUE TENIENDO SU PAPEL ══
 *
 * Esto no deja una compra sin respaldo. En una venta de Estados Unidos, a
 * quien de verdad se le compra la mercancía es a **CJ**, y su factura es el
 * documento que sostiene ese costo. Vive en `pedidos_proveedor`, que es donde
 * corresponde. Lo que sobraba era pedir una segunda factura a un proveedor que
 * no existe.
 *
 * Puro a propósito: decide con el id y nada más, así que se puede probar
 * entero sin base de datos.
 */
export function esTiendaDeLaCasa(tiendaId: string | null | undefined): boolean {
  const id = (tiendaId ?? "").trim();
  if (!id) return false;

  return (
    /* La general, la primera que se creó para el catálogo de EE. UU. */
    id === TIENDA_US_GENERAL ||
    /* La mayorista, para lo que se vende por lotes. */
    id === TIENDA_MAYORISTA.id ||
    /* Y todas las de rubro: `tienda-us-ropa-calzado`, `tienda-us-bicicletas`… */
    id.startsWith(PREFIJO_TIENDA_RUBRO)
  );
}

/**
 * ¿Hay que pedirle factura a esta tienda?
 *
 * Se escribe como su propia función, y no como `!esTiendaDeLaCasa(...)`, porque
 * es la pregunta que de verdad se hace el código que la llama. Si mañana
 * aparece otro motivo para no pedir factura —un comercio exento, un acuerdo
 * distinto— se agrega aquí y no hay que ir a buscar todas las negaciones
 * repartidas por el proyecto.
 */
export function llevaOrdenDeCompra(tiendaId: string | null | undefined): boolean {
  return !esTiendaDeLaCasa(tiendaId);
}
