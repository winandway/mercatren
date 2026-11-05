import {
  contextoDe,
  fichaParaApp,
  respuestaDeError,
  respuestaPublica,
} from "@/lib/app-movil/datos";
import { obtenerProductoPorSlug } from "@/lib/catalogo/consultas";

export const dynamic = "force-dynamic";

/**
 * La ficha de un producto para la app, en el idioma pedido. Lo que no se ve
 * en este país (o no existe) da 404, igual que en la web. Ver
 * `lib/app-movil/datos.ts`: nada interno sale por aquí.
 */
export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,200}$/i.test(slug)) return respuestaDeError("slug", 400);

  try {
    const ficha = await obtenerProductoPorSlug(contexto.mercado, slug);
    if (!ficha) return respuestaDeError("no_existe", 404);
    return respuestaPublica({
      ok: true,
      producto: fichaParaApp(ficha, contexto.idioma),
    });
  } catch (fallo) {
    console.error("[app/producto]", fallo);
    return respuestaDeError("base", 503);
  }
}
