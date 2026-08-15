/**
 * Los nombres fijos del catálogo de Estados Unidos.
 *
 * Viven aquí y no en `importar.ts` porque ese archivo es `"use server"`, y de
 * un archivo así **solo se pueden exportar funciones async**. Sacarlos aparte
 * es la forma correcta de compartirlos: la alternativa era repetir las cadenas
 * en cada sitio que las necesita, y ahí es donde se desincronizan.
 */

/** Cómo se llama esta fuente en `productos.fuenteId`. */
export const FUENTE_CJ = "cj";

/**
 * La tienda interna de la que cuelga todo el catálogo de EE. UU.
 *
 * En Estados Unidos Mercatren LLC es quien vende y factura, no un tercero: por
 * eso el catálogo cuelga de una tienda nuestra y no se abren tiendas ajenas
 * allá. Es además lo que Merchant Center necesita — un solo vendedor
 * responsable con una política de envío y una de devoluciones.
 */
export const TIENDA_US = {
  id: "tienda-mercatren-us",
  slug: "mercatren-estados-unidos",
  nombre: "Mercatren · Estados Unidos",
};
