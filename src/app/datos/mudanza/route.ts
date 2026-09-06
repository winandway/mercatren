import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";
import { MERCADO_PRINCIPAL } from "@/lib/mercado/mercados";

/**
 * LA LISTA DE LO QUE SE MUDÓ DE DOMINIO.
 *
 * ══ POR QUÉ EXISTE ESTA RUTA (6 sep 2026) ══
 *
 * La redirección de las fichas venezolanas estaba dentro de la página, y
 * MEDIDO EN PRODUCCIÓN no sirve: en el borde de Cloudflare, un
 * `permanentRedirect` desde una página sale **dentro del HTML con un 200**.
 * Google lee ese 200 como «la página sigue aquí» y no traspasa nada; las mil
 * fichas que Venezuela tenía indexadas se perderían igual.
 *
 * El único sitio que devuelve un 308 de verdad es el middleware — y el
 * middleware no puede consultar la base. Así que se la damos hecha: esta
 * ruta le entrega la lista de slugs mudados, él la guarda en memoria y
 * decide en microsegundos, sin una consulta por visita.
 *
 * ══ POR QUÉ SOLO LOS MUDADOS Y NO «TODO LO QUE NO ES DEL PRINCIPAL» ══
 *
 * Chile y Colombia tienen decenas de miles de fichas y nunca estuvieron
 * indexadas en mercatren.com: incluirlas haría una lista enorme para
 * redirigir direcciones que nadie pidió nunca. Aquí van solo los comercios
 * que ESTUVIERON en el dominio principal y se fueron — los venezolanos.
 */
export const dynamic = "force-dynamic";

/** Se refresca cada hora: una tienda nueva de Venezuela entra sola. */
const VIGENCIA_SEGUNDOS = 3600;

export async function GET() {
  try {
    const db = getDb();

    /* El mismo criterio que el SQL de la mudanza (`pais_origen = 'VE'`), así
       que las dos cosas no se pueden desincronizar. */
    const [fichas, comercios] = await Promise.all([
      db
        .select({ slug: productos.slug, mercado: tiendas.mercado })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .where(eq(tiendas.paisOrigen, "VE")),
      db
        .select({ slug: tiendas.slug, mercado: tiendas.mercado })
        .from(tiendas)
        .where(eq(tiendas.paisOrigen, "VE")),
    ]);

    /* Solo lo que YA no vive en el principal: mientras el dato no se mueva,
       esta lista sale VACÍA y el middleware no redirige nada. Eso es lo que
       deja publicar el código días antes de la mudanza sin efecto alguno. */
    const fuera = (f: { mercado: string }) =>
      f.mercado !== MERCADO_PRINCIPAL.codigo;

    return Response.json(
      {
        productos: Object.fromEntries(
          fichas.filter(fuera).map((f) => [f.slug, f.mercado]),
        ),
        tiendas: Object.fromEntries(
          comercios.filter(fuera).map((c) => [c.slug, c.mercado]),
        ),
      },
      { headers: { "cache-control": `public, max-age=${VIGENCIA_SEGUNDOS}` } },
    );
  } catch {
    /* Sin lista, el middleware no redirige — que es exactamente como se
       comportaba el sitio antes. Un fallo aquí no puede tumbar la tienda. */
    return Response.json({ productos: {}, tiendas: {} }, { status: 200 });
  }
}
