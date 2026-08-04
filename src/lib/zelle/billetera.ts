import "server-only";

import { and, desc, eq, gte, or, sql } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  billeteras,
  pagosZelle,
  retiros,
  retirosFee,
  tiendas,
} from "@/lib/db/schema";

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
  /**
   * Lo que ya pidió y todavía no le hemos mandado.
   *
   * Está apartado a propósito: mientras esté aquí no se puede volver a pedir.
   */
  enTramiteCentavos: number;
  /** Lo que puede pedir hoy: el saldo menos lo que ya está en trámite. */
  disponibleCentavos: number;
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

  /**
   * El mes se agrupa por la fecha en que se APROBÓ el pago, no por la fecha
   * en que el pagador hizo la transferencia. Es lo correcto y además es como
   * lo cuenta el sistema de origen: un pago transferido el 31 y aprobado el 1
   * pertenece al mes en que entró el dinero de verdad. Comprobado — así da
   * exactamente sus cifras de agosto.
   */
  const desde = inicioDelMes();
  const enElMes = gte(pagosZelle.aprobadoEn, desde);

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

  /**
   * Los retiros salen de DOS sitios y no se pisan:
   *
   * - los del histórico, que llegaron dentro de `pagos_zelle` y están
   *   congelados,
   * - y los que se piden desde aquí, que viven en `retiros`.
   *
   * Los que están pedidos y aún no se han hecho no bajan el saldo —todavía es
   * suyo— pero sí se apartan, para que no pueda pedir dos veces lo mismo.
   */
  const [pedidos] = await db
    .select({
      pagado: sql<number>`COALESCE(SUM(CASE WHEN ${retiros.estado} = 'pagado' THEN ${retiros.montoCentavos} ELSE 0 END), 0)`,
      enTramite: sql<number>`COALESCE(SUM(CASE WHEN ${retiros.estado} = 'solicitado' THEN ${retiros.montoCentavos} ELSE 0 END), 0)`,
      veces: sql<number>`COALESCE(SUM(CASE WHEN ${retiros.estado} = 'pagado' THEN 1 ELSE 0 END), 0)`,
    })
    .from(retiros)
    .where(eq(retiros.tiendaId, tiendaId));

  const neto = Number(datos?.netoHistorico ?? 0);
  const retirado = Number(datos?.retirado ?? 0) + Number(pedidos?.pagado ?? 0);
  const enTramite = Number(pedidos?.enTramite ?? 0);
  const saldo = neto - retirado;

  return {
    tiendaId,
    nombreTienda: tienda.nombre,
    moneda: billetera?.moneda ?? "USD",
    proveedor: billetera?.proveedor ?? "tokiia",
    saldoCentavos: saldo,
    enTramiteCentavos: enTramite,
    // Nunca por debajo de cero: si algo cuadrara mal, que no invite a pedir
    // dinero que no hay.
    disponibleCentavos: Math.max(0, saldo - enTramite),
    netoHistoricoCentavos: neto,
    retiradoCentavos: retirado,
    retiros: Number(datos?.retiros ?? 0) + Number(pedidos?.veces ?? 0),
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

  const [filas, salidas] = await Promise.all([
    db
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
      .limit(limite),

    // Los retiros que se pidieron desde el sitio y ya se pagaron.
    db
      .select({
        id: retiros.id,
        fecha: retiros.resueltoEn,
        monto: retiros.montoCentavos,
        referencia: retiros.referencia,
        forma: retiros.forma,
      })
      .from(retiros)
      .where(
        and(
          eq(retiros.tiendaId, posicion.tiendaId),
          eq(retiros.estado, "pagado"),
        ),
      )
      .orderBy(desc(retiros.resueltoEn))
      .limit(limite),
  ]);

  const movimientos: MovimientoBilletera[] = [
    ...filas.map((f) => ({
      id: f.id,
      fecha: f.fecha ? Number(f.fecha) * 1000 : null,
      tipo: f.tipo,
      concepto: f.nota ?? f.codigo ?? f.banco,
      montoCentavos: f.tipo === "retiro" ? -Number(f.monto) : Number(f.neto),
      saldoResultanteCentavos: 0,
    })),
    ...salidas.map((s) => ({
      id: s.id,
      // `resueltoEn` llega como Date; multiplicarlo por mil daría el año 58560.
      fecha: s.fecha instanceof Date ? s.fecha.getTime() : null,
      tipo: "retiro" as const,
      concepto: s.referencia ?? s.forma,
      montoCentavos: -Number(s.monto),
      saldoResultanteCentavos: 0,
    })),
  ]
    // Del más nuevo al más viejo: la columna de saldo se calcula hacia atrás
    // desde el de hoy, así que el orden no es cosmético.
    .sort((a, b) => (b.fecha ?? 0) - (a.fecha ?? 0))
    .slice(0, limite);

  let saldo = posicion.saldoCentavos;

  return movimientos.map((m) => {
    const saldoResultante = saldo;
    saldo -= m.montoCentavos;
    return { ...m, saldoResultanteCentavos: saldoResultante };
  });
}

/**
 * LA BILLETERA DEL OPERADOR: la comisión de Mercatren.
 *
 * Es una billetera APARTE de la del comercio y nunca se mezclan:
 *
 * - Entra el 3% de cada pago aprobado (eso ya está guardado en cada pago, no
 *   hace falta apuntarlo dos veces).
 * - Sale cuando Mercatren retira lo suyo, y eso sí hay que guardarlo:
 *   `retiros_fee`.
 * - Un retiro del comercio NO toca esta billetera, y un retiro de comisión NO
 *   toca la del comercio. Confundirlas sería restarle al comercio dinero que
 *   nunca fue suyo, o apuntarnos un saldo que en realidad le debemos a él.
 *
 * Solo la ve el equipo de Mercatren: a un comercio no le corresponde saber
 * cuánto lleva ganado el operador.
 */
export type BilleteraOperador = {
  ganadoCentavos: number;
  retiradoCentavos: number;
  disponibleCentavos: number;
  retiros: { id: string; fecha: number; montoCentavos: number }[];
};

export async function obtenerBilleteraOperador(): Promise<BilleteraOperador | null> {
  const alcance = await obtenerAlcance();
  // Un comercio no ve la caja del operador.
  if (alcance.tipo !== "todos") return null;

  const db = getDb();

  const [ganado] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${pagosZelle.comisionCentavos}), 0)`,
    })
    .from(pagosZelle)
    .where(ENTRADA_APROBADA);

  const filas = await db
    .select({
      id: retirosFee.id,
      montoCentavos: retirosFee.montoCentavos,
      hechoEn: retirosFee.hechoEn,
    })
    .from(retirosFee)
    .orderBy(desc(retirosFee.hechoEn));

  const ganadoCentavos = Number(ganado?.total ?? 0);
  const retiradoCentavos = filas.reduce(
    (total, f) => total + Number(f.montoCentavos),
    0,
  );

  return {
    ganadoCentavos,
    retiradoCentavos,
    disponibleCentavos: ganadoCentavos - retiradoCentavos,
    // La nota de cada retiro es interna: no sale de aquí.
    retiros: filas.map((f) => ({
      id: f.id,
      fecha: Number(f.hechoEn) * 1000,
      montoCentavos: Number(f.montoCentavos),
    })),
  };
}
