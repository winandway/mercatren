import { seguridadDelProducto } from "@/lib/productos/seguridad-consultas";
import {
  contextoDe,
  fichaParaApp,
  respuestaDeError,
  respuestaPublica,
} from "@/lib/app-movil/datos";
import { obtenerProductoPorSlug } from "@/lib/catalogo/consultas";
import { ocultosParaLaApp, quienMira } from "@/lib/moderacion/para-la-app";
import { estaOcultoParaLaApp } from "@/lib/moderacion/reglas";

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
    /* Denunciado tres veces, o de un vendedor que quien mira bloqueó: para
       esa persona no existe (sin cookie no se lee ningún bloqueo). */
    const ocultos = await ocultosParaLaApp(await quienMira(peticion));
    if (
      estaOcultoParaLaApp(
        { id: ficha.producto.id, tienda: { slug: ficha.tiendaSlug } },
        ocultos,
      )
    ) {
      return respuestaDeError("no_existe", 404);
    }
    /* España: quién fabrica el producto (Reglamento UE 2023/988, art. 19).
       Fuera de España no lee la base. */
    const seguridad = await seguridadDelProducto(
      ficha.producto.id,
      contexto.mercado.codigo,
    );
    const es = contexto.idioma === "es";
    return respuestaPublica({
      ok: true,
      producto: {
        ...fichaParaApp(ficha, contexto.idioma),
        seguridad: seguridad
          ? {
              fabricante: [
                seguridad.fabricanteNombre,
                seguridad.fabricanteDireccion,
                seguridad.fabricanteCorreo,
              ].join(" · "),
              responsableUe: seguridad.responsableUe,
              advertencias: es
                ? seguridad.advertenciasEs
                : (seguridad.advertenciasEn ?? seguridad.advertenciasEs),
            }
          : null,
      },
    });
  } catch (fallo) {
    console.error("[app/producto]", fallo);
    return respuestaDeError("base", 503);
  }
}
