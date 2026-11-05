import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { catalogoCambioEnTienda } from "@/lib/catalogo/al-cambiar";
import { getDb } from "@/lib/db";
import {
  itemsPedido,
  pagosZelle,
  pedidos,
  solicitudesCierre,
  tiendas,
  user,
} from "@/lib/db/schema";

import { ESTADOS_DE_PEDIDO_EN_CAMINO } from "./borrar-puro";
import {
  cierreListo,
  pasosPendientes,
  type PasoDelCierre,
  type SituacionDelCierre,
} from "./cierre-puro";

/**
 * ══ CERRAR UNA CUENTA CON TIENDA (5 nov 2026) ══
 *
 * La pieza ÚNICA que usan la web (`borrar-acciones.ts`) y la app
 * (`/datos/app/mi/cerrar-cuenta`). Reglas en `cierre-puro.ts`.
 *
 * 1. `pedirCierre`: graba la solicitud, APAGA la tienda a la venta en ese
 *    momento (sale del catálogo) y avisa al equipo para que pague el saldo.
 * 2. `revisarCierreDeTienda`: se llama cuando algo pendiente se resuelve (un
 *    pedido entregado, un retiro pagado, un pago revisado, o el propio dueño
 *    mirando su cuenta). Si ya no queda nada, borra la cuenta —la MISMA
 *    `borrarCuenta` de siempre, que anonimiza y guarda los registros— y le
 *    avisa por correo.
 *
 * No depende del reloj (apagado por la pausa de gasto): se revisa cuando algo
 * cambia de verdad. Nada de esto escribe al mirar, salvo el borrado final.
 */

/** Lo que falta para poder borrar, contado EN LA BASE. */
export async function situacionDelCierre(
  tiendaId: string,
): Promise<SituacionDelCierre> {
  const db = getDb();
  const [abiertos, pendientes] = await Promise.all([
    db
      .select({ n: sql<number>`COUNT(DISTINCT ${pedidos.id})` })
      .from(pedidos)
      .innerJoin(itemsPedido, eq(itemsPedido.pedidoId, pedidos.id))
      .where(
        and(
          eq(itemsPedido.tiendaId, tiendaId),
          inArray(pedidos.estado, [...ESTADOS_DE_PEDIDO_EN_CAMINO]),
        ),
      ),
    db
      .select({ n: sql<number>`COUNT(*)` })
      .from(pagosZelle)
      .where(
        and(
          eq(pagosZelle.tiendaId, tiendaId),
          eq(pagosZelle.tipo, "entrada"),
          eq(pagosZelle.estado, "pendiente"),
        ),
      ),
  ]);
  /* El saldo, con la MISMA cuenta de la billetera del panel. */
  const { obtenerPosicion } = await import("@/lib/zelle/billetera");
  const posicion = await obtenerPosicion(tiendaId).catch(() => null);
  return {
    pedidosAbiertos: Number(abiertos[0]?.n ?? 0),
    pagosPendientes: Number(pendientes[0]?.n ?? 0),
    saldoCentavos: Math.max(0, posicion?.saldoCentavos ?? 0),
  };
}

export type EstadoDelCierre =
  { pedido: false } | { pedido: true; desde: Date; pasos: PasoDelCierre[] };

async function solicitudPendiente(usuarioId: string) {
  const [fila] = await getDb()
    .select({
      id: solicitudesCierre.id,
      tiendaId: solicitudesCierre.tiendaId,
      origen: solicitudesCierre.origen,
      pedidaEn: solicitudesCierre.pedidaEn,
    })
    .from(solicitudesCierre)
    .where(
      and(
        eq(solicitudesCierre.usuarioId, usuarioId),
        eq(solicitudesCierre.estado, "pendiente"),
      ),
    )
    .limit(1);
  return fila ?? null;
}

/** ¿Pidió ya el cierre, y qué le falta? Solo lee. */
export async function estadoDelCierre(
  usuarioId: string,
): Promise<EstadoDelCierre> {
  const solicitud = await solicitudPendiente(usuarioId);
  if (!solicitud) return { pedido: false };
  return {
    pedido: true,
    desde: solicitud.pedidaEn,
    pasos: pasosPendientes(await situacionDelCierre(solicitud.tiendaId)),
  };
}

/**
 * Pide el cierre. Idempotente: si ya lo pidió, devuelve el mismo. La tienda
 * se apaga a la venta aquí mismo. Si no queda nada pendiente, la cuenta se
 * borra en el acto.
 */
export async function pedirCierre(
  usuario: { id: string; email: string; name: string },
  origen: "app" | "web",
): Promise<
  | { ok: true; borrada: boolean; estado: EstadoDelCierre }
  | { ok: false; motivo: "sin_tienda" }
