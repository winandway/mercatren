import { MARGEN_MINIMO_CENTAVOS } from "@/lib/destino/precio-us";

/**
 * LA TIENDA MAYORISTA: lo que deja poco suelto, vendido por lotes.
 *
 * ══ EL PROBLEMA QUE RESUELVE ══
 *
 * La pantalla de selección marca en rojo los productos que dejan menos de dos
 * dólares: en esos, **una sola devolución convierte la venta en pérdida**, y no
 * cubren ni el tiempo de atender al comprador. Hasta ahora la única salida era
 * no agregarlos — y son justo los baratos, que es lo que más se busca.
 *
 * ══ LA SALIDA: VENDERLOS DE A DIEZ ══
 *
 * Decisión del dueño (15 ago 2026). El mismo producto que deja $0.90 suelto
 * deja nueve dólares en un lote de diez, y una devolución sobre un lote pesa lo
 * mismo que sobre una venta: deja de ser el riesgo que era.
 *
 * Y encaja con el consejo del casillero que ya está en la ficha: quien compra
 * diez unidades para llevárselas a su país por casillero **está haciendo
 * exactamente lo que este catálogo permite**.
 *
 * ══ EL MÍNIMO SE COMPRUEBA EN EL SERVIDOR, SIEMPRE ══
 *
 * El carrito vive en el navegador y cualquiera lo puede editar. Si el mínimo
 * solo estuviera en la pantalla, se vendería una unidad suelta de un producto
 * que no la cubre — que es exactamente lo que esta tienda viene a evitar.
 */

/** El identificador de la tienda mayorista dentro de la base. */
export const TIENDA_MAYORISTA = {
  id: "tienda-us-mayorista",
  slug: "us-mayorista",
  nombreEs: "Mercatren Mayorista",
  nombreEn: "Mercatren Wholesale",
};

/**
 * Cuántas unidades hay que llevar como mínimo.
 *
 * Una docena. Es lo que convierte un margen de un dólar en uno de doce, y es la
 * unidad de compra que la gente ya entiende sin que haya que explicarla.
 */
export const MINIMO_MAYORISTA = 12;

/** ¿Este producto va a la mayorista en vez de a la tienda de su rubro? */
export function vaAlMayorista(margenCentavos: number): boolean {
  return margenCentavos < MARGEN_MINIMO_CENTAVOS;
}

/** ¿Esta tienda vende por lotes? */
export function esMayorista(tiendaId: string | null | undefined): boolean {
  return (tiendaId ?? "") === TIENDA_MAYORISTA.id;
}

/**
 * Cuántas unidades hay que llevar de un producto de esta tienda.
 *
 * Una para todo el catálogo normal; diez en la mayorista.
 */
export function cantidadMinima(tiendaId: string | null | undefined): number {
  return esMayorista(tiendaId) ? MINIMO_MAYORISTA : 1;
}

/**
 * Sube una cantidad al mínimo que corresponda.
 *
 * **Sube, nunca baja.** Quien pidió 25 se lleva 25; quien pidió 3 en la
 * mayorista se lleva 10 — nunca 3, y nunca un carrito que se vacía solo sin
 * explicación, que es como se pierde una compra ya decidida.
 */
export function ajustarCantidad(
  cantidad: number,
  tiendaId: string | null | undefined,
): number {
  const minimo = cantidadMinima(tiendaId);
  const pedida = Math.floor(Number(cantidad) || 0);
  return pedida < minimo ? minimo : pedida;
}
