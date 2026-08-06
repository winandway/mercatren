import { and, eq, gt, sql } from "drizzle-orm";

import { getDbAsync, schema } from "@/lib/db";
import { SITIO } from "@/lib/sitio";

/**
 * EL CATÁLOGO PARA GOOGLE SHOPPING.
 *
 * Google Merchant Center no sabe leer una tienda sola: hay que entregarle un
 * archivo con todos los productos. Este lo genera al vuelo desde la base, así
 * que **siempre está al día**: cambia un precio en el panel y el archivo ya
 * lo dice. Las otras vías que ofrece Google —un escaneo de una sola vez, una
 * hoja de cálculo, cargarlos a mano— envejecen el mismo día que un comercio
 * toca un precio, y Google rechaza el producto cuando el precio del archivo
 * no coincide con el de la página.
 *
 * VA EN /datos Y NO EN /api: en YaDominios Cloud ese prefijo lo capturan los
 * archivos estáticos antes de llegar al código (regla 1 del proyecto).
 *
 * TODO LO QUE SALE DE AQUÍ ES PÚBLICO — es el mismo catálogo que cualquiera
 * ve en la tienda. Nada de comercios, saldos ni pagadores.
 *
 * DOS COSAS QUE GOOGLE RECHAZA SI SE HACEN MAL:
 *
 * 1. **El precio tiene que ser idéntico al de la página.** Por eso sale de
 *    `precio_centavos`, que es exactamente el que se cobra, y se escribe con
 *    dos decimales y el código de moneda ("12.34 USD"), nunca con el símbolo.
 *
 * 2. **Un producto sin código de barras tiene que decirlo.** Casi nada del
 *    catálogo de una ferretería tiene GTIN. Si no se declara
 *    `identifier_exists: no`, Google lo rechaza por "faltan identificadores"
 *    — y son cientos de productos.
 */
export const dynamic = "force-dynamic";

/** Lo que XML no soporta crudo. `&` primero o se escaparía dos veces. */
function escapar(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Centavos enteros → "12.34 USD", que es lo que Google espera. */
function precio(centavos: number, moneda: string): string {
  return `${(centavos / 100).toFixed(2)} ${moneda}`;
}

/**
 * Google corta los títulos a 150 caracteres. Cortarlo aquí, en un espacio,
 * se lee mucho mejor que dejar que Google lo parta a la mitad de una palabra.
 */
function recortar(texto: string, maximo: number): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= maximo) return limpio;
  const corte = limpio.slice(0, maximo);
  const espacio = corte.lastIndexOf(" ");
  return (espacio > maximo * 0.6 ? corte.slice(0, espacio) : corte).trim();
}

export async function GET() {
  let filas: {
    slug: string;
    titulo: string;
    descripcion: string | null;
    precioCentavos: number;
    moneda: string;
    existencias: number;
    controla: boolean;
    marca: string | null;
    sku: string | null;
    tienda: string;
    foto: string | null;
    fotoClave: string | null;
  }[] = [];

  try {
    const db = await getDbAsync();
    const { productos, tiendas, imagenesProducto } = schema;

    filas = await db
      .select({
        slug: productos.slug,
        titulo: productos.tituloEs,
        descripcion: productos.descripcionEs,
        precioCentavos: productos.precioCentavos,
        moneda: productos.moneda,
        existencias: productos.existencias,
        controla: productos.controlaExistencias,
        marca: productos.marca,
        sku: productos.sku,
        tienda: tiendas.nombre,
        /* La primera foto. Si vino del sistema del comercio trae `url`; si se
           subió a nuestro bucket, `clave` y se sirve por /media. */
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
          eq(tiendas.estado, "activa"),
          // Un producto sin precio no se le manda a Google: lo rechazaría, y
          // con razón — no se puede comprar algo que no tiene precio.
          gt(productos.precioCentavos, 0),
        ),
      );
  } catch (e) {
    console.error("[google] no se pudo armar el catálogo:", e);
    // Un archivo vacío es mejor que un error: Google reintenta mañana en vez
    // de marcar el archivo como roto.
    filas = [];
  }

  const articulos = filas
    .map((p) => {
      const url = `${SITIO.url}/es/producto/${p.slug}`;
      const foto = p.fotoClave
        ? `${SITIO.url}/media/${p.fotoClave}`
        : (p.foto ?? null);

      /* Sin descripción propia se arma una honesta con lo que sí sabemos.
         Google penaliza las fichas sin descripción. */
      const descripcion = recortar(
        p.descripcion ?? `${p.titulo}. Disponible en ${p.tienda}.`,
        5000,
      );

      const hayStock = !p.controla || p.existencias > 0;

      return [
        "<item>",
        `<g:id>${escapar(p.slug)}</g:id>`,
        `<g:title>${escapar(recortar(p.titulo, 150))}</g:title>`,
        `<g:description>${escapar(descripcion)}</g:description>`,
        `<g:link>${escapar(url)}</g:link>`,
        foto ? `<g:image_link>${escapar(foto)}</g:image_link>` : "",
        `<g:availability>${hayStock ? "in_stock" : "out_of_stock"}</g:availability>`,
        `<g:price>${precio(p.precioCentavos, p.moneda)}</g:price>`,
        "<g:condition>new</g:condition>",
        p.marca ? `<g:brand>${escapar(p.marca)}</g:brand>` : "",
        p.sku ? `<g:mpn>${escapar(p.sku)}</g:mpn>` : "",
        /* CASI NADA DEL CATÁLOGO TIENE CÓDIGO DE BARRAS. Un tubo de PVC
           cortado en una ferretería no tiene GTIN. Sin esta línea, Google
           rechaza cientos de productos por "faltan identificadores". */
        "<g:identifier_exists>no</g:identifier_exists>",
        `<g:product_type>${escapar(recortar(p.tienda, 100))}</g:product_type>`,
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${escapar(SITIO.nombre)}</title>
<link>${escapar(SITIO.url)}</link>
<description>Catálogo de ${escapar(SITIO.nombre)}</description>
${articulos}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Google lo lee una vez al día; una hora de caché le ahorra trabajo a
      // la base sin que un cambio de precio tarde en llegar.
      "cache-control": "public, max-age=3600",
    },
  });
}