> {
  const db = getDb();
  const [tienda] = await db
    .select({ id: tiendas.id, nombre: tiendas.nombre })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuario.id))
    .limit(1);
  if (!tienda) return { ok: false, motivo: "sin_tienda" };

  const ya = await solicitudPendiente(usuario.id);
  if (!ya) {
    await db.batch([
      db.insert(solicitudesCierre).values({
        id: nanoid(),
        usuarioId: usuario.id,
        tiendaId: tienda.id,
        origen,
        estado: "pendiente",
        pedidaEn: new Date(),
      }),
      /* A la venta, no más: sale del catálogo, de Google y de la app. */
      db
        .update(tiendas)
        .set({ estado: "suspendida", actualizadoEn: new Date() })
        .where(eq(tiendas.id, tienda.id)),
    ]);
    await catalogoCambioEnTienda(tienda.id);

    const situacion = await situacionDelCierre(tienda.id);
    /* Al equipo, para que pague el saldo y no se quede esperando nadie. Nunca
       es requisito: si el correo falla, la solicitud ya está grabada. */
    try {
      const { enviarCorreo } = await import("@/lib/correo/enviar");
      const { CORREO_EQUIPO } = await import("@/lib/correo/direcciones");
      const saldo = (situacion.saldoCentavos / 100).toFixed(2);
      await enviarCorreo({
        a: CORREO_EQUIPO,
        asunto: `Cierre de cuenta pedido: ${tienda.nombre}`,
        texto: `${tienda.nombre} (${usuario.email}) pidió cerrar su cuenta desde la ${origen}.\nLa tienda ya está apagada a la venta.\nPendiente: ${situacion.pedidosAbiertos} pedidos abiertos, ${situacion.pagosPendientes} pagos por revisar, saldo ${saldo}.\nCuando se pague el saldo y se entreguen los pedidos, la cuenta se borra sola.`,
        html: `<p><b>${tienda.nombre}</b> (${usuario.email}) pidió cerrar su cuenta desde la ${origen}.</p><p>La tienda ya está apagada a la venta.</p><p>Pendiente: ${situacion.pedidosAbiertos} pedidos abiertos, ${situacion.pagosPendientes} pagos por revisar, saldo ${saldo}.</p><p>Cuando se pague el saldo y se entreguen los pedidos, la cuenta se borra sola.</p>`,
      });
    } catch (fallo) {
      console.error(
        "[cierre] solicitud grabada; aviso al equipo fallido:",
        fallo,
      );
    }
  }

  const borrada = await revisarCierreDeUsuario(usuario.id);
  return {
    ok: true,
    borrada,
    estado: borrada ? { pedido: false } : await estadoDelCierre(usuario.id),
  };
}

/** Si el cierre de esta persona ya no tiene nada pendiente, borra la cuenta. */
export async function revisarCierreDeUsuario(
  usuarioId: string,
): Promise<boolean> {
  try {
    const solicitud = await solicitudPendiente(usuarioId);
    if (!solicitud) return false;
    if (!cierreListo(await situacionDelCierre(solicitud.tiendaId)))
      return false;

    const db = getDb();
    const [persona] = await db
      .select({ email: user.email, name: user.name, idioma: user.idioma })
      .from(user)
      .where(eq(user.id, usuarioId))
      .limit(1);
    if (!persona) return false;

    const { borrarCuenta } = await import("./borrar");
    await borrarCuenta(
      usuarioId,
      persona.email,
      solicitud.origen === "app" ? "app" : "web",
    );
    await db
      .update(solicitudesCierre)
      .set({ estado: "completada", completadaEn: new Date() })
      .where(eq(solicitudesCierre.id, solicitud.id));

    try {
      const { correoCuentaEliminada } = await import("@/lib/correo/correos");
      await correoCuentaEliminada({
        email: persona.email,
        name: persona.name,
        idioma: persona.idioma,
      });
    } catch (fallo) {
      console.error("[cierre] cuenta borrada; aviso fallido:", fallo);
    }
    return true;
  } catch (fallo) {
    /* Revisar nunca tumba lo que lo llamó (entregar un pedido, pagar un
       retiro): se anota y se vuelve a revisar en el próximo cambio. */
    console.error("[cierre] no se pudo revisar el cierre:", fallo);
    try {
      const { registrarError } = await import("@/lib/errores/registro");
      await registrarError("cuenta/cierre", fallo);
    } catch {
      /* Anotar el fallo no puede provocar otro. */
    }
    return false;
  }
}

/** Lo mismo, partiendo de la tienda: para los momentos en que algo se resuelve. */
export async function revisarCierreDeTienda(tiendaId: string): Promise<void> {
  const [solicitud] = await getDb()
    .select({ usuarioId: solicitudesCierre.usuarioId })
    .from(solicitudesCierre)
    .where(
      and(
        eq(solicitudesCierre.tiendaId, tiendaId),
        eq(solicitudesCierre.estado, "pendiente"),
      ),
    )
    .limit(1);
  if (solicitud) await revisarCierreDeUsuario(solicitud.usuarioId);
}

/** Lo mismo, partiendo de un pedido: revisa las tiendas que vendieron en él. */
export async function revisarCierreDePedido(pedidoId: string): Promise<void> {
  const filas = await getDb()
    .selectDistinct({ tiendaId: itemsPedido.tiendaId })
    .from(itemsPedido)
    .where(eq(itemsPedido.pedidoId, pedidoId));
  for (const f of filas)
    if (f.tiendaId) await revisarCierreDeTienda(f.tiendaId);
}
