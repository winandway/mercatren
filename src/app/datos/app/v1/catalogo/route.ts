import { z } from "zod";

import {
  contextoDe,
  productoParaApp,
  respuestaDeError,
  respuestaPublica,
} from "@/lib/app-movil/datos";
import { listarProductos } from "@/lib/catalogo/consultas";
import { ocultosParaLaApp, quienMira } from "@/lib/moderacion/para-la-app";
import { estaOcultoParaLaApp, sinOcultos } from "@/lib/moderacion/reglas";
import { promocionadosParaMostrar } from "@/lib/ganar/promociones";
import {
  mezclarPromocionados,
  PROMOCIONADOS_POR_DOCENA,
} from "@/lib/ganar/reglas";

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
    /* Lo denunciado tres veces no se ve, y lo de un vendedor que quien mira
       bloqueó tampoco. Sin cookie no hay a quién esconderle bloqueos: no se
       lee nada de ellos y la respuesta sigue siendo la que guarda el borde. */
    const ocultos = await ocultosParaLaApp(await quienMira(peticion));
    if (
      filtros.data.tienda &&
      (ocultos.tiendasBloqueadas.has(filtros.data.tienda) ||
        ocultos.tiendasDenunciadas.has(filtros.data.tienda))
    ) {
      return respuestaPublica({
        ok: true,
        productos: [],
        pagina: 1,
        paginas: 1,
        total: 0,
      });
    }
    const r = await listarProductos(contexto.mercado, {
      busqueda: filtros.data.q,
      pagina: filtros.data.pagina,
      porPagina: 24,
      categoria: filtros.data.categoria,
      comercio: filtros.data.tienda,
    });
    const lista = sinOcultos(
      r.productos.map((p) => productoParaApp(p, contexto.idioma)),
      ocultos,
    );
    /* LOS PROMOCIONADOS (Fase 4): solo en la primera página de la portada o
       de una búsqueda, como mucho 2 de cada 12 y con su etiqueta. Mostrarlos
       no escribe nada; el clic se cuenta aparte (`/datos/promo/clic`). */
    const conPromocionados =
      filtros.data.pagina === 1 &&
      !filtros.data.categoria &&
      !filtros.data.tienda &&
      lista.length > 0
        ? mezclarPromocionados(
            lista,
            (
              await promocionadosParaMostrar(
                contexto.mercado,
                PROMOCIONADOS_POR_DOCENA * Math.ceil(lista.length / 12),
              ).catch((fallo: unknown) => {
                /* Sin promocionados la lista sale igual; el fallo queda a la vista. */
                console.error("[app/catalogo] promocionados", fallo);
                return [];
              })
            )
              .map((p) => ({
                ...productoParaApp(p, contexto.idioma),
                patrocinado: { promocionId: p.promocionId, firma: p.firma },
              }))
              .filter((p) => !estaOcultoParaLaApp(p, ocultos)),
          )
        : lista;
    return respuestaPublica({
      ok: true,
      productos: conPromocionados,
      pagina: r.pagina,
      paginas: r.paginas,
      total: r.total,
    });
  } catch (fallo) {
    console.error("[app/catalogo]", fallo);
    return respuestaDeError("base", 503);
  }
}
