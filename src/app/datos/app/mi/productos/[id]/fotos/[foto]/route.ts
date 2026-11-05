import { and, eq, sql } from "drizzle-orm";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { imagenesProducto, productos, tiendas } from "@/lib/db/schema";
import { borrarFoto } from "@/lib/productos/acciones";

export const dynamic = "force-dynamic";

/**
 * QUITAR UNA FOTO DE UN PRODUCTO DESDE LA APP (5 nov 2026), con la MISMA
 * acción de la web (`borrarFoto`). La foto tiene que ser de un producto de la
 * tienda de quien pregunta, y la última no se quita: un producto a la venta
 * sin foto no se puede elegir (la app tampoco deja publicarlo sin una).
 */
type Contexto = { params: Promise<{ id: string; foto: string }> };

export async function DELETE(peticion: Request, { params }: Contexto) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return respuestaDeError("sin_sesion", 401);
  const { id, foto } = await params;

  const db = getDb();
  const [suya] = await db
    .select({ id: imagenesProducto.id })
    .from(imagenesProducto)
    .innerJoin(productos, eq(productos.id, imagenesProducto.productoId))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(imagenesProducto.id, foto),
        eq(imagenesProducto.productoId, id),
        eq(tiendas.propietarioId, usuario.id),
      ),
    )
    .limit(1);
  if (!suya) return respuestaDeError("no_existe", 404);

  const [conteo] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(imagenesProducto)
    .where(eq(imagenesProducto.productoId, id));
  if (Number(conteo?.n ?? 0) <= 1) return respuestaDeError("ultima_foto", 400);

  const hecho = await borrarFoto(foto, { idioma: contexto.idioma });
  return Response.json(hecho, {
    status: hecho.ok ? 200 : 400,
    headers: { "Cache-Control": "private, no-store" },
  });
}
