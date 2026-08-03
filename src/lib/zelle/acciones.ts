"use server";

import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import type { Db } from "@/lib/db";
import { getDb } from "@/lib/db";
import {
  billeteras,
  movimientosBilletera,
  pagosZelle,
  pedidos,
  tiendas,
  user,
} from "@/lib/db/schema";

/**
 * Con quien hablar de un pago: el cliente que lo hizo (via su pedido) y el
 * dueno del comercio al que se le acredita. El historico importado no tiene
 * pedido, asi que ahi no se avisa a nadie — esas operaciones ya pasaron.
 */
async function contactosDelPago(
  db: Db,
  pago: { pedidoId: string | null; tiendaId: string | null },
) {
  const [cliente] = pago.pedidoId
    ? await db
        .select({
          email: user.email,
          name: user.name,
          idioma: user.idioma,
          numero: pedidos.numero,
          totalCentavos: pedidos.totalCentavos,
        })
        .from(pedidos)
        .innerJoin(user, eq(user.id, pedidos.clienteId))
        .where(eq(pedidos.id, pago.pedidoId))
        .limit(1)
    : [];

  const [comercio] = pago.tiendaId
    ? await db
        .select({ email: user.email, name: user.name, idioma: user.idioma })
        .from(tiendas)
        .innerJoin(user, eq(user.id, tiendas.propietarioId))
        .where(eq(tiendas.id, pago.tiendaId))
        .limit(1)
    : [];

  return { cliente: cliente ?? null, comercio: comercio ?? null };
}

/**
 * Lo que hace el validador con un pago.
 *
 * Aprobar mueve dinero: el neto se le acredita al comercio. Por eso todo el
 * trabajo va en un solo envio a la base (batch), y el saldo se suma con una
 * operacion relativa (saldo = saldo + X) para que dos validadores trabajando a
 * la vez no se pisen el resultado.
 */

export type Resultado =
  { ok: true; mensaje: string } | { ok: false; mensaje: string };

/**
 * Aprueba un pago pendiente y le acredita el neto al comercio.
 *
 * El pago solo se toca si sigue en "pendiente": si otro validador lo aprobo
 * medio segundo antes, esta llamada no hace nada y avisa.
 */
export async function aprobarPago(id: string): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para aprobar pagos." };
  }

  const db = getDb();
  const usuario = await obtenerUsuario();

  const [pago] = await db
    .select()
    .from(pagosZelle)
    .where(eq(pagosZelle.id, id))
    .limit(1);

  if (!pago) return { ok: false, mensaje: "No encontramos ese pago." };
  if (pago.estado !== "pendiente") {
    return { ok: false, mensaje: "Ese pago ya fue revisado." };
  }
  if (pago.tipo !== "entrada") {
    return {
      ok: false,
      mensaje: "Solo se acreditan las entradas. Un retiro no suma.",
    };
  }
  if (!pago.tiendaId) {
    return {
      ok: false,
      mensaje:
        "El pago no tiene comercio asignado; no se sabe a quien acreditarle.",
    };
  }

  const [billetera] = await db
    .select()
    .from(billeteras)
    .where(eq(billeteras.tiendaId, pago.tiendaId))
    .limit(1);

  if (!billetera) {
    return {
      ok: false,
      mensaje: "Ese comercio todavia no tiene billetera abierta.",
    };
  }

  const ahora = new Date();
  const movimientoId = nanoid();
  // Al comercio le toca el neto: el monto menos la comision de Mercatren.
  const acreditado = pago.netoCentavos;

  await db.batch([
    db.insert(movimientosBilletera).values({
      id: movimientoId,
      billeteraId: billetera.id,
      tipo: "recarga",
      montoCentavos: acreditado,
      saldoResultanteCentavos: billetera.saldoCentavos + acreditado,
      referencia: pago.id,
      nota: `Pago Zelle aprobado${pago.codigoConfirmacion ? ` · ${pago.codigoConfirmacion}` : ""}`,
      hechoPorId: usuario?.id ?? null,
      creadoEn: ahora,
    }),

    db
      .update(billeteras)
      .set({
        saldoCentavos: sql`${billeteras.saldoCentavos} + ${acreditado}`,
        sincronizadoEn: ahora,
      })
      .where(eq(billeteras.id, billetera.id)),

    db
      .update(pagosZelle)
      .set({
        estado: "aprobado",
        aprobadoEn: ahora,
        revisadoEn: ahora,
        validadorId: usuario?.id ?? null,
        billeteraId: billetera.id,
        movimientoBilleteraId: movimientoId,
        motivoRechazo: null,
      })
      // La condicion evita aprobarlo dos veces si alguien se adelanto.
      .where(and(eq(pagosZelle.id, id), eq(pagosZelle.estado, "pendiente"))),
  ]);

  revalidatePath("/[locale]/panel", "layout");

  // Los avisos salen despues de acreditar y nunca lo deshacen: al cliente,
  // que su compra fue aprobada; al comercio, que el neto entro a su saldo.
  const { correoCompraAprobada, correoVentaAcreditada } =
    await import("@/lib/correo/correos");
  const { cliente, comercio } = await contactosDelPago(db, pago);
  if (cliente) {
    await correoCompraAprobada(cliente, {
      numero: cliente.numero,
      totalCentavos: cliente.totalCentavos,
    });
  }
  if (comercio) {
    await correoVentaAcreditada(comercio, {
      montoCentavos: acreditado,
      referencia: cliente?.numero ?? pago.codigoConfirmacion,
    });
  }

  return { ok: true, mensaje: "Pago aprobado y acreditado al comercio." };
}

/** Rechaza un pago pendiente. No toca ningun saldo. */
export async function rechazarPago(
  id: string,
  motivo: string,
): Promise<Resultado> {
  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: "No tienes permiso para rechazar pagos." };
  }

  const limpio = motivo.trim();
  if (limpio.length < 5) {
    return {
      ok: false,
      mensaje:
        "Escribe el motivo del rechazo: el comercio necesita saber por que.",
    };
  }

  const db = getDb();
  const usuario = await obtenerUsuario();
  const ahora = new Date();

  const [pago] = await db
    .select({
      estado: pagosZelle.estado,
      pedidoId: pagosZelle.pedidoId,
      tiendaId: pagosZelle.tiendaId,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.id, id))
    .limit(1);

  if (!pago) return { ok: false, mensaje: "No encontramos ese pago." };
  if (pago.estado !== "pendiente") {
    return { ok: false, mensaje: "Ese pago ya fue revisado." };
  }

  await db
    .update(pagosZelle)
    .set({
      estado: "rechazado",
      motivoRechazo: limpio,
      revisadoEn: ahora,
      validadorId: usuario?.id ?? null,
    })
    .where(and(eq(pagosZelle.id, id), eq(pagosZelle.estado, "pendiente")));

  revalidatePath("/[locale]/panel", "layout");

  // Aviso al cliente con el motivo tal cual lo escribio el validador, y el
  // camino para resolverlo: subir otro comprobante o escribir al buzon real.
  const { correoPagoRechazado } = await import("@/lib/correo/correos");
  const { cliente } = await contactosDelPago(db, pago);
  if (cliente) {
    await correoPagoRechazado(
      cliente,
      { numero: cliente.numero, totalCentavos: cliente.totalCentavos },
      limpio,
    );
  }

  return { ok: true, mensaje: "Pago rechazado." };
}
