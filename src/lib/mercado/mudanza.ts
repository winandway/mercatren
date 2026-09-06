import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";
import { mercadoPorCodigo, type Mercado } from "@/lib/mercado/mercados";

/**
 * CUANDO UNA DIRECCIÓN SE MUDA DE DOMINIO, GOOGLE TIENE QUE ENTERARSE.
 *
 * ══ EL PROBLEMA QUE ESTO RESUELVE (6 sep 2026) ══
 *
 * Los comercios venezolanos vivieron un año en mercatren.com. Google indexó
 * **más de mil fichas** ahí, la gente las compartió por WhatsApp, y algunas
 * están en enlaces de cobro que siguen circulando. Al mudar Venezuela a
 * mercatren.com.ve, esas mil direcciones pasan a no existir en el .com.
 *
 * Un 404 en esa situación es la forma más cara de mudarse: Google saca la
 * ficha de sus resultados y el posicionamiento se empieza de cero en el
 * dominio nuevo. Un **301** hace lo contrario: le dice «esto se mudó aquí»
 * y le TRASPASA la autoridad que la ficha ya tenía.
 *
 * ══ POR QUÉ AQUÍ Y NO EN EL MIDDLEWARE ══
 *
 * El middleware corre en el borde y no sabe de qué país es un producto sin
 * preguntárselo a la base — y lo haría en CADA petición del sitio, incluidas
 * las que no fallan. Aquí se pregunta **solo cuando la ficha no apareció**,
 * que es el único momento en que la respuesta importa: en un sitio sano eso
 * pasa casi nunca.
 *
 * ══ ESTA CONSULTA NO LLEVA FILTRO DE MERCADO, Y ES A PROPÓSITO ══
 *
 * Es la única del proyecto que mira a través de la pared en vez de detrás de
 * ella, porque su pregunta es justamente «¿de qué OTRO país es esto?». No
 * devuelve ni un dato del producto: solo el código del mercado, que es lo que
 * hace falta para armar la redirección. Con eso no se filtra nada.
 */

/** El mercado donde vive hoy un producto, mire quien mire. `null` si no existe. */
export async function mercadoDeEsteProducto(
  slug: string,
): Promise<Mercado | null> {
  const limpio = slug.trim();
  if (!limpio) return null;

  const [fila] = await getDb()
    .select({ mercado: tiendas.mercado })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(eq(productos.slug, limpio))
    .limit(1)
    .catch(() => []);

  return fila?.mercado ? mercadoPorCodigo(fila.mercado) : null;
}

/** Lo mismo para la ficha de una tienda. */
export async function mercadoDeEstaTienda(
  slug: string,
): Promise<Mercado | null> {
  const limpio = slug.trim();
  if (!limpio) return null;

  const [fila] = await getDb()
    .select({ mercado: tiendas.mercado })
    .from(tiendas)
    .where(eq(tiendas.slug, limpio))
    .limit(1)
    .catch(() => []);

  return fila?.mercado ? mercadoPorCodigo(fila.mercado) : null;
}
