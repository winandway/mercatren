import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  creditosCliente,
  pagosZelle,
  pedidos,
  pedidosCredito,
  user,
} from "@/lib/db/schema";
import {
  calcularCupo,
  type Cupo,
  type PedidoACredito,
} from "@/lib/credito/cupo";

/**
 * LO QUE SE LEE DEL CRÉDITO.
 *
 * REGLA DE ESTE ARCHIVO: **columnas nombradas, nunca `.select()` a secas.**
 * Drizzle pediría todas las columnas del esquema, incluidas las que se acaben
 * de agregar, y como `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, una
 * base que ya existe no las tiene. La pantalla revienta con 500 en producción
 * mientras en local todo va perfecto. Pasó el 5 ago 2026.
 *
 * REGLA DE ALCANCE: quien llama pasa la tienda, y esa tienda sale del alcance
 * de la sesión — nunca de la dirección. Un comercio no puede ver el crédito de
 * otro cambiando el enlace a mano.
 */

/** Lo abonado de verdad a un pedido: solo pagos ya APROBADOS por un validador. */
async function abonosPorPedido(
  db: ReturnType<typeof getDb>,
  pedidoIds: string[],
): Promise<Map<string, number>> {
  if (pedidoIds.length === 0) return new Map();

  /* Un comprobante subido pero todavía sin validar NO cuenta como abono. Si
     contara, cualquiera liberaría su cupo subiendo una foto cualquiera, y el
     comercio entregaría mercancía contra un pago que no existe. */
  const filas = await db
    .select({
      pedidoId: pagosZelle.pedidoId,
      total: sql<number>`COALESCE(SUM(${pagosZelle.montoCentavos}), 0)`,
    })
    .from(pagosZelle)
    .where(
      and(
        inArray(pagosZelle.pedidoId, pedidoIds),
        eq(pagosZelle.estado, "aprobado"),
        eq(pagosZelle.tipo, "entrada"),
      ),
    )
    .groupBy(pagosZelle.pedidoId);

  const mapa = new Map<string, number>();
  for (const f of filas) {
    if (f.pedidoId) mapa.set(f.pedidoId, Number(f.total ?? 0));
  }
  return mapa;
}

export type CreditoDeCliente = {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteCorreo: string;
  estado: "activo" | "suspendido";
  diasPlazo: number;
  notaInterna: string | null;
  cupo: Cupo;
  /** Cuántos pedidos suyos siguen abiertos. */
  pedidosAbiertos: number;
  /** El más antiguo sin pagar, para ver quién se está atrasando. */
  venceMasProximo: Date | null;
};

/**
 * El cupo de UN cliente en UNA tienda.
 *
 * Devuelve `null` si ese comercio no le ha dado crédito — que es el caso
 * normal: el crédito es la excepción, no lo que tiene todo el mundo.
 */
export async function cupoDelCliente(
  tiendaId: string,
  clienteId: string,
): Promise<{
  id: string;
  estado: "activo" | "suspendido";
  diasPlazo: number;
  cupo: Cupo;
} | null> {
  const db = getDb();

  const [credito] = await db
    .select({
      id: creditosCliente.id,
      topeCentavos: creditosCliente.topeCentavos,
      diasPlazo: creditosCliente.diasPlazo,
      estado: creditosCliente.estado,
    })
    .from(creditosCliente)
    .where(
      and(
        eq(creditosCliente.tiendaId, tiendaId),
        eq(creditosCliente.clienteId, clienteId),
      ),
    )
    .limit(1);

  if (!credito) return null;

  const abiertos = await db
    .select({
      pedidoId: pedidosCredito.pedidoId,
      totalCentavos: pedidosCredito.totalCentavos,
    })
    .from(pedidosCredito)
    .where(
      and(
        eq(pedidosCredito.tiendaId, tiendaId),
        eq(pedidosCredito.clienteId, clienteId),
        inArray(pedidosCredito.estado, ["abierto", "vencido"]),
      ),
    );

  const abonos = await abonosPorPedido(
    db,
    abiertos.map((p) => p.pedidoId),
  );

  const conAbonos: PedidoACredito[] = abiertos.map((p) => ({
    totalCentavos: p.totalCentavos,
    abonadoCentavos: abonos.get(p.pedidoId) ?? 0,
  }));

  return {
    id: credito.id,
    estado: credito.estado,
    diasPlazo: credito.diasPlazo,
    cupo: calcularCupo(credito.topeCentavos, conAbonos),
  };
}

