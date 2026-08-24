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

export async function HEAD(
  peticion: Request,
  ctx: { params: Promise<{ clave: string[] }> },
) {
  /* Algunos reproductores preguntan primero con HEAD por el tamaño. */
  const r = await GET(peticion, ctx);
  return new Response(null, { status: r.status, headers: r.headers });
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

  /**
   * ══ LO PÚBLICO SE GUARDA EN EL BORDE (24 ago 2026) ══
   *
   * Un video sale del bucket en trozos, y cada trozo pasaba por el worker: por
   * eso «algunos videos se quedan pegados al darles play». Guardando la
   * respuesta en la caché del borde, el segundo espectador —y el mismo, al
   * saltar en la barra— la recibe sin tocar ni el worker ni R2.
   *
   * Solo lo PÚBLICO: los comprobantes y las facturas del proveedor jamás se
   * guardan en una caché compartida. Y si la caché no existe (en local no
   * está), se sigue como siempre.
   */
  const cacheDelBorde = !esPrivado(ruta)
    ? (globalThis as { caches?: { default?: Cache } }).caches?.default
    : undefined;
  if (cacheDelBorde) {
    const guardada = await cacheDelBorde
      .match(_peticion)
      .catch(() => undefined);
    if (guardada) return guardada;
  }

  /**
   * ══ LOS VIDEOS SE SIRVEN POR RANGOS (23 ago 2026) ══
   *
   * Un video no se descarga entero para empezar a verse: el reproductor pide
   * el primer trozo, y para saltar al minuto uno pide otro. Sin `Range`, el
   * navegador tiene que bajarse los 40 MB antes de mostrar el primer
   * fotograma y la barra de tiempo no deja saltar — que es exactamente lo que
   * hace que una hilera de Shorts se sienta rota.
   *
   * R2 sabe leer un rango del objeto, así que el trozo se pide al bucket y se
   * contesta 206 con `Content-Range`. `Accept-Ranges: bytes` va siempre: es lo
   * que le dice al reproductor que puede pedir trozos.
   */
  const esVideo = /\.(mp4|mov|webm|m4v|3gp)$/i.test(ruta);
  const rango = _peticion.headers.get("range");
  if (esVideo && rango) {
    const m = /bytes=(\d*)-(\d*)/.exec(rango);
    if (m) {
      const cabecera = await env.BUCKET.head(ruta);
      if (!cabecera) return new Response("No encontrado", { status: 404 });
      const total = cabecera.size;
      const desde = m[1] ? Number(m[1]) : 0;
      const hasta = m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
      if (Number.isNaN(desde) || desde >= total || hasta < desde) {
        return new Response("Rango fuera de sitio", {
          status: 416,
          headers: { "content-range": `bytes */${total}` },
        });
      }
      const trozo = await env.BUCKET.get(ruta, {
        range: { offset: desde, length: hasta - desde + 1 },
      });
      if (!trozo) return new Response("No encontrado", { status: 404 });
      return new Response(await trozo.arrayBuffer(), {
        status: 206,
        headers: {
          "content-type": cabecera.httpMetadata?.contentType ?? "video/mp4",
          "content-range": `bytes ${desde}-${hasta}/${total}`,
          "content-length": String(hasta - desde + 1),
          "accept-ranges": "bytes",
          etag: cabecera.httpEtag,
          "cache-control": esPrivado(ruta)
            ? "private, max-age=0, must-revalidate"
            : "public, max-age=31536000, immutable",
        },
      });
    }
  }

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
    /* Le dice al reproductor que puede pedir trozos: sin esto no hay saltos
       en la barra de tiempo ni arranque rápido. */
    "accept-ranges": "bytes",
  });

  // Se manda el contenido completo, no el flujo tal cual: el flujo que
  // devuelve el bucket no viaja bien por todos los entornos donde corre esto.
  // Son imagenes de pocos megabytes, asi que no compensa complicarlo.
  const respuesta = new Response(await archivo.arrayBuffer(), {
    headers: cabeceras,
  });
  /* Y se deja en el borde para la próxima. `waitUntil` no está garantizado
     aquí, así que se guarda una copia sin esperar a que termine. */
  if (cacheDelBorde) {
    void cacheDelBorde.put(_peticion, respuesta.clone()).catch(() => {});
  }
  return respuesta;
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
