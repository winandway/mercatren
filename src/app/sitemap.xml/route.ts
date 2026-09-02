import { and, eq, sql } from "drizzle-orm";

import { getDbAsync, schema } from "@/lib/db";
import { mercadoActual } from "@/lib/mercado/actual";
import { esMercadoPrincipal } from "@/lib/mercado/mercados";
import { indiceXml, partesDeProductos } from "@/lib/seo/mapa";
import { SITIO } from "@/lib/sitio";

/**
 * `/sitemap.xml` ES UN ÍNDICE desde el 2 sep 2026 (ver `lib/seo/mapa.ts`).
 *
 * La dirección que ya tiene Search Console no cambia; lo que cambia es que
 * ahora apunta a trozos de 40.000 fichas, porque con el almacén completo de
 * CJ un solo archivo pasaba del tope de Google y se descartaba entero.
 *
 * ══ CADA DOMINIO SIRVE EL SUYO ══
 *
 * La base sale del dominio de la petición y el conteo se filtra por SU
 * mercado: un mapa que apunta a otro dominio Google lo descarta por dominio
 * cruzado. Por eso es `force-dynamic` y lee `mercadoActual`.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const mercado = await mercadoActual();
  const base = esMercadoPrincipal(mercado)
    ? SITIO.url
    : `https://${mercado.dominio}`;

  let partes = 0;
  try {
    const db = await getDbAsync();
    const [fila] = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.productos)
      .innerJoin(
        schema.tiendas,
        eq(schema.tiendas.id, schema.productos.tiendaId),
      )
      .where(
        and(
          eq(schema.productos.estado, "publicado"),
          eq(schema.tiendas.mercado, mercado.codigo),
        ),
      );
    partes = partesDeProductos(Number(fila?.n ?? 0));
  } catch {
    /* Sin base (un build sin enlazar): el índice sale solo con las páginas
       fijas. Más vale un mapa corto que ninguno. */
  }

  const lista = [
    { loc: `${base}/mapa/paginas.xml` },
    ...Array.from({ length: partes }, (_, i) => ({
      loc: `${base}/mapa/productos-${i}.xml`,
    })),
  ];

  return new Response(indiceXml(lista), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
