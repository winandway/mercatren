import { and, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getDbAsync, schema } from "@/lib/db";
import { articulosDe, rutaDeArticulo } from "@/contenido/articulos";
import { MERCADO_PRINCIPAL } from "@/lib/mercado/mercados";
import { SITIO } from "@/lib/sitio";

export const dynamic = "force-dynamic";

/**
 * El mapa del sitio: la lista de paginas que le entregamos a Google.
 *
 * Cada direccion va con sus dos idiomas declarados, para que Google entienda
 * que /es/... y /en/... son la misma pagina y no dos que compiten. Esta es la
 * direccion que se envia a Google Search Console:
 *
 *   https://mercatren.com/sitemap.xml
 *
 * Las paginas privadas (panel, carrito, checkout, entrar) no van aqui: no
 * tienen nada que buscar y no deben aparecer en resultados.
 */

/** Una entrada con sus versiones por idioma. */
function entrada(
  ruta: string,
  prioridad: number,
  frecuencia: MetadataRoute.Sitemap[number]["changeFrequency"],
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const idioma of routing.locales) {
    languages[idioma] = `${SITIO.url}/${idioma}${ruta}`;
  }
  /**
   * `x-default` es la versión para quien no busca ni en español ni en inglés.
   * Sin ella, Google elige por su cuenta cuál enseñar a esa gente — y suele
   * elegir mal. Es el mismo criterio que ya usa `rutaCanonica()` en las
   * páginas; aquí faltaba, así que el mapa y las páginas se contradecían.
   */
  languages["x-default"] = `${SITIO.url}/${routing.defaultLocale}${ruta}`;

  return {
    url: `${SITIO.url}/${routing.defaultLocale}${ruta}`,
    lastModified: new Date(),
    changeFrequency: frecuencia,
    priority: prioridad,
    alternates: { languages },
  };
}

/**
 * Las paginas fijas, en orden de importancia.
 *
 * OJO al agregar una pagina publica: si no entra en esta lista, Google no la
 * encuentra por el mapa. La prueba de enlaces (e2e/enlaces.spec.ts) comprueba
 * que no haya 404; esta lista comprueba que ademas se busque.
 */
const FIJAS: [
  string,
  number,
  MetadataRoute.Sitemap[number]["changeFrequency"],
][] = [
  ["", 1, "daily"],
  ["/catalogo", 0.9, "daily"],
  ["/tiendas", 0.8, "daily"],
  ["/docs/modelo-de-negocio", 0.9, "monthly"],
  ["/docs", 0.8, "monthly"],
  ["/blog", 0.8, "weekly"],
  ["/vender", 0.8, "monthly"],
  ["/como-funciona", 0.7, "monthly"],
  ["/nosotros", 0.7, "monthly"],
  ["/transparencia", 0.7, "monthly"],
  ["/vender/comisiones", 0.6, "monthly"],
  ["/ayuda", 0.6, "monthly"],
  /* Entrega y devoluciones: Google Merchant Center las exige publicadas y
     encontrables. Si no están en el mapa, no las encuentra por aquí. */
  ["/entrega", 0.6, "monthly"],
  ["/devoluciones", 0.6, "monthly"],
  ["/terminos", 0.4, "yearly"],
  ["/privacidad", 0.4, "yearly"],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas = FIJAS.map(([ruta, prioridad, frecuencia]) =>
    entrada(ruta, prioridad, frecuencia),
  );

  /* Cada artículo del blog y de la documentación es una página propia y entra
     sola al mapa. Es todo el sentido de tenerlos como páginas separadas: cada
     cosa que se publica suma para Google. Se leen del español, que es donde
     están todos; `entrada()` ya escribe las dos versiones de idioma. */
  for (const articulo of articulosDe("es")) {
    paginas.push(entrada(rutaDeArticulo(articulo), 0.7, "monthly"));
  }

  // El catalogo se suma si la base responde. Si no responde, el mapa sale
  // igual con las paginas fijas: mas vale un mapa corto que ninguno.
  try {
    const db = await getDbAsync();

    /**
     * Solo las tiendas QUE YA TIENEN ALGO QUE ENSEÑAR.
     *
     * Antes iban todas las activas, y eso mandaba a Google a fichas vacías: el
     * 9 ago 2026 había dos comercios recién creados, sin un solo producto, y
     * los dos estaban en el mapa. Google entra, no encuentra nada que indexar,
     * y esa visita cuenta en su contra — es de donde salen las «rastreada:
     * actualmente sin indexar».
     *
     * OJO, QUE PARECE UNA CONTRADICCIÓN Y NO LO ES: el directorio de
     * `/tiendas` **sí las enseña**, aunque estén vacías. Son dos públicos
     * distintos. Al directorio entra el comerciante a mirar cómo quedó la suya
     * —y no encontrarla se lee como que el sistema no funciona—; el mapa es
     * para Google, y una página sin contenido solo le gasta la visita.
     *
     * En cuanto el comercio publique su primer producto entra sola en el
     * siguiente mapa. No hay nada que activar a mano.
     */
    const tiendas = await db
      .selectDistinct({ slug: schema.tiendas.slug })
      .from(schema.tiendas)
      .innerJoin(
        schema.productos,
        eq(schema.productos.tiendaId, schema.tiendas.id),
      )
      .where(
        and(
          eq(schema.tiendas.estado, "activa"),
          eq(schema.productos.estado, "publicado"),
          /* Este mapa es el de mercatren.com: sus direcciones llevan ese
             dominio, asi que solo lista el mercado principal. Cada pais
             tendra el suyo cuando su catalogo exista (PLAN-PAISES.md). */
          eq(schema.tiendas.mercado, MERCADO_PRINCIPAL.codigo),
        ),
      );

    const productos = await db
      .select({ slug: schema.productos.slug })
      .from(schema.productos)
      .innerJoin(
        schema.tiendas,
        eq(schema.tiendas.id, schema.productos.tiendaId),
      )
      .where(
        and(
          eq(schema.productos.estado, "publicado"),
          eq(schema.tiendas.mercado, MERCADO_PRINCIPAL.codigo),
        ),
      );

    for (const t of tiendas) {
      paginas.push(entrada(`/tienda/${t.slug}`, 0.7, "weekly"));
    }
    for (const p of productos) {
      paginas.push(entrada(`/producto/${p.slug}`, 0.6, "weekly"));
    }
  } catch {
    // Sin base disponible (por ejemplo en un build sin enlazar): solo fijas.
  }

  return paginas;
}
