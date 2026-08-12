/**
 * LA SOCIEDAD QUE OPERA MERCATREN.
 *
 * ══ POR QUÉ ESTO EXISTE ══
 *
 * Mercatren es la MARCA. Detrás hay una sociedad que compra, vende y factura.
 * Hasta el 12 de agosto de 2026 fue Windoce, LLC (Delaware); desde ese día es
 * **Mercatren LLC (Michigan)**, con su propio EIN, su banco y su Stripe.
 *
 * El nombre estaba escrito a mano en 240 sitios repartidos por 26 archivos:
 * los términos, la privacidad, el documento del modelo en dos idiomas, los
 * textos de la web, el pie de los correos y el llms.txt. Hacer ese cambio el
 * día del traspaso habría sido un día entero de trabajo, con el sitio en
 * producción y con prisa — la peor combinación posible.
 *
 * Desde aquí, el traspaso es cambiar estas líneas y publicar.
 *
 * ══ EL ORDEN QUE SE SIGUIÓ ══
 *
 * EIN → banco (Mercury) → Stripe verificada y activa → y recién entonces esto.
 * El sitio fue lo último a propósito: si dice un nombre y el cobro le aparece
 * al comprador con otro en su estado de cuenta, eso es un contracargo.
 *
 * ══ LO QUE NO SE CAMBIA DESDE AQUÍ ══
 *
 * 1. **El crédito del desarrollador del pie de página.** Ese dice Windoce, LLC
 *    para siempre: es quien programa el sitio, no quien opera la tienda. Son
 *    dos cosas distintas que se llaman igual hoy y dejarán de llamarse igual.
 *    Vive literal en `pie-pagina.tsx`, a propósito.
 * 2. **El PDF del modelo de negocio.** Lo revisó el abogado; no se regenera
 *    sin él.
 * 3. **Las facturas ya emitidas.** Copian los datos del emisor dentro del
 *    documento, así que las emitidas antes del 12 ago 2026 seguirán diciendo
 *    Windoce, LLC para siempre. Eso es lo correcto: una factura dice lo que
 *    decía el día que se emitió.
 * 4. **Los comentarios del código.** Explican decisiones de un momento
 *    concreto; reescribirlos borraría la historia de por qué las cosas son
 *    como son.
 */
export const SOCIEDAD = {
  /**
   * El nombre legal, tal como está registrado. **Sin coma**: así aparece en
   * los Articles of Organization de Michigan y en la carta CP 575 del IRS,
   * y así tiene que aparecer en todas partes.
   *
   * (La sociedad anterior, Windoce, LLC, sí llevaba coma. No es un descuido.)
   */
  nombre: "Mercatren LLC",
  /** Dónde está registrada. Sale escrito junto al nombre en los términos. */
  estado: "Michigan",
  pais: "Estados Unidos",
  /** El país en inglés: el documento del modelo está en los dos idiomas. */
  paisEn: "United States",
} as const;

/**
 * Quien programa el sitio. NO cambia cuando cambie la sociedad operadora.
 *
 * Windoce, LLC es el estudio de desarrollo y seguirá siéndolo aunque la tienda
 * pase a manos de otra sociedad. Va aparte justamente para que un buscar y
 * reemplazar del día del traspaso no se lo lleve por delante.
 */
export const DESARROLLADOR = {
  nombre: "Windoce, LLC",
  sitio: "https://windoce.com",
} as const;
