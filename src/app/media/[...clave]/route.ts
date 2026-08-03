import { getCloudflareContext } from "@opennextjs/cloudflare";

import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pedidos } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Sirve los archivos guardados en el bucket del sitio.
 *
 * Dos tipos de archivo, dos reglas distintas:
 *
 *  - Fotos de productos: publicas, las ve cualquiera.
 *  - Comprobantes de pago: son la captura del banco de una persona. Solo los
 *    ve quien hizo ese pedido y el equipo de Mercatren. Aunque la direccion
 *    lleva un codigo imposible de adivinar, no se deja abierta: un enlace
 *    reenviado por error no puede terminar mostrando el banco de alguien.
 */

const PRIVADOS = "comprobantes/";

export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ clave: string[] }> },
) {
  const { clave } = await params;
  const ruta = clave.join("/");

  if (ruta.includes("..")) {
    return new Response("No encontrado", { status: 404 });
  }

  if (ruta.startsWith(PRIVADOS) && !(await puedeVerComprobante(ruta))) {
    // Se responde "no existe" en vez de "no puedes": asi no se confirma
    // siquiera que el archivo esta ahi.
    return new Response("No encontrado", { status: 404 });
  }

  const { env } = getCloudflareContext();
  const archivo = await env.BUCKET.get(ruta);

  if (!archivo) return new Response("No encontrado", { status: 404 });

  // Las cabeceras se arman a mano en vez de copiarlas del objeto del bucket:
  // ese traspaso no funciona igual en todos los entornos donde corre esto.
  const cabeceras = new Headers({
    "content-type":
      archivo.httpMetadata?.contentType ?? "application/octet-stream",
    etag: archivo.httpEtag,
    "cache-control": ruta.startsWith(PRIVADOS)
      ? "private, max-age=0, must-revalidate"
      : "public, max-age=31536000, immutable",
  });

  // Se manda el contenido completo, no el flujo tal cual: el flujo que
  // devuelve el bucket no viaja bien por todos los entornos donde corre esto.
  // Son imagenes de pocos megabytes, asi que no compensa complicarlo.
  return new Response(await archivo.arrayBuffer(), { headers: cabeceras });
}

/**
 * Solo el dueno del pedido y el equipo de Mercatren.
 *
 * La ruta de un comprobante es `comprobantes/<id del pedido>/<archivo>`, asi
 * que basta con mirar de quien es ese pedido: una sola consulta, sin cruces.
 */
async function puedeVerComprobante(ruta: string) {
  // TODO LO DE AQUI FALLA HACIA "NO". Si algo revienta —la sesion no se puede
  // leer, la base no responde— la respuesta es que no, y arriba se contesta
  // 404. Un error tecnico jamas puede terminar en un 500 sobre la ruta de los
  // comprobantes: un 500 ahi ya dice que ese camino existe y que algo pasa
  // detras. Paso de verdad en produccion.
  try {
    const usuario = await obtenerUsuario();
    if (!usuario) return false;

    if (await esEquipoInterno()) return true;

    const pedidoId = ruta.split("/")[1];
    if (!pedidoId) return false;

    const db = getDb();
    const [suyo] = await db
      .select({ id: pedidos.id })
      .from(pedidos)
      .where(and(eq(pedidos.id, pedidoId), eq(pedidos.clienteId, usuario.id)))
      .limit(1);

    return Boolean(suyo);
  } catch (e) {
    console.error("[media] no se pudo comprobar el permiso:", e);
    return false;
  }
}
