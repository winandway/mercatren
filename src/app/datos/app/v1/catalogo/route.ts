import { z } from "zod";

import {
  contextoDe,
  productoParaApp,
  respuestaDeError,
  respuestaPublica,
} from "@/lib/app-movil/datos";
import { listarProductos } from "@/lib/catalogo/consultas";

export const dynamic = "force-dynamic";

const esquemaFiltros = z.object({
  q: z.string().trim().max(80).optional(),
  pagina: z.coerce.number().int().min(1).max(200).default(1),
  categoria: z.string().trim().max(80).optional(),
  tienda: z.string().trim().max(120).optional(),
});

/**
 * El catálogo del país, de a 24, para la app: la portada, una búsqueda, una
 * categoría o una tienda. Usa el mismo `listarProductos` que la web, con el
 * mismo muro por país. Ver `lib/app-movil/datos.ts`.
 */
export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const contexto = contextoDe(url);
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const filtros = esquemaFiltros.safeParse({
    q: url.searchParams.get("q") || undefined,
    pagina: url.searchParams.get("pagina") || undefined,
    categoria: url.searchParams.get("categoria") || undefined,
    tienda: url.searchParams.get("tienda") || undefined,
  });
  if (!filtros.success) return respuestaDeError("filtros", 400);

  try {
    const r = await listarProductos(contexto.mercado, {
      busqueda: filtros.data.q,
      pagina: filtros.data.pagina,
      porPagina: 24,
      categoria: filtros.data.categoria,
      comercio: filtros.data.tienda,
    });
    return respuestaPublica({
      ok: true,
      productos: r.productos.map((p) => productoParaApp(p, contexto.idioma)),
      pagina: r.pagina,
      paginas: r.paginas,
      total: r.total,
    });
  } catch (fallo) {
    console.error("[app/catalogo]", fallo);
    return respuestaDeError("base", 503);
  }
}
