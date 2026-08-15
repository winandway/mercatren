import { DEPARTAMENTOS } from "@/lib/catalogo/departamentos";

/**
 * LAS TIENDAS DE LA CASA, UNA POR RUBRO.
 *
 * ══ POR QUÉ VARIAS Y NO UNA SOLA ══
 *
 * Con 10.000 o 20.000 productos colgando de una sola tienda, el sitio se ve
 * como un depósito y se lee como un monopolio: una tienda que lo vende todo no
 * se parece a nada real. Repartido en tiendas con nombre propio y un rubro cada
 * una, el comprador ve un mercado con muchos vendedores — que es lo que
 * Mercatren es.
 *
 * ══ POR DENTRO NO CAMBIA NADA ══
 *
 * La compra a CJ y la factura las hace **Mercatren LLC**, directo, igual que
 * hoy. El nombre de la tienda es presentación.
 *
 * ══ LA REGLA QUE HACE QUE ESTO SEA LEGÍTIMO ══
 *
 * En la ficha de cada producto y de cada tienda **se lee quién vende y
 * factura**. Con esa línea son marcas de la casa —como las marcas propias de
 * cualquier cadena— y es perfectamente normal. Sin ella son vendedores
 * inventados, y eso es tergiversación: causa de suspensión en Merchant Center y
 * de contracargos que el comprador gana. La línea puede ir discreta; lo que no
 * puede es faltar.
 *
 * ══ CÓMO SE ELIGE LA TIENDA DE UN PRODUCTO ══
 *
 * Por su departamento, que ya se calcula al agregarlo desde CJ. Si estando en
 * la tienda de repuestos se agrega una cartera, **la cartera se va sola a la de
 * carteras**: no se queda donde no va. El equipo no tiene que acordarse de
 * cambiar de tienda antes de cada producto, que es justo donde se equivocaría.
 */

/** Cómo se llama en la base la tienda general, la que ya existe. */
export const TIENDA_US_GENERAL = "tienda-mercatren-us";

/** Prefijo de las tiendas por rubro, para reconocerlas de un vistazo. */
export const PREFIJO_TIENDA_RUBRO = "tienda-us-";

/**
 * El identificador y la dirección web de la tienda de un rubro.
 *
 * Se derivan del slug del departamento para que la pareja no se pueda
 * desincronizar: el departamento manda, y la tienda es su consecuencia.
 */
export function tiendaDeRubro(departamento: string): {
  id: string;
  slug: string;
} {
  return {
    id: `${PREFIJO_TIENDA_RUBRO}${departamento}`,
    slug: `us-${departamento}`,
  };
}

/** ¿Este slug de departamento existe de verdad? */
export function esDepartamentoReal(slug: string | null | undefined): boolean {
  return Boolean(slug) && DEPARTAMENTOS.some((d) => d.slug === slug);
}

/**
 * A qué tienda va un producto.
 *
 * **Un rubro sin tienda propia se queda en la general**, nunca se descarta: un
 * producto sin dónde ponerlo se perdería, y perder mercancía es peor que
 * tenerla en la tienda genérica un tiempo.
 */
export function tiendaParaElProducto(
  departamento: string | null | undefined,
  rubrosAbiertos: readonly string[],
): string {
  if (!departamento || !esDepartamentoReal(departamento)) {
    return TIENDA_US_GENERAL;
  }
  return rubrosAbiertos.includes(departamento)
    ? tiendaDeRubro(departamento).id
    : TIENDA_US_GENERAL;
}

/**
 * Un nombre propuesto para la tienda de un rubro.
 *
 * **Es una propuesta, no una imposición:** el dueño escribe el que quiera en el
 * panel. Pero un formulario que arranca vacío es un formulario que se llena mal
 * o no se llena, y una tienda sin nombre no se puede publicar.
 *
 * No lleva «Mercatren» dentro a propósito: la gracia es que cada tienda tenga
 * su propia cara. Quién vende y factura se dice en la ficha, que es donde tiene
 * valor legal, no en el nombre.
 */
export function nombrePropuesto(departamento: string, idioma: string): string {
  const d = DEPARTAMENTOS.find((x) => x.slug === departamento);
  if (!d) return "";
  return idioma === "en" ? d.en : d.es;
}
