import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getDbAsync, schema } from "@/lib/db";
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
  ["/vender", 0.8, "monthly"],
  ["/como-funciona", 0.7, "monthly"],
  ["/nosotros", 0.7, "monthly"],
  ["/transparencia", 0.7, "monthly"],
  ["/vender/comisiones", 0.6, "monthly"],
  ["/ayuda", 0.6, "monthly"],
  ["/terminos", 0.4, "yearly"],
  ["/privacidad", 0.4, "yearly"],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas = FIJAS.map(([ruta, prioridad, frecuencia]) =>
    entrada(ruta, prioridad, frecuencia),
  );

  // El catalogo se suma si la base responde. Si no responde, el mapa sale
  // igual con las paginas fijas: mas vale un mapa corto que ninguno.
  try {
    const db = await getDbAsync();

    const tiendas = await db
      .select({ slug: schema.tiendas.slug })
      .from(schema.tiendas)
      .where(eq(schema.tiendas.estado, "activa"));

    const productos = await db
      .select({ slug: schema.productos.slug })
      .from(schema.productos)
      .where(eq(schema.productos.estado, "publicado"));

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
