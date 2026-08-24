import { destinoDeLaTienda, type Destino } from "@/lib/destino/reglas";

/**
 * UN CARRITO NO PUEDE MEZCLAR DESTINOS.
 *
 * Lo de Estados Unidos se despacha a una dirección de allá; lo de Venezuela se
 * retira en el comercio que lo vende. **No hay una sola entrega que sirva para
 * los dos**, y el checkout ni siquiera pide los mismos datos.
 *
 * Hasta hoy nada lo impedía: si el carrito mezclaba, el pedido salía marcado
 * como «US» —basta con que UNO sea de allá— y a la mercancía venezolana se le
 * pedía un estado y un código postal de Estados Unidos. Esa venta se cobra y
 * no se puede entregar.
 *
 * Todo esto es puro y tiene pruebas. El candado de verdad está en el servidor
 * (`crearPedido`); lo del navegador es para que la persona se entere ANTES de
 * llenar el checkout, no después.
 */
export type LineaConDestino = { tiendaPais?: string | null };

/**
 * El destino de lo que ya hay en el carrito, o `null` si está vacío o si
 * ninguna línea dice de dónde viene.
 *
 * ══ POR QUÉ `undefined` NO ES «VENEZUELA» ══
 *
 * Los carritos guardados en el navegador ANTES de esto no tienen el país (la
 * línea se guardó sin ese campo). Tratarlos como venezolanos bloquearía sin
 * motivo a quien tenga uno viejo con productos de Estados Unidos. Lo que no se
 * sabe, no decide: se ignora aquí y el servidor lo vuelve a mirar con lo que
 * dice la base.
 */
export function destinoDelCarrito(
  lineas: readonly LineaConDestino[],
): Destino | null {
  for (const l of lineas) {
    if (l.tiendaPais === undefined || l.tiendaPais === null) continue;
    return destinoDeLaTienda(l.tiendaPais);
  }
  return null;
}

/** ¿Se puede agregar esto a lo que ya hay? */
export function sePuedeAgregar(
  lineas: readonly LineaConDestino[],
  nueva: LineaConDestino,
): { ok: true } | { ok: false; hay: Destino; entra: Destino } {
  const hay = destinoDelCarrito(lineas);
  if (hay === null) return { ok: true };
  if (nueva.tiendaPais === undefined || nueva.tiendaPais === null)
    return { ok: true };
  const entra = destinoDeLaTienda(nueva.tiendaPais);
  return hay === entra ? { ok: true } : { ok: false, hay, entra };
}

/** ¿El carrito guardado YA mezcla? (los que nacieron antes de esta regla). */
export function carritoMezclado(lineas: readonly LineaConDestino[]): boolean {
  const destinos = new Set<Destino>();
  for (const l of lineas) {
    if (l.tiendaPais === undefined || l.tiendaPais === null) continue;
    destinos.add(destinoDeLaTienda(l.tiendaPais));
  }
  return destinos.size > 1;
}

/** Las líneas que NO son del destino que se quiere conservar. */
export function lineasDeOtroDestino<T extends LineaConDestino>(
  lineas: readonly T[],
  conservar: Destino,
): T[] {
  return lineas.filter(
    (l) =>
      l.tiendaPais !== undefined &&
      l.tiendaPais !== null &&
      destinoDeLaTienda(l.tiendaPais) !== conservar,
  );
}
