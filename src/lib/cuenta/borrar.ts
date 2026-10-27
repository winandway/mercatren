import "server-only";

import { and, eq, inArray, or, sql } from "drizzle-orm";

import { ESTADOS_EN_BODEGA } from "@/lib/casillero/estados";
import { getDb } from "@/lib/db";
import {
  account,
  busquedasImagen,
  casilleros,
  comentariosVideo,
  contactosBusqueda,
  cuentasEliminadas,
  direccionesDestino,
  meGustaVideo,
  paquetesCasillero,
  pedidos,
  preguntasProducto,
  session,
  tiendas,
  user,
  valoraciones,
  verification,
} from "@/lib/db/schema";

import {
  correoDeCuentaEliminada,
  ESTADOS_DE_PEDIDO_EN_CAMINO,
  NOMBRE_DE_CUENTA_ELIMINADA,
  type SituacionDeLaCuenta,
} from "./borrar-puro";

/**
 * Lo que hace falta saber para decidir si la cuenta se puede borrar ya.
 *
 * Tres conteos EN LA BASE (nunca filas traídas para contar), en un solo
 * `Promise.all`, como manda la regla del proyecto.
 */
export async function situacionDeLaCuenta(
  usuarioId: string,
  rol: string,
): Promise<SituacionDeLaCuenta> {
  const db = getDb();
  const [tiendasPropias, enCamino, enBodega] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(tiendas)
      .where(eq(tiendas.propietarioId, usuarioId)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(pedidos)
      .where(
        and(
          eq(pedidos.clienteId, usuarioId),
          inArray(pedidos.estado, [...ESTADOS_DE_PEDIDO_EN_CAMINO]),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)` })
      .from(paquetesCasillero)
      .innerJoin(casilleros, eq(casilleros.id, paquetesCasillero.casilleroId))
      .where(
        and(
          eq(casilleros.usuarioId, usuarioId),
          inArray(paquetesCasillero.estado, [...ESTADOS_EN_BODEGA]),
        ),
      ),
  ]);

  return {
    rol,
    tieneTienda: Number(tiendasPropias[0]?.n ?? 0) > 0,
    pedidosEnCamino: Number(enCamino[0]?.n ?? 0),
    paquetesEnBodega: Number(enBodega[0]?.n ?? 0),
  };
}

/**
 * Borra la cuenta: TODO en un solo lote, que la base aplica entero o nada.
 *
 * Qué se va:
 * - la contraseña y las sesiones (nadie vuelve a entrar con ella);
 * - los enlaces de cambio de clave pendientes;
 * - el nombre, el correo, el teléfono y el país de la cuenta;
 * - las direcciones guardadas, los «me gusta», los comentarios y las
 *   reseñas;
 * - el correo dejado en las búsquedas por foto;
 * - el nombre y el teléfono del casillero (que queda suspendido).
 *
 * Qué se queda, sin nombre: los pedidos, pagos y facturas (cinco años, por
 * ley) y las preguntas hechas en los productos, que ya no dicen quién las
 * hizo.
 */
export async function borrarCuenta(
  usuarioId: string,
  correoAnterior: string,
  origen: "app" | "web",
): Promise<void> {
  const db = getDb();
  const ahora = new Date();

  await db.batch([
    db.insert(cuentasEliminadas).values({
      id: crypto.randomUUID(),
      usuarioId,
      origen,
      eliminadaEn: ahora,
    }),
    db.delete(session).where(eq(session.userId, usuarioId)),
    db.delete(account).where(eq(account.userId, usuarioId)),
    db
      .delete(verification)
      .where(
        or(
          eq(verification.value, usuarioId),
          eq(verification.identifier, correoAnterior),
        ),
      ),
    db
      .delete(direccionesDestino)
      .where(eq(direccionesDestino.usuarioId, usuarioId)),
    db.delete(meGustaVideo).where(eq(meGustaVideo.usuarioId, usuarioId)),
    db
      .delete(comentariosVideo)
      .where(eq(comentariosVideo.usuarioId, usuarioId)),
    db.delete(valoraciones).where(eq(valoraciones.usuarioId, usuarioId)),
    db
      .update(preguntasProducto)
      .set({ usuarioId: null })
      .where(eq(preguntasProducto.usuarioId, usuarioId)),
    db
      .delete(contactosBusqueda)
      .where(eq(contactosBusqueda.correo, correoAnterior)),
    db
      .update(busquedasImagen)
      .set({ correo: null })
      .where(eq(busquedasImagen.correo, correoAnterior)),
    db
      .update(casilleros)
      .set({
        nombreLegal: NOMBRE_DE_CUENTA_ELIMINADA,
        telefono: "",
        aliasEmail: null,
        estado: "suspendido",
      })
      .where(eq(casilleros.usuarioId, usuarioId)),
    db
      .update(user)
      .set({
        name: NOMBRE_DE_CUENTA_ELIMINADA,
        email: correoDeCuentaEliminada(usuarioId),
        emailVerified: false,
        image: null,
        telefono: null,
        paisEntrega: null,
        updatedAt: ahora,
      })
      .where(eq(user.id, usuarioId)),
  ]);
}
