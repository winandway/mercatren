import { z } from "zod";

import {
  listarProductos,
  type OrdenCatalogo,
  parrillaDeProductos,
} from "@/lib/catalogo/consultas";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";
import { zonaDelCliente } from "@/lib/entrega/zona-cliente";
import { ciudadesVisiblesDesde } from "@/lib/entrega/zonas";

/**
 * Las siguientes tandas de la parrilla de la portada.
 *
 * LA CIUDAD VIENE DE LA COOKIE, la misma que leyó la portada: si la primera
 * tanda salió filtrada por Caracas, las siguientes también, o al bajar
 * aparecería mercancía de otra ciudad. `todas=1` la ignora (es la portada en
 * "toda Venezuela").
 *
 * Va en /datos y no en /api porque en YaDominios Cloud ese prefijo lo capturan
 * los archivos estáticos antes de llegar al código.
 *
 * LA SEMILLA VIENE DEL NAVEGADOR y es la que se generó al entrar. Sin ella
 * cada tanda barajaría de nuevo, y al bajar se verían productos repetidos y
 * otros que nunca aparecen. Es la misma visita, así que es el mismo orden.
 *
 * Todo lo que sale de aquí es público: son los productos publicados de
 * comercios activos, lo mismo que ya se ve en el catálogo.
 */
/** Lo que acepta `modo=lista`: texto corto y nada más. */
const texto = z.string().trim().min(1).max(120);
const FiltrosDeLista = z.object({
  q: texto.optional(),
  categoria: texto.optional(),
  comercio: texto.optional(),
  /* Un orden que no existe no rompe la lista: la página lo ignora y sale el
     de siempre, así que la tanda hace lo mismo. */
  orden: z
    .enum(["recientes", "precio_asc", "precio_desc"])
    .optional()
    .catch(undefined),
});

/** El equipo, buscando, ve también lo «en revisión» — igual que en la página. */
async function esDelEquipo(): Promise<boolean> {
  const { esEquipoInterno } = await import("@/lib/autorizacion");
  return esEquipoInterno().catch(() => false);
}

export async function GET(peticion: Request) {
  const url = new URL(peticion.url);

  const pagina = Math.max(1, Number(url.searchParams.get("pagina")) || 1);
  // Si llega una semilla rara, se usa una fija: mejor un orden estable que un
  // error. El |0 la deja en entero y descarta cualquier cosa que no sea número.
  const semilla = Number(url.searchParams.get("semilla")) | 0 || 7919;

  try {
    const zona =
      url.searchParams.get("todas") === "1" ? null : await zonaDelCliente();
    const visibles = zona ? ciudadesVisiblesDesde(zona.slug) : undefined;

    const mercado = await mercadoDeLaPeticion();

    /**
     * POR CATEGORÍA: lo usa la banda «más de lo que estabas mirando» de la
     * portada. Misma lógica de mercado y de zona que la parrilla; solo cambia
     * qué se pide. `limite` acotado: esto alimenta una fila, no una página.
     */
    /**
     * POR PALABRAS (`q`): lo usan los agentes (WebMCP, el skill de compra) y
     * cualquier integración. Es la misma búsqueda del sitio, con sinónimos.
     */
    /**
     * `modo=lista` (20 sep 2026): LAS TANDAS DE UN LISTADO AL BAJAR. El
     * catálogo, una búsqueda, un departamento o una tienda ya no llevan botón
     * «Siguiente»: la página trae las 24 primeras y de aquí salen las
     * siguientes. Tiene que ser EXACTAMENTE el mismo pedido que hace la página
     * (mismos filtros, mismas 24), o al bajar saldría otra cosa o se
     * repetirían productos. Ver `lib/catalogo/seguir-bajando.ts`.
     */
    if (url.searchParams.get("modo") === "lista") {
      const f = FiltrosDeLista.safeParse({
        q: url.searchParams.get("q") ?? undefined,
        categoria: url.searchParams.get("categoria") ?? undefined,
        comercio: url.searchParams.get("comercio") ?? undefined,
        orden: url.searchParams.get("orden") ?? undefined,
      });
      if (!f.success)
        return Response.json({ productos: [], pagina, paginas: pagina });
      const r = await listarProductos(mercado, {
        busqueda: f.data.q,
        paraElEquipo: f.data.q ? await esDelEquipo() : false,
        categoria: f.data.categoria,
        comercio: f.data.comercio,
        orden: f.data.orden as OrdenCatalogo | undefined,
        pagina,
        zona: visibles,
      });
      return Response.json({
        productos: r.productos,
        pagina: r.pagina,
        paginas: r.paginas,
      });
    }

    const q = url.searchParams.get("q")?.trim() || null;
    if (q) {
      const limite = Math.min(
        24,
        Math.max(4, Number(url.searchParams.get("limite")) || 12),
      );
      const r = await listarProductos(mercado, {
        busqueda: q,
        pagina,
        porPagina: limite,
        zona: visibles,
      });
      return Response.json(
        { productos: r.productos, pagina: r.pagina, paginas: r.paginas },
        { headers: { "Access-Control-Allow-Origin": "*" } },
      );
    }

    const categoria = url.searchParams.get("categoria")?.trim() || null;
    if (categoria) {
      const limite = Math.min(
        24,
        Math.max(4, Number(url.searchParams.get("limite")) || 12),
      );
      const r = await listarProductos(mercado, {
        categoria,
        pagina,
        porPagina: limite,
        zona: visibles,
      });
      return Response.json({
        productos: r.productos,
        pagina: r.pagina,
        paginas: r.paginas,
      });
    }

    const tanda = await parrillaDeProductos(
      mercado,
      semilla,
      pagina,
      24,
      visibles,
    );
    return Response.json({
      productos: tanda.productos,
      pagina: tanda.pagina,
      paginas: tanda.paginas,
    });
  } catch {
    // Que la portada deje de crecer es feo; que reviente, peor.
    return Response.json({ productos: [], pagina, paginas: pagina });
  }
}
