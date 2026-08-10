import "server-only";

import { and, eq, ne, sql } from "drizzle-orm";

import type { Db } from "@/lib/db";
import { huellasComprobante, pagosZelle, pedidos } from "@/lib/db/schema";
import {
  alertasDelComprobante,
  type Alerta,
  type HechosDelComprobante,
} from "@/lib/zelle/alertas";

/**
 * Los hechos que hacen falta para juzgar un comprobante, traídos de la base.
 *
 * La DECISIÓN de qué es sospechoso vive en `alertas.ts`, que es puro y está
 * probado. Aquí solo se buscan los datos.
 *
 * ══ SE MIRA CONTRA TODOS LOS PAGOS, NO SOLO LOS DEL MISMO COMERCIO ══
 *
 * Un código de confirmación identifica UNA transferencia en el banco. Si se
 * usó para pagarle a un comercio, no puede pagarle a otro — buscar solo dentro
 * del mismo comercio dejaría abierta justo la puerta más fácil.
 */
async function hechosDelPago(
  db: Db,
  pagoId: string,
): Promise<HechosDelComprobante | null> {
  /* Se nombran las columnas: pedir la tabla entera lista TODAS las del
     esquema, y una base que ya existe puede no tener la última agregada. */
  const [pago] = await db
    .select({
      id: pagosZelle.id,
      montoCentavos: pagosZelle.montoCentavos,
      codigoConfirmacion: pagosZelle.codigoConfirmacion,
      pagadorCorreo: pagosZelle.pagadorCorreo,
      pedidoId: pagosZelle.pedidoId,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.id, pagoId))
    .limit(1);

  if (!pago) return null;

  const codigo = pago.codigoConfirmacion?.trim();

  /**
   * Otro pago con el MISMO código, separando aprobados de los demás.
   *
   * Se prefiere devolver el número del pedido, que es lo que el validador
   * tiene delante; si el otro pago es del histórico y no tiene pedido, sirve
   * su propio identificador — algo hay que darle para poder ir a mirarlo.
   */
  const conMismoCodigo = codigo
    ? await db
        .select({
          estado: pagosZelle.estado,
          numero: pedidos.numero,
          id: pagosZelle.id,
        })
        .from(pagosZelle)
        .leftJoin(pedidos, eq(pedidos.id, pagosZelle.pedidoId))
        .where(
          and(
            eq(
              sql`LOWER(TRIM(${pagosZelle.codigoConfirmacion}))`,
              codigo.toLowerCase(),
            ),
            ne(pagosZelle.id, pago.id),
          ),
        )
        .limit(20)
    : [];

  /** La huella de ESTA captura, para buscar otras iguales. */
  const [propia] = await db
    .select({ huella: huellasComprobante.huella })
    .from(huellasComprobante)
    .where(eq(huellasComprobante.pagoId, pago.id))
    .limit(1);

  const conMismaCaptura = propia?.huella
    ? await db
        .select({
          estado: pagosZelle.estado,
          numero: pedidos.numero,
          id: pagosZelle.id,
        })
        .from(huellasComprobante)
        .innerJoin(pagosZelle, eq(pagosZelle.id, huellasComprobante.pagoId))
        .leftJoin(pedidos, eq(pedidos.id, pagosZelle.pedidoId))
        .where(
          and(
            eq(huellasComprobante.huella, propia.huella),
            ne(huellasComprobante.pagoId, pago.id),
          ),
        )
        .limit(20)
    : [];

  const señala = (
    filas: { estado: string; numero: string | null; id: string }[],
    aprobados: boolean,
  ) => {
    const f = filas.find((x) =>
      aprobados ? x.estado === "aprobado" : x.estado !== "aprobado",
    );
    return f ? (f.numero ?? f.id) : null;
  };

  const [pedido] = pago.pedidoId
    ? await db
        .select({ totalCentavos: pedidos.totalCentavos })
        .from(pedidos)
        .where(eq(pedidos.id, pago.pedidoId))
        .limit(1)
    : [];

  /* Cuántas veces se le rechazó antes a este mismo comprador. No prueba nada
     por sí solo —un rechazo puede ser un error honesto— pero tres seguidos
     dicen mucho, y el validador merece saberlo antes de aprobar. */
  const [rechazos] = pago.pagadorCorreo
    ? await db
        .select({ n: sql<number>`COUNT(*)` })
        .from(pagosZelle)
        .where(
          and(
            eq(pagosZelle.pagadorCorreo, pago.pagadorCorreo),
            eq(pagosZelle.estado, "rechazado"),
            ne(pagosZelle.id, pago.id),
          ),
        )
    : [];

  return {
    montoCentavos: Number(pago.montoCentavos),
    totalDelPedidoCentavos: pedido ? Number(pedido.totalCentavos) : null,
    codigoConfirmacion: pago.codigoConfirmacion,
    codigoYaAprobadoEn: señala(conMismoCodigo, true),
    codigoVistoEn: señala(conMismoCodigo, false),
    capturaYaAprobadaEn: señala(conMismaCaptura, true),
    capturaVistaEn: señala(conMismaCaptura, false),
    rechazosDelPagador: Number(rechazos?.n ?? 0),
  };
}

/**
 * Las señales de un comprobante.
 *
 * Si algo falla al buscarlas se devuelve la lista vacía: un problema de base
 * **no puede dejar la cola de validación sin abrir**. El riesgo de perder un
 * aviso es menor que el de que nadie pueda trabajar.
 */
export async function alertasDelPago(
  db: Db,
  pagoId: string,
): Promise<Alerta[]> {
  try {
    const hechos = await hechosDelPago(db, pagoId);
    return hechos ? alertasDelComprobante(hechos) : [];
  } catch {
    return [];
  }
}

/**
 * Las señales de varios pagos de una vez, para la cola.
 *
 * Cada pago necesita sus propias consultas, así que van EN PARALELO: de una en
 * una, una cola de veinte serían ochenta viajes encadenados a la base y la
 * pantalla tardaría segundos en abrir. Nadie revisa pagos en una pantalla que
 * se arrastra.
 *
 * Se topa en 50 por si algún día la cola crece sin que nadie mire: es un freno
 * de emergencia, no el caso normal — lo que está esperando revisión es corto
 * por definición.
 */
export async function alertasDeVarios(
  db: Db,
  pagoIds: string[],
): Promise<Map<string, Alerta[]>> {
  const acotados = pagoIds.slice(0, 50);

  const resultados = await Promise.all(
    acotados.map(async (id) => [id, await alertasDelPago(db, id)] as const),
  );

  return new Map(resultados.filter(([, alertas]) => alertas.length > 0));
}
