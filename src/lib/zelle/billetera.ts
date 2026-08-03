import "server-only";

import { and, desc, eq, gte, or, sql } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { billeteras, pagosZelle, tiendas } from "@/lib/db/schema";

/**
 * La billetera del comercio, con su posición REAL.
 *
 * DE DÓNDE SALE EL SALDO (y por qué no es un número guardado a mano):
 *
 *   entradas aprobadas − comisión = neto del comercio
 *   neto − retiros ya hechos      = lo que todavía tiene a su favor
 *
 * Con el histórico del piloto eso da exactamente los $24,283.75 que el
 * comercio ve en el sistema anterior. Se calcula en vez de guardarse porque un
 * número escrito a mano se desactualiza en cuanto se aprueba el siguiente pago
 * y nadie se entera; calculado, no puede mentir.
 *
 * OJO CON LA REGLA DE LOS RETIROS: en los totales del NEGOCIO (ingresos,
 * comisión) los retiros no se suman nunca — eso sigue igual. Pero el saldo de
 * una billetera es justo lo contrario: es lo que queda DESPUÉS de restarlos.
 * Son dos preguntas distintas sobre los mismos datos.
 *
 * Ese dinero no está en una cuenta aparte: está en la cuenta del banco, a
 * favor del comercio, esperando a que lo pida.
 */

const ENTRADA_APROBADA = and(
  eq(pagosZelle.tipo, "entrada"),
  eq(pagosZelle.estado, "aprobado"),
);

const RETIRO_APROBADO = and(
  eq(pagosZelle.tipo, "retiro"),
  eq(pagosZelle.estado, "aprobado"),
);

/** Primer día del mes en curso. */
function inicioDelMes(): Date {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
}

/**
 * Qué tienda toca.
 *
 * Un vendedor: la suya, pase lo que pase. El equipo: la que pida por la
 * dirección —por slug o por id, que en la práctica llegan las dos— y si no
 * pide ninguna, la primera que haya. Antes, sin parámetro, la pantalla decía
 * "este comercio todavía no tiene billetera abierta" aunque sí la tuviera.
 */
async function tiendaAConsultar(comercio?: string): Promise<string | null> {
  const alcance = await obtenerAlcance();
  if (alcance.tipo === "tienda") return alcance.tiendaId;

  const db = getDb();

  if (comercio) {
    const [fila] = await db
      .select({ id: tiendas.id })
      .from(tiendas)
      .where(or(eq(tiendas.slug, comercio), eq(tiendas.id, comercio)))
      .limit(1);
    if (fila) return fila.id;
  }

  const [primera] = await db
    .select({ id: billeteras.tiendaId })
    .from(billeteras)
    .limit(1);

  return primera?.id ?? null;
}

export type PosicionBilletera = {
  tiendaId: string;
  nombreTienda: string;
  moneda: string;
  proveedor: string;
  /** Lo que el comercio tiene a su favor ahora mismo. */
  saldoCentavos: number;
  /** Todo lo que se le ha acreditado desde el principio. */
  netoHistoricoCentavos: number;
  /** Todo lo que ya se llevó. */
  retiradoCentavos: number;
  /** Cuántas veces ha retirado. */
  retiros: number;
  mes: {
    brutoCentavos: number;
    comisionCentavos: number;
    retiradoCentavos: number;
    rechazadoCentavos: number;
  };
  /** Lo que Mercatren se ha ganado con este comercio. */
  comisionGanadaCentavos: number;
  /**
   * Hasta qué día llegan los datos que tenemos.
   *
   * Hace falta a la vista: el histórico se trajo de una exportación con fecha,
   * así que si el mes en curso sale en cero puede ser que no hubo ventas... o
   * que los datos se quedaron atrás. Sin este dato, un cero se lee mal.
   */
  ultimoMovimiento: number | null;
};