/**
 * Todos los clientes a los que un comercio le dio crédito.
 *
 * Es la pantalla que hoy MEGAYES lleva en un cuaderno: quién le debe, cuánto y
 * desde cuándo.
 */
export async function clientesConCredito(
  tiendaId: string,
): Promise<CreditoDeCliente[]> {
  const db = getDb();

  const creditos = await db
    .select({
      id: creditosCliente.id,
      clienteId: creditosCliente.clienteId,
      topeCentavos: creditosCliente.topeCentavos,
      diasPlazo: creditosCliente.diasPlazo,
      estado: creditosCliente.estado,
      notaInterna: creditosCliente.notaInterna,
      clienteNombre: user.name,
      clienteCorreo: user.email,
    })
    .from(creditosCliente)
    .innerJoin(user, eq(user.id, creditosCliente.clienteId))
    .where(eq(creditosCliente.tiendaId, tiendaId))
    .orderBy(desc(creditosCliente.creadoEn));

  if (creditos.length === 0) return [];

  // Todos los pedidos abiertos de esos clientes, en una sola consulta.
  const abiertos = await db
    .select({
      pedidoId: pedidosCredito.pedidoId,
      clienteId: pedidosCredito.clienteId,
      totalCentavos: pedidosCredito.totalCentavos,
      venceEn: pedidosCredito.venceEn,
    })
    .from(pedidosCredito)
    .where(
      and(
        eq(pedidosCredito.tiendaId, tiendaId),
        inArray(pedidosCredito.estado, ["abierto", "vencido"]),
      ),
    );

  const abonos = await abonosPorPedido(
    db,
    abiertos.map((p) => p.pedidoId),
  );

  return creditos.map((c) => {
    const suyos = abiertos.filter((p) => p.clienteId === c.clienteId);

    const conAbonos: PedidoACredito[] = suyos.map((p) => ({
      totalCentavos: p.totalCentavos,
      abonadoCentavos: abonos.get(p.pedidoId) ?? 0,
    }));

    const fechas = suyos
      .map((p) => p.venceEn)
      .filter((f): f is Date => f instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      id: c.id,
      clienteId: c.clienteId,
      clienteNombre: c.clienteNombre,
      clienteCorreo: c.clienteCorreo,
      estado: c.estado,
      diasPlazo: c.diasPlazo,
      notaInterna: c.notaInterna,
      cupo: calcularCupo(c.topeCentavos, conAbonos),
      pedidosAbiertos: suyos.length,
      venceMasProximo: fechas[0] ?? null,
    };
  });
}

export type CuentaDelCliente = {
  pedidoId: string;
  numero: string;
  tiendaId: string;
  totalCentavos: number;
  abonadoCentavos: number;
  estado: "abierto" | "pagado" | "vencido";
  venceEn: Date;
};

/**
 * Lo que un cliente debe, mirado desde su lado.
 *
 * Se le muestran también los pedidos ya pagados: es su historial, y le sirve
 * para demostrar que cumplió.
 */
export async function misCuentasACredito(
  clienteId: string,
): Promise<CuentaDelCliente[]> {
  const db = getDb();

  const cuentas = await db
    .select({
      pedidoId: pedidosCredito.pedidoId,
      tiendaId: pedidosCredito.tiendaId,
      totalCentavos: pedidosCredito.totalCentavos,
      estado: pedidosCredito.estado,
      venceEn: pedidosCredito.venceEn,
      numero: pedidos.numero,
    })
    .from(pedidosCredito)
    .innerJoin(pedidos, eq(pedidos.id, pedidosCredito.pedidoId))
    .where(eq(pedidosCredito.clienteId, clienteId))
    .orderBy(desc(pedidosCredito.creadoEn));

  const abonos = await abonosPorPedido(
    db,
    cuentas.map((c) => c.pedidoId),
  );

  return cuentas.map((c) => ({
    pedidoId: c.pedidoId,
    numero: c.numero,
    tiendaId: c.tiendaId,
    totalCentavos: c.totalCentavos,
    abonadoCentavos: abonos.get(c.pedidoId) ?? 0,
    estado: c.estado,
    venceEn: c.venceEn,
  }));
}
