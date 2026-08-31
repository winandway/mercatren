/**
 * ¿Esta tienda es de la CASA? — puro, para poder probarlo.
 *
 * Las vitrinas internas de Mercatren: la general de EE. UU., las de rubro
 * (incluida la Mayorista), las de Chile/Colombia y la de las secciones de
 * video. A ninguna se le puede «enviar el dinero» de un retiro: su billetera
 * es nuestra, y un comercio que la eligiera por error dejaría su plata en un
 * limbo del que solo lo saca una llamada a soporte.
 */
export function esTiendaDeLaCasa(id: string): boolean {
  return (
    id === "tienda-mercatren-us" ||
    id === "tienda-mercatren-secciones" ||
    id.startsWith("tienda-us-") ||
    id.startsWith("tienda-cl-") ||
    id.startsWith("tienda-co-")
  );
}
