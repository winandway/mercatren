import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { bloqueosUsuario, denunciasContenido, tiendas } from "@/lib/db/schema";

import { DENUNCIAS_PARA_OCULTAR, type OcultosParaLaApp } from "./reglas";

/**
 * LO QUE LA APP ESCONDE, LEÍDO DE LA BASE (6 nov 2026). Las reglas puras
 * (qué se esconde) viven en `reglas.ts`; aquí solo el ir y venir a la base.
 *
 * Sin sesión no se consulta NADA de bloqueos: ni siquiera se lee la sesión si
 * la petición no trae cookie (la ruta pública sigue siendo la que guarda el
 * borde cinco minutos). Quien trae cookie nunca se guarda en el borde, así
 * que su lista de bloqueados no se la puede llevar otra persona.
 */

/** Quien mira, o null. Sin cookie ni se mira la base. */
export async function quienMira(peticion: Request): Promise<string | null> {
  if (!peticion.headers.get("cookie")) return null;
  const usuario = await obtenerUsuario().catch(() => null);
  return usuario?.id ?? null;
}

/** Los slugs de las tiendas cuyo dueño bloqueó esta persona. */
export async function tiendasBloqueadasPor(
  usuarioId: string | null,
): Promise<Set<string>> {
  if (!usuarioId) return new Set();
  const filas = await getDb()
    .select({ slug: tiendas.slug })
    .from(tiendas)
    .where(
      sql`${tiendas.propietarioId} in (select "bloqueado_id" from "bloqueos_usuario" where "usuario_id" = ${usuarioId})`,
    );
  return new Set(filas.map((f) => f.slug));
}

/** Productos y tiendas con tres denuncias abiertas o más (se ocultan para todos). */
async function denunciados(): Promise<{
  productos: Set<string>;
  tiendas: Set<string>;
}> {
  const db = getDb();
  const filas = await db
    .select({
      tipo: denunciasContenido.tipo,
      objetoId: denunciasContenido.objetoId,
    })
    .from(denunciasContenido)
    .where(
      and(
        inArray(denunciasContenido.tipo, ["producto", "tienda"]),
        eq(denunciasContenido.estado, "abierta"),
      ),
    )
    .groupBy(denunciasContenido.tipo, denunciasContenido.objetoId)
    .having(sql`count(*) >= ${DENUNCIAS_PARA_OCULTAR}`);

  const idsDeTiendas = filas
    .filter((f) => f.tipo === "tienda")
    .map((f) => f.objetoId);
  const slugs = idsDeTiendas.length
    ? await db
        .select({ slug: tiendas.slug })
        .from(tiendas)
        .where(inArray(tiendas.id, idsDeTiendas))
    : [];
  return {
    productos: new Set(
      filas.filter((f) => f.tipo === "producto").map((f) => f.objetoId),
    ),
    tiendas: new Set(slugs.map((s) => s.slug)),
  };
}

/**
 * Todo lo que hay que esconderle a esta petición. Si leer las denuncias
 * falla, el catálogo sale igual (un problema de moderación no tumba la
 * tienda) pero el fallo queda escrito; el bloqueo propio sí se respeta.
 */
export async function ocultosParaLaApp(
  usuarioId: string | null,
): Promise<OcultosParaLaApp> {
  const [bloqueadas, denunciadas] = await Promise.all([
    tiendasBloqueadasPor(usuarioId).catch((fallo) => {
      console.error("[moderacion] no se pudieron leer los bloqueos:", fallo);
      return new Set<string>();
    }),
    denunciados().catch((fallo) => {
      console.error("[moderacion] no se pudieron leer las denuncias:", fallo);
      return { productos: new Set<string>(), tiendas: new Set<string>() };
    }),
  ]);
  return {
    productos: denunciadas.productos,
    tiendasDenunciadas: denunciadas.tiendas,
    tiendasBloqueadas: bloqueadas,
  };
}

/** Quita un bloqueo (por el slug de una tienda de ese dueño). */
export async function desbloquearTienda(
  usuarioId: string,
  slug: string,
): Promise<boolean> {
  const db = getDb();
  const [t] = await db
    .select({ dueno: tiendas.propietarioId })
    .from(tiendas)
    .where(eq(tiendas.slug, slug))
    .limit(1);
  if (!t?.dueno) return false;
  await db
    .delete(bloqueosUsuario)
    .where(
      and(
        eq(bloqueosUsuario.usuarioId, usuarioId),
        eq(bloqueosUsuario.bloqueadoId, t.dueno),
      ),
    );
  return true;
}

/** Las tiendas bloqueadas, con nombre, para la pantalla «Vendedores bloqueados». */
export async function listarBloqueados(
  usuarioId: string,
): Promise<Array<{ slug: string; nombre: string }>> {
  return getDb()
    .select({ slug: tiendas.slug, nombre: tiendas.nombre })
    .from(tiendas)
    .where(
      sql`${tiendas.propietarioId} in (select "bloqueado_id" from "bloqueos_usuario" where "usuario_id" = ${usuarioId})`,
    );
}
