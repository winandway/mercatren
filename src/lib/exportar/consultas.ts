import "server-only";

import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  itemsPedido,
  pagos,
  pagosZelle,
  pedidos,
  tiendas,
  user,
} from "@/lib/db/schema";
import { dinero, fechaIso } from "@/lib/exportar/csv";

/**
 * LOS DATOS QUE SE LLEVA EL CONTADOR.
 *
 * Las mismas reglas de alcance que en pantalla: un comercio se lleva SOLO sus
 * ventas, y los importes son los de sus renglones. Bajar la guardia aquí «por
 * ser un archivo» sería justo lo contrario: en pantalla se ven 25 filas y en
 * el archivo van todas.
 */

/**
 * EL TOPE, Y SE DICE CUÁNDO SE APLICA.
 *
 * Un archivo sin límite puede tumbar la petición con un catálogo grande. Pero
 * un archivo recortado en silencio es peor que no tenerlo: el contador suma
 * una parte creyendo que es el total. Cuando se recorta, se avisa.
 */
export const TOPE_FILAS = 5000;

async function tiendaDelAlcance(comercioPedido?: string) {
  const alcance = await obtenerAlcance();
  if (alcance.tipo === "tienda") return alcance.tiendaId;

  if (comercioPedido) {
    const db = getDb();
    const [t] = await db
      .select({ id: tiendas.id })
      .from(tiendas)
      .where(eq(tiendas.slug, comercioPedido))
      .limit(1);
    return t?.id ?? null;
  }
  return null;
}

export type Tabla = {
  cabeceras: string[];
  filas: (string | number | null)[][];
  /** True si se llegó al tope y quedaron filas fuera. */
  recortado: boolean;
};

/** Las ventas: un renglón por pedido. */
export async function tablaDeVentas(comercio?: string): Promise<Tabla> {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercio);

  const condiciones: SQL[] = [];
  if (tiendaId) {
    condiciones.push(
      sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`,
    );
  }
  const donde = condiciones.length ? and(...condiciones) : undefined;

  const deLaTienda = tiendaId
    ? sql`AND ${itemsPedido.tiendaId} = ${tiendaId}`
    : sql``;

  const filas = await db
    .select({
      numero: pedidos.numero,
      creadoEn: pedidos.creadoEn,
      estado: pedidos.estado,
      metodo: pedidos.metodoPago,
      pais: pedidos.paisDestino,
      cliente: user.name,
      correo: user.email,
      moneda: pedidos.moneda,
      articulos: sql<number>`(SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} ${deLaTienda})`,
      subtotal: sql<number>`(SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} ${deLaTienda})`,
      /* LA COMISIÓN SALE DE `items_pedido`, que es la ÚNICA cifra buena. Se
         guarda con los puntos base del método con el que se pagó; recalcularla
         aquí daría un número distinto al de la orden de compra. */
      comision: sql<number>`(SELECT COALESCE(SUM(${itemsPedido.comisionCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} ${deLaTienda})`,
      referenciaTarjeta: sql<
        string | null
      >`(SELECT ${pagos.referenciaExterna} FROM ${pagos} WHERE ${pagos.pedidoId} = ${pedidos.id} AND ${pagos.estado} = 'confirmado' ORDER BY ${pagos.creadoEn} DESC LIMIT 1)`,
      referenciaZelle: sql<
        string | null
      >`(SELECT ${pagosZelle.codigoConfirmacion} FROM ${pagosZelle} WHERE ${pagosZelle.pedidoId} = ${pedidos.id} ORDER BY ${pagosZelle.creadoEn} DESC LIMIT 1)`,
    })
    .from(pedidos)
    .innerJoin(user, eq(user.id, pedidos.clienteId))
    .where(donde)
    .orderBy(desc(pedidos.creadoEn))
    .limit(TOPE_FILAS + 1);

  const recortado = filas.length > TOPE_FILAS;

  return {
    cabeceras: [
      "Pedido",
      "Fecha",
      "Estado",
      "Metodo de pago",
      "Referencia del cobro",
      "Cliente",
      "Correo",
      "Pais de entrega",
      "Articulos",
      "Venta",
      "Margen de Mercatren",
      "Se le paga al comercio",
      "Moneda",
    ],
    filas: filas.slice(0, TOPE_FILAS).map((f) => {
      const subtotal = Number(f.subtotal ?? 0);
      const comision = Number(f.comision ?? 0);
      return [
        f.numero,
        fechaIso(f.creadoEn),
        f.estado,
        f.metodo ?? "",
        f.referenciaTarjeta ?? f.referenciaZelle ?? "",
        f.cliente,
        f.correo,
        f.pais ?? "",
        Number(f.articulos ?? 0),
        dinero(subtotal),
        dinero(comision),
        /* El neto se resta, no se recalcula: así las tres columnas suman
           exactamente y el contador no encuentra un centavo suelto. */
        dinero(subtotal - comision),
        f.moneda,
      ];
    }),
    recortado,
  };
}

/** Los cobros con tarjeta: un renglón por cobro. */
export async function tablaDeCobrosTarjeta(comercio?: string): Promise<Tabla> {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercio);

  const condiciones: SQL[] = [eq(pagos.metodo, "stripe")];
  if (tiendaId) {
    condiciones.push(
      sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pagos.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`,
    );
  }

  const monto = tiendaId
    ? sql<number>`(SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pagos.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql<number>`${pagos.montoCentavos}`;

  const filas = await db
    .select({
      creadoEn: pagos.creadoEn,
      estado: pagos.estado,
      referencia: pagos.referenciaExterna,
      monto,
      moneda: pagos.moneda,
      pedidoNumero: pedidos.numero,
      cliente: user.name,
      correo: user.email,
    })
    .from(pagos)
    .leftJoin(pedidos, eq(pedidos.id, pagos.pedidoId))
    .leftJoin(user, eq(user.id, pedidos.clienteId))
    .where(and(...condiciones))
    .orderBy(desc(pagos.creadoEn))
    .limit(TOPE_FILAS + 1);

  return {
    cabeceras: [
      "Fecha",
      "Pedido",
      "Estado del cobro",
      "Referencia de Stripe",
      "Cliente",
      "Correo",
      "Monto",
      "Moneda",
    ],
    filas: filas.slice(0, TOPE_FILAS).map((f) => [
      fechaIso(f.creadoEn),
      f.pedidoNumero ?? "",
      f.estado,
      /* La referencia se exporta siempre en este archivo, incluso sin
         confirmar: es el papel de trabajo de quien concilia contra Stripe, no
         una pantalla que pueda hacer creer que ya se cobró. La columna del
         estado va al lado, y manda. */
      f.referencia ?? "",
      f.cliente ?? "",
      f.correo ?? "",
      dinero(Number(f.monto ?? 0)),
      f.moneda,
    ]),
    recortado: filas.length > TOPE_FILAS,
  };
}
