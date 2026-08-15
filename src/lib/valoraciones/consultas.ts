import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { itemsPedido, pedidos, user, valoraciones } from "@/lib/db/schema";
import { resumirValoraciones, type Resumen } from "@/lib/valoraciones/reglas";

/**
 * LAS ESTRELLAS DE UN PRODUCTO, LEÍDAS DE LA BASE.
 *
 * El promedio se CALCULA de las valoraciones, nunca se guarda. Guardar un
 * total además de los movimientos es tener dos verdades — la misma regla que
 * ya rige para el saldo de las billeteras.
 */

export type OpinionPublica = {
  id: string;
  estrellas: number;
  comentario: string | null;
  nombre: string;
  creadoEn: Date | number | null;
};

export async function resumenDeProducto(productoId: string): Promise<Resumen> {
  const db = getDb();
  const filas = await db
    .select({ estrellas: valoraciones.estrellas })
    .from(valoraciones)
    .where(eq(valoraciones.productoId, productoId))
    .catch(() => []);

  return resumirValoraciones(filas.map((f) => Number(f.estrellas)));
}

/** Las opiniones que se enseñan en la ficha, de la más nueva a la más vieja. */
export async function opinionesDe(
  productoId: string,
  limite = 20,
): Promise<OpinionPublica[]> {
  const db = getDb();

  const filas = await db
    .select({
      id: valoraciones.id,
      estrellas: valoraciones.estrellas,
      comentario: valoraciones.comentario,
      nombre: user.name,
      creadoEn: valoraciones.creadoEn,
    })
    .from(valoraciones)
    .innerJoin(user, eq(user.id, valoraciones.usuarioId))
    .where(eq(valoraciones.productoId, productoId))
    .orderBy(desc(valoraciones.creadoEn))
    .limit(limite)
    .catch(() => []);

  return filas.map((f) => ({
    id: f.id,
    estrellas: Number(f.estrellas),
    comentario: f.comentario,
    /**
     * SOLO EL NOMBRE DE PILA.
     *
     * Una opinión firmada con nombre y apellido completos expone a quien la
     * escribió, y aquí las cuentas se abren con el nombre real. «Carlos M.» es
     * suficiente para que se lea como una persona.
     */
    nombre: acortarNombre(f.nombre),
    creadoEn: f.creadoEn,
  }));
}

function acortarNombre(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "—";
  const primero = partes[0]!;
  const inicial = partes[1]?.[0];
  return inicial ? `${primero} ${inicial.toUpperCase()}.` : primero;
}

/**
 * ¿ESTA PERSONA PUEDE PUNTUAR ESTE PRODUCTO?
 *
 * Solo si lo compró y el pedido llegó a pagarse. Una estrella de alguien que
 * no compró no vale nada, y una tienda que las admite se llena de opiniones
 * falsas —propias y de la competencia— en cuanto alguien se da cuenta.
 *
 * Devuelve también la que ya escribió, si la hay: así el formulario sale
 * relleno y se edita en vez de duplicarse.
 */
export async function puedeValorar(productoId: string): Promise<{
  puede: boolean;
  suya: { estrellas: number; comentario: string | null } | null;
}> {
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return { puede: false, suya: null };

  const db = getDb();

  const [compra] = await db
    .select({ id: itemsPedido.id })
    .from(itemsPedido)
    .innerJoin(pedidos, eq(pedidos.id, itemsPedido.pedidoId))
    .where(
      and(
        eq(itemsPedido.productoId, productoId),
        eq(pedidos.clienteId, usuario.id),
        /* Un pedido creado y no pagado no cuenta: si contara, cualquiera
           abriría un pedido para poder puntuar y lo abandonaría. */
        inArray(pedidos.estado, ["pagado", "enviado", "entregado"]),
      ),
    )
    .limit(1)
    .catch(() => []);

  if (!compra) return { puede: false, suya: null };

  const [suya] = await db
    .select({
      estrellas: valoraciones.estrellas,
      comentario: valoraciones.comentario,
    })
    .from(valoraciones)
    .where(
      and(
        eq(valoraciones.productoId, productoId),
        eq(valoraciones.usuarioId, usuario.id),
      ),
    )
    .limit(1)
    .catch(() => []);

  return {
    puede: true,
    suya: suya
      ? { estrellas: Number(suya.estrellas), comentario: suya.comentario }
      : null,
  };
}

/** El resumen de varios productos de una vez, para las tarjetas del listado. */
export async function resumenDeVarios(
  ids: string[],
): Promise<Map<string, Resumen>> {
  const mapa = new Map<string, Resumen>();
  if (ids.length === 0) return mapa;

  const db = getDb();
  const filas = await db
    .select({
      productoId: valoraciones.productoId,
      suma: sql<number>`SUM(${valoraciones.estrellas})`,
      cuantas: sql<number>`COUNT(*)`,
    })
    .from(valoraciones)
    .where(inArray(valoraciones.productoId, ids))
    .groupBy(valoraciones.productoId)
    .catch(() => []);

  for (const f of filas) {
    const cuantas = Number(f.cuantas ?? 0);
    if (cuantas > 0) {
      mapa.set(f.productoId, {
        promedio: Math.round((Number(f.suma) / cuantas) * 10) / 10,
        cuantas,
      });
    }
  }
  return mapa;
}