export async function obtenerPosicion(
  comercio?: string,
): Promise<PosicionBilletera | null> {
  const tiendaId = await tiendaAConsultar(comercio);
  if (!tiendaId) return null;

  const db = getDb();

  const [tienda] = await db
    .select({ nombre: tiendas.nombre })
    .from(tiendas)
    .where(eq(tiendas.id, tiendaId))
    .limit(1);

  if (!tienda) return null;

  const [datos] = await db
    .select({
      esMiTienda: sql<number>`1`,
      netoHistorico: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.netoCentavos} ELSE 0 END), 0)`,
      comisionGanada: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.comisionCentavos} ELSE 0 END), 0)`,
      retirado: sql<number>`COALESCE(SUM(CASE WHEN ${RETIRO_APROBADO} THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      retiros: sql<number>`COALESCE(SUM(CASE WHEN ${RETIRO_APROBADO} THEN 1 ELSE 0 END), 0)`,
      ultimo: sql<number | null>`MAX(${pagosZelle.fechaTransaccion})`,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.tiendaId, tiendaId));

  const desde = inicioDelMes();
  const enElMes = gte(pagosZelle.fechaTransaccion, desde);

  const [mes] = await db
    .select({
      bruto: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      comision: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.comisionCentavos} ELSE 0 END), 0)`,
      retirado: sql<number>`COALESCE(SUM(CASE WHEN ${RETIRO_APROBADO} THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      rechazado: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'rechazado' THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
    })
    .from(pagosZelle)
    .where(and(eq(pagosZelle.tiendaId, tiendaId), enElMes));

  const [billetera] = await db
    .select({ moneda: billeteras.moneda, proveedor: billeteras.proveedor })
    .from(billeteras)
    .where(eq(billeteras.tiendaId, tiendaId))
    .limit(1);

  const neto = Number(datos?.netoHistorico ?? 0);
  const retirado = Number(datos?.retirado ?? 0);

  return {
    tiendaId,
    nombreTienda: tienda.nombre,
    moneda: billetera?.moneda ?? "USD",
    proveedor: billetera?.proveedor ?? "tokiia",
    saldoCentavos: neto - retirado,
    netoHistoricoCentavos: neto,
    retiradoCentavos: retirado,
    retiros: Number(datos?.retiros ?? 0),
    mes: {
      brutoCentavos: Number(mes?.bruto ?? 0),
      comisionCentavos: Number(mes?.comision ?? 0),
      retiradoCentavos: Number(mes?.retirado ?? 0),
      rechazadoCentavos: Number(mes?.rechazado ?? 0),
    },
    comisionGanadaCentavos: Number(datos?.comisionGanada ?? 0),
    ultimoMovimiento: datos?.ultimo ? Number(datos.ultimo) * 1000 : null,
  };
}

export type MovimientoBilletera = {
  id: string;
  fecha: number | null;
  tipo: "entrada" | "retiro";
  concepto: string | null;
  montoCentavos: number;
  saldoResultanteCentavos: number;
};

/**
 * El historial de la billetera, armado con los pagos reales.
 *
 * Cada entrada aprobada suma su neto y cada retiro resta su monto, así que la
 * columna de saldo cuadra con el número de arriba. Se calcula hacia atrás
 * desde el saldo actual: el movimiento más nuevo deja el saldo de hoy.
 */
export async function listarMovimientosReales(
  comercio?: string,
  limite = 60,
): Promise<MovimientoBilletera[]> {
  const posicion = await obtenerPosicion(comercio);
  if (!posicion) return [];

  const db = getDb();

  const filas = await db
    .select({
      id: pagosZelle.id,
      fecha: pagosZelle.fechaTransaccion,
      tipo: pagosZelle.tipo,
      monto: pagosZelle.montoCentavos,
      neto: pagosZelle.netoCentavos,
      codigo: pagosZelle.codigoConfirmacion,
      banco: pagosZelle.bancoOrigen,
      nota: pagosZelle.notas,
    })
    .from(pagosZelle)
    .where(
      and(
        eq(pagosZelle.tiendaId, posicion.tiendaId),
        eq(pagosZelle.estado, "aprobado"),
      ),
    )
    .orderBy(desc(pagosZelle.fechaTransaccion), desc(pagosZelle.id))
    .limit(limite);

  let saldo = posicion.saldoCentavos;

  return filas.map((f) => {
    const monto = f.tipo === "retiro" ? -Number(f.monto) : Number(f.neto);
    const saldoResultante = saldo;
    saldo -= monto;

    return {
      id: f.id,
      fecha: f.fecha ? Number(f.fecha) * 1000 : null,
      tipo: f.tipo,
      concepto: f.nota ?? f.codigo ?? f.banco,
      montoCentavos: monto,
      saldoResultanteCentavos: saldoResultante,
    };
  });
}
