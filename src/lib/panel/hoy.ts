import "server-only";

import { and, eq, gte, sql, type SQL } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { obtenerPosicion } from "@/lib/zelle/billetera";
import {
  disputas,
  itemsPedido,
  pagosZelle,
  pedidos,
  retiros,
} from "@/lib/db/schema";

/**
 * LO QUE PASÓ HOY Y LO QUE HAY POR HACER.
 *
 * ══ POR QUÉ ══
 *
 * La pantalla de entrada del panel salía entera de `pagos_zelle`: enseñaba el
 * histórico importado y **no contaba ni una venta con tarjeta**. Quien abría el
 * panel el día de una venta con tarjeta no la veía por ninguna parte, y encima
 * el número grande era de operaciones ya liquidadas en el sistema anterior.
 *
 * Estas cifras salen de `pedidos` + `items_pedido`, que es donde están las dos
 * formas de pago. El histórico no desaparece: sigue en Cobros → Zelle, que es
 * donde va un archivo.
 *
 * ══ EL ALCANCE ══
 *
 * Un comercio ve lo suyo, y los importes son los de SUS renglones.
 */

export type ResumenDeHoy = {
  /** Ventas creadas hoy y lo que suman. */
  hoyCantidad: number;
  hoyCentavos: number;
  /** El mes en curso, desde el día 1. */
  mesCantidad: number;
  mesCentavos: number;
  mesMargenCentavos: number;
  /* LO QUE ESTÁ ESPERANDO A UNA PERSONA. Es la lista de tareas del día. */
  porValidar: number;
  porEntregar: number;
  retirosPendientes: number;
  contracargos: number;
  moneda: string;
  /**
   * Lo que el comercio tiene a su favor ahora mismo. Null para el equipo: no
   * es «un» saldo, son los de todos los comercios y se miran en la billetera.
   */
  disponibleCentavos: number | null;
};

/** Los estados en los que un pedido ya se cobró pero todavía no llegó. */
const SIN_ENTREGAR = ["pagado", "preparando", "enviado"];

export async function resumenDeHoy(): Promise<ResumenDeHoy> {
  const db = getDb();
  const alcance = await obtenerAlcance();
  const tiendaId = alcance.tipo === "tienda" ? alcance.tiendaId : null;

  const ahora = new Date();
  const medianoche = new Date(ahora);
  medianoche.setHours(0, 0, 0, 0);
  const primeroDelMes = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );

  const deLaTienda = tiendaId
    ? sql`AND ${itemsPedido.tiendaId} = ${tiendaId}`
    : sql``;

  const suyo: SQL[] = [];
  if (tiendaId) {
    suyo.push(
      sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`,
    );
  }

  const subtotal = sql<number>`(SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} ${deLaTienda})`;
  const comision = sql<number>`(SELECT COALESCE(SUM(${itemsPedido.comisionCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} ${deLaTienda})`;

  const ventasDesde = async (desde: Date) => {
    const [fila] = await db
      .select({
        n: sql<number>`COUNT(*)`,
        monto: sql<number>`COALESCE(SUM(${subtotal}), 0)`,
        margen: sql<number>`COALESCE(SUM(${comision}), 0)`,
      })
      .from(pedidos)
      .where(and(gte(pedidos.creadoEn, desde), ...suyo));

    return {
      n: Number(fila?.n ?? 0),
      monto: Number(fila?.monto ?? 0),
      margen: Number(fila?.margen ?? 0),
    };
  };

  const [hoy, mes] = await Promise.all([
    ventasDesde(medianoche),
    ventasDesde(primeroDelMes),
  ]);

  /* Los comprobantes que esperan a un validador. Para un comercio son los
     suyos: él no valida, pero sí quiere saber cuántos cobros tiene en el aire. */
  const [pendientes] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(pagosZelle)
    .where(
      tiendaId
        ? and(
            eq(pagosZelle.estado, "pendiente"),
            eq(pagosZelle.tiendaId, tiendaId),
          )
        : eq(pagosZelle.estado, "pendiente"),
    )
    .catch(() => [{ n: 0 }]);

  const [sinEntregar] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(pedidos)
    .where(
      and(
        sql`${pedidos.estado} IN (${sql.join(
          SIN_ENTREGAR.map((e) => sql`${e}`),
          sql`, `,
        )})`,
        ...suyo,
      ),
    )
    .catch(() => [{ n: 0 }]);

  const [porPagar] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(retiros)
    .where(
      tiendaId
        ? and(eq(retiros.estado, "solicitado"), eq(retiros.tiendaId, tiendaId))
        : eq(retiros.estado, "solicitado"),
    )
    .catch(() => [{ n: 0 }]);

  /* Su saldo, para que la pregunta «¿cuánto tengo?» se conteste en la primera
     pantalla y no obligue a entrar a la billetera. */
  const posicion = tiendaId ? await obtenerPosicion().catch(() => null) : null;

  /* Los contracargos también pasan por el alcance: un contracargo pertenece a
     una venta, y esa venta es de un comercio. Sin el filtro, a uno le saldría
     el contracargo de otro en su propia pantalla de entrada. */
  const disputasSuyas = tiendaId
    ? sql`AND EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${disputas.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql``;

  const [enDisputa] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(disputas)
    .where(sql`${disputas.estado} = 'abierta' ${disputasSuyas}`)
    .catch(() => [{ n: 0 }]);

  return {
    hoyCantidad: hoy.n,
    hoyCentavos: hoy.monto,
    mesCantidad: mes.n,
    mesCentavos: mes.monto,
    mesMargenCentavos: mes.margen,
    porValidar: Number(pendientes?.n ?? 0),
    porEntregar: Number(sinEntregar?.n ?? 0),
    retirosPendientes: Number(porPagar?.n ?? 0),
    contracargos: Number(enDisputa?.n ?? 0),
    /* Todo se cobra en dólares: es la moneda del cobro, no la del comercio. */
    moneda: "USD",
    disponibleCentavos: posicion ? posicion.disponibleCentavos : null,
  };
}
