import { getCloudflareContext } from "@opennextjs/cloudflare";

import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pedidos } from "@/lib/db/schema";
import { MEDIA_PRIVADOS } from "@/lib/media/privados";
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

/**
 * Los prefijos que NO son públicos.
 *
 * La lista vive en `@/lib/media/privados` porque el robots.txt tiene que decir
 * exactamente lo mismo: ahí se explica por qué (cerrar `/media/` entero dejó
 * el 99,8 % del catálogo fuera de Google Shopping).
 */
function esPrivado(ruta: string) {
  return MEDIA_PRIVADOS.some((prefijo) => ruta.startsWith(prefijo));
}

export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ clave: string[] }> },
) {
  const { clave } = await params;
  const ruta = clave.join("/");

  if (ruta.includes("..")) {
    return new Response("No encontrado", { status: 404 });
  }

  if (esPrivado(ruta) && !(await puedeVerlo(ruta))) {
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
    "cache-control": esPrivado(ruta)
      ? "private, max-age=0, must-revalidate"
      : "public, max-age=31536000, immutable",
  });

  // Se manda el contenido completo, no el flujo tal cual: el flujo que
  // devuelve el bucket no viaja bien por todos los entornos donde corre esto.
  // Son imagenes de pocos megabytes, asi que no compensa complicarlo.
  return new Response(await archivo.arrayBuffer(), { headers: cabeceras });
}

/**
 * Quien puede ver un archivo privado.
 *
 * Cada prefijo lleva el id de su dueno en la propia ruta, asi que basta una
 * consulta por archivo, sin cruces:
 *
 *   comprobantes/<id del pedido>/<archivo>      → el dueno de ese pedido
 *   facturas-compra/<id de la tienda>/<archivo> → esa tienda
 */
async function puedeVerlo(ruta: string) {
  // TODO LO DE AQUI FALLA HACIA "NO". Si algo revienta —la sesion no se puede
  // leer, la base no responde— la respuesta es que no, y arriba se contesta
  // 404. Un error tecnico jamas puede terminar en un 500 sobre la ruta de los
  // comprobantes: un 500 ahi ya dice que ese camino existe y que algo pasa
  // detras. Paso de verdad en produccion.
  try {
    const usuario = await obtenerUsuario();
    if (!usuario) return false;

    if (await esEquipoInterno()) return true;

    const duenno = ruta.split("/")[1];
    if (!duenno) return false;

    const db = getDb();

    /**
     * La captura de una transferencia: solo el comercio a quien se le pagó.
     *
     * En la ruta viene el id del RETIRO, no el de la tienda, así que hay que
     * mirar la base. Se compara contra el alcance de la sesión y no contra
     * nada que venga en el enlace: así un vendedor no puede ver el pago de
     * otro cambiando la dirección a mano.
     */
    if (ruta.startsWith("retiros/")) {
      const { obtenerAlcance } = await import("@/lib/autorizacion");
      const alcance = await obtenerAlcance();
      if (alcance.tipo !== "tienda") return false;

      const { retiros } = await import("@/lib/db/schema");
      const [suyo] = await db
        .select({ id: retiros.id })
        .from(retiros)
        .where(
          and(eq(retiros.id, duenno), eq(retiros.tiendaId, alcance.tiendaId)),
        )
        .limit(1);

      return Boolean(suyo);
    }

    /* LA FACTURA DEL PROVEEDOR NO LA VE NADIE MÁS QUE EL EQUIPO.
       Lleva el costo real de la mercancía, que es de donde sale el margen. El
       equipo ya salió por arriba con `esEquipoInterno`; aquí se cierra en
       seco para que no caiga al comodín del final, que compara contra
       `pedidos` y podría dejar pasar a alguien por parecido de id. */
    if (ruta.startsWith("facturas-proveedor/")) return false;

    /* La factura de compra: solo el comercio que la subió. Se comprueba
       contra el alcance de la sesión, no contra la ruta — así un vendedor no
       puede leer la de otro cambiando el enlace a mano. */
    if (ruta.startsWith("facturas-compra/")) {
      const { obtenerAlcance } = await import("@/lib/autorizacion");
      const alcance = await obtenerAlcance();
      return alcance.tipo === "tienda" && alcance.tiendaId === duenno;
    }

    const [suyo] = await db
      .select({ id: pedidos.id })
      .from(pedidos)
      .where(and(eq(pedidos.id, duenno), eq(pedidos.clienteId, usuario.id)))
      .limit(1);

    return Boolean(suyo);
  } catch (e) {
    console.error("[media] no se pudo comprobar el permiso:", e);
    return false;
  }
}
