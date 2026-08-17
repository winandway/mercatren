import "server-only";

import { and, eq, type SQL } from "drizzle-orm";

import { productos, tiendas } from "@/lib/db/schema";
import { mercadoActual } from "@/lib/mercado/actual";
import type { Mercado } from "@/lib/mercado/mercados";

/**
 * LA ÚNICA PUERTA A LOS DATOS QUE LLEVAN PAÍS.
 *
 * ══ EL MIEDO QUE ESTO MATA ══
 *
 * «Alguien se olvida de filtrar y un chileno ve stock de Estados Unidos.» Ese
 * olvido NO da error: devuelve datos equivocados, que es lo que más tarda en
 * descubrirse y lo que más caro sale. Un `if` olvidado en una pantalla nueva
 * no lo atrapa ninguna prueba de esa pantalla, porque la pantalla «funciona».
 *
 * ══ POR QUÉ ES UN TIPO Y NO UNA COSTUMBRE ══
 *
 * La defensa no puede ser «acordarse de pasar el país»: eso es exactamente lo
 * que falla. Aquí el país es un ARGUMENTO OBLIGATORIO del tipo, así que pedir
 * el catálogo sin decir de qué país **no compila**. El error se ve al
 * escribir, no en producción tres semanas después.
 *
 * Y el filtro en sí no se puede fabricar a mano: `soloDeEsteMercado` es la
 * única forma de construir un `FiltroDeMercado`, y las consultas exigen ese
 * tipo. Escribir `eq(tiendas.mercado, "CL")` suelto no sirve de nada porque no
 * lleva la marca — el compilador lo rechaza.
 *
 * ══ POR QUÉ NO SE SEPARA EL CÓDIGO ══
 *
 * Es la regla de oro del plan: el código nunca se separa, se separa el DATO.
 * No hay un `catalogo-chile.ts`; hay UN catálogo al que se le dice el país.
 * Con dos copias, el arreglo del carrito se haría en una y se olvidaría en la
 * otra, y a los tres meses serían dos productos distintos.
 */

/**
 * La marca que no se puede falsificar.
 *
 * Un símbolo único que no se exporta: fuera de este archivo nadie puede
 * construir un valor que la lleve. Es lo que convierte «acuérdate de filtrar»
 * en «no compila si no filtras».
 */
declare const marcaDeMercado: unique symbol;

/** Una condición SQL que garantiza, por tipo, que trae el país dentro. */
export type FiltroDeMercado = SQL & { readonly [marcaDeMercado]: true };

/**
 * El filtro de un mercado concreto, con la marca puesta.
 *
 * Recibe el mercado como PRIMER argumento y obligatorio, que es la regla de la
 * fase 2 del plan.
 */
export function soloDeEsteMercado(
  mercado: Mercado,
  extra?: SQL | undefined,
): FiltroDeMercado {
  const condicion = extra
    ? and(eq(tiendas.mercado, mercado.codigo), extra)!
    : eq(tiendas.mercado, mercado.codigo);
  return condicion as FiltroDeMercado;
}

/**
 * Lo que el público puede ver en ESTE país: publicado, de una tienda activa,
 * y de este mercado.
 *
 * Las tres condiciones van juntas a propósito. Separadas, una pantalla nueva
 * podría traer el filtro de mercado y olvidarse del de «publicado», y
 * enseñaría borradores de los comercios.
 */
export function visibleEn(mercado: Mercado): FiltroDeMercado {
  return soloDeEsteMercado(
    mercado,
    and(eq(productos.estado, "publicado"), eq(tiendas.estado, "activa")),
  );
}

/**
 * Lo mismo pero SIN exigir que el producto esté publicado: para las consultas
 * que solo miran tiendas (el listado de comercios, la ficha de una tienda).
 */
export function tiendaVisibleEn(mercado: Mercado): FiltroDeMercado {
  return soloDeEsteMercado(mercado, eq(tiendas.estado, "activa"));
}

/**
 * El mercado de esta petición, para las pantallas públicas.
 *
 * Es el ÚNICO sitio donde una página resuelve el país; de ahí en adelante
 * viaja como argumento. Si cada pantalla lo dedujera por su cuenta habría
 * tantas formas de equivocarse como pantallas.
 */
export async function mercadoDeLaPeticion(): Promise<Mercado> {
  return mercadoActual();
}
