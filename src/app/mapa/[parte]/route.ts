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
  videosXml,
  type EntradaMapa,
  type EntradaVideo,
} from "@/lib/seo/mapa";
import { SITIO } from "@/lib/sitio";

/**
 * LOS TROZOS DEL MAPA DEL SITIO (3 sep 2026):
 *
 *   /mapa/paginas.xml      lo fijo, el blog y la documentación
 *   /mapa/tiendas.xml      las tiendas QUE YA TIENEN ALGO QUE ENSEÑAR
 *   /mapa/videos.xml       un mapa de VIDEOS de Google: portada, título,
 *                          archivo, duración, vistas y fecha
 *   /mapa/productos-N.xml  40.000 fichas por trozo, cada una con su foto
 *
 * Cuatro clases y no una lista, a propósito: Google reporta cada mapa por
 * separado y así se ve de un vistazo dónde falla la indexación. Cada
 * dominio sirve el suyo, filtrado por su mercado, con `lastmod` de verdad.
 */
export const dynamic = "force-dynamic";

const CABECERAS = {
  "content-type": "application/xml; charset=utf-8",
  "cache-control": "public, max-age=3600",
};

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
  const idiomas = routing.locales;
  const porDefecto = routing.defaultLocale;

  if (pedido.tipo === "videos") {
    const videos: EntradaVideo[] = [];
    try {
      const { videosParaMapaCompleto } = await import("@/lib/videos/consultas");
      for (const v of await videosParaMapaCompleto(mercado.codigo)) {
        /* Sin portada Google no lo indexa como video: se salta ese, no el mapa. */
        if (!v.portada) continue;
        videos.push({
          ruta: `/video/${v.slug}`,
          titulo: v.titulo,
          descripcion: v.descripcion,
          portada: `${base}${v.portada}`,
          archivo: `${base}${v.archivo}`,
          duracionSegundos: v.duracionSegundos,
          vistas: v.vistas,
          publicado: v.creadoEn,
          modificado: v.actualizadoEn,
        });
      }
    } catch {
      /* Sin base: el mapa de videos sale vacío, no roto. */
    }
    return new Response(videosXml({ base, idiomas, porDefecto, videos }), {
      headers: CABECERAS,
    });
  }

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
  } else if (pedido.tipo === "tiendas") {
    try {
      const db = await getDbAsync();
      /* Solo las que YA tienen algo que enseñar: mandar a Google a una ficha
         vacía cuenta en contra (las «rastreada: actualmente sin indexar»). */
      const tiendas = await db
        .select({
          slug: schema.tiendas.slug,
          actualizadoEn: sql<number>`max(${schema.productos.actualizadoEn})`,
        })
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
        )
        .groupBy(schema.tiendas.slug);
      for (const t of tiendas) {
        entradas.push({
          ruta: `/tienda/${t.slug}`,
          prioridad: 0.7,
          frecuencia: "weekly",
          modificado: t.actualizadoEn
            ? new Date(Number(t.actualizadoEn) * 1000)
            : null,
        });
      }
    } catch {
      /* Sin base: mapa vacío, no roto. */
    }
  } else {
    try {
      const db = await getDbAsync();
      const { productos, tiendas, imagenesProducto } = schema;
      const [conteo] = await db
        .select({ n: sql<number>`count(*)` })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .where(
          and(
            eq(productos.estado, "publicado"),
            eq(tiendas.mercado, mercado.codigo),
          ),
        );
      if (pedido.indice >= partesDeProductos(Number(conteo?.n ?? 0))) {
        return new Response("No existe.", { status: 404 });
      }
      const fichas = await db
        .select({
          slug: productos.slug,
          actualizadoEn: productos.actualizadoEn,
          /* La primera foto, como en el feed de Google: `url` si vino del
             sistema del comercio, `clave` si está en nuestro bucket. */
          foto: sql<
            string | null
          >`(SELECT ${imagenesProducto.url} FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY ${imagenesProducto.orden} LIMIT 1)`,
          fotoClave: sql<
            string | null
          >`(SELECT ${imagenesProducto.clave} FROM ${imagenesProducto} WHERE ${imagenesProducto.productoId} = ${productos.id} ORDER BY ${imagenesProducto.orden} LIMIT 1)`,
        })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .where(
          and(
            eq(productos.estado, "publicado"),
            eq(tiendas.mercado, mercado.codigo),
          ),
        )
        /* Orden estable: el mismo producto cae siempre en el mismo trozo. */
        .orderBy(asc(productos.creadoEn), asc(productos.id))
        .limit(POR_PARTE)
        .offset(pedido.indice * POR_PARTE);
      for (const p of fichas) {
        entradas.push({
          ruta: `/producto/${p.slug}`,
          prioridad: 0.6,
          frecuencia: "weekly",
          modificado: p.actualizadoEn,
          imagen: p.fotoClave
            ? `${base}/media/${p.fotoClave}`
            : (p.foto ?? null),
        });
      }
    } catch {
      return new Response("No existe.", { status: 404 });
    }
  }

  return new Response(urlsetXml({ base, idiomas, porDefecto, entradas }), {
    headers: CABECERAS,
  });
}
