import { and, asc, eq, sql } from "drizzle-orm";

import { articulosDe, rutaDeArticulo } from "@/contenido/articulos";
import { routing } from "@/i18n/routing";
import { getDbAsync, schema } from "@/lib/db";
import { mercadoActual } from "@/lib/mercado/actual";
import { esMercadoPrincipal } from "@/lib/mercado/mercados";
import {
  FIJAS,
  POR_PARTE,
  leerParte,
  partesDeProductos,
  urlsetXml,
  type EntradaMapa,
} from "@/lib/seo/mapa";
import { SITIO } from "@/lib/sitio";

/**
 * LOS TROZOS DEL MAPA DEL SITIO: `/mapa/paginas.xml` y `/mapa/productos-N.xml`.
 *
 * `paginas.xml` lleva lo fijo, el blog y la documentación, los videos y las
 * tiendas QUE YA TIENEN ALGO QUE ENSEÑAR (mandar a Google a una ficha vacía
 * cuenta en contra). `productos-N.xml` lleva 40.000 fichas cada uno, en un
 * orden estable (fecha de alta e id) para que el mismo producto caiga
 * siempre en el mismo trozo.
 *
 * Como el índice: cada dominio sirve el suyo, filtrado por su mercado.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _peticion: Request,
  contexto: { params: Promise<{ parte: string }> },
) {
  const { parte } = await contexto.params;
  const pedido = leerParte(parte);
  if (!pedido) return new Response("No existe.", { status: 404 });

  const mercado = await mercadoActual();
  const base = esMercadoPrincipal(mercado)
    ? SITIO.url
    : `https://${mercado.dominio}`;

  const entradas: EntradaMapa[] = [];

  if (pedido.tipo === "paginas") {
    for (const [ruta, prioridad, frecuencia] of FIJAS) {
      entradas.push({ ruta, prioridad, frecuencia });
    }
    for (const articulo of articulosDe("es")) {
      entradas.push({
        ruta: rutaDeArticulo(articulo),
        prioridad: 0.7,
        frecuencia: "monthly",
      });
    }
    try {
      const { videosParaMapa } = await import("@/lib/videos/consultas");
      for (const v of await videosParaMapa(mercado.codigo)) {
        entradas.push({
          ruta: `/video/${v.slug}`,
          prioridad: 0.6,
          frecuencia: "monthly",
          modificado: v.actualizadoEn,
        });
      }
    } catch {
      /* Sin videos el mapa sale igual. */
    }
    try {
      const db = await getDbAsync();
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
            eq(schema.tiendas.mercado, mercado.codigo),
          ),
        );
      for (const t of tiendas) {
        entradas.push({
          ruta: `/tienda/${t.slug}`,
          prioridad: 0.7,
          frecuencia: "weekly",
        });
      }
    } catch {
      /* Sin base: solo lo fijo. */
    }
  } else {
    try {
      const db = await getDbAsync();
      const [conteo] = await db
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
      if (pedido.indice >= partesDeProductos(Number(conteo?.n ?? 0))) {
        return new Response("No existe.", { status: 404 });
      }
      const productos = await db
        .select({
          slug: schema.productos.slug,
          actualizadoEn: schema.productos.actualizadoEn,
        })
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
        )
        .orderBy(asc(schema.productos.creadoEn), asc(schema.productos.id))
        .limit(POR_PARTE)
        .offset(pedido.indice * POR_PARTE);
      for (const p of productos) {
        entradas.push({
          ruta: `/producto/${p.slug}`,
          prioridad: 0.6,
          frecuencia: "weekly",
          modificado: p.actualizadoEn,
        });
      }
    } catch {
      return new Response("No existe.", { status: 404 });
    }
  }

  return new Response(
    urlsetXml({
      base,
      idiomas: routing.locales,
      porDefecto: routing.defaultLocale,
      entradas,
    }),
    {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}
