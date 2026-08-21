import "server-only";

import { inArray, and, desc, eq, sql, type SQL } from "drizzle-orm";

import { esEquipoInterno, obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  ordenesCompra,
  itemsPedido,
  pagos,
  pagosZelle,
  pedidos,
  tiendas,
  user,
} from "@/lib/db/schema";
import { comisionDelProcesador } from "@/lib/dinero";
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

/**
 * EL ASIENTO CONTABLE DEL MES, PARA XERO.
 *
 * ══ POR QUÉ ESTO Y NO UNA INTEGRACIÓN CON SU API ══
 *
 * Porque hoy hay tres órdenes de compra en total. Construir una integración
 * con la API de Xero para eso son semanas de trabajo, una credencial más que
 * mantener, y una pieza que se rompe sola cuando Xero cambia algo — todo para
 * automatizar tres asientos al mes que se escriben en diez minutos.
 *
 * Se conecta de verdad cuando el asiento mensual pase de una hora, o cuando
 * haya más de unas cincuenta órdenes al mes. Antes de eso, la integración
 * cuesta más de lo que ahorra.
 *
 * ══ LOS TRES RENGLONES, Y POR QUÉ SON TRES ══
 *
 * El ingreso va por el BRUTO —lo que pagó el comprador— y de ahí salen dos
 * costos de dos dueños distintos: lo que se llevó el procesador y lo que se le
 * paga al comercio. Juntarlos en un solo renglón de «comisiones» haría que el
 * margen pareciera otro y que nadie pudiera ver cuál de los dos crece.
 *
 * Los tres suman el bruto exacto, siempre.
 */
export async function tablaDelAsientoMensual(): Promise<Tabla> {
  /* SOLO EL EQUIPO INTERNO, Y SE COMPRUEBA ANTES DE TOCAR LA BASE.
     Aquí no vale el alcance por comercio que usan las otras exportaciones:
     este archivo no tiene una versión «la suya» que se le pueda entregar a un
     vendedor. Trae el ingreso BRUTO de todos los comercios juntos, el costo de
     la mercancía y lo que se llevó el procesador — o sea, las ventas de sus
     competidores y el margen de la casa.

     La ruta solo exige `tienePermisoDePanel()`, y ese permiso lo tiene el rol
     `vendedor`: sin esta línea, cualquier comercio se lo lleva escribiendo
     `?que=asiento` en la barra de direcciones. */
  if (!(await esEquipoInterno())) {
    throw new Error("El asiento contable es solo del equipo de Mercatren");
  }

  const db = getDb();

  const filas = await db
    .select({
      mes: sql<string>`strftime('%Y-%m', ${pedidos.creadoEn}, 'unixepoch')`,
      moneda: pedidos.moneda,
      brutoCentavos: sql<number>`SUM(${pedidos.totalCentavos})`,
      pedidos: sql<number>`COUNT(*)`,
      /* LO COBRADO CON TARJETA, APARTE. Es lo único sobre lo que el procesador
         cobra: por Zelle no interviene nadie. Sumar los dos juntos le
         inventaría a Stripe una comisión sobre transferencias que nunca vio. */
      brutoTarjetaCentavos: sql<number>`COALESCE(SUM(CASE WHEN ${pedidos.metodoPago} = 'tarjeta' THEN ${pedidos.totalCentavos} ELSE 0 END), 0)`,
      pedidosTarjeta: sql<number>`COALESCE(SUM(CASE WHEN ${pedidos.metodoPago} = 'tarjeta' THEN 1 ELSE 0 END), 0)`,
    })
    .from(pedidos)
    /* Solo lo cobrado de verdad. Un pedido creado y sin pagar no es un
       ingreso, y meterlo inflaría el asiento con dinero que nunca entró. */
    .where(
      inArray(pedidos.estado, ["pagado", "preparando", "enviado", "entregado"]),
    )
    .groupBy(
      sql`strftime('%Y-%m', ${pedidos.creadoEn}, 'unixepoch')`,
      pedidos.moneda,
    )
    .orderBy(sql`strftime('%Y-%m', ${pedidos.creadoEn}, 'unixepoch') DESC`)
    .limit(TOPE_FILAS);

  const costos = await db
    .select({
      mes: sql<string>`strftime('%Y-%m', ${ordenesCompra.emitidaEn}, 'unixepoch')`,
      moneda: ordenesCompra.moneda,
      costoCentavos: sql<number>`SUM(${ordenesCompra.subtotalCentavos})`,
    })
    .from(ordenesCompra)
    .groupBy(
      sql`strftime('%Y-%m', ${ordenesCompra.emitidaEn}, 'unixepoch')`,
      ordenesCompra.moneda,
    );

  const costoPorMes = new Map(
    costos.map((c) => [`${c.mes}|${c.moneda}`, c.costoCentavos ?? 0]),
  );

  return {
    cabeceras: [
      "Mes",
      "Moneda",
      "Pedidos",
      "Ingresos por ventas (bruto)",
      "Costo de mercancía vendida",
      "Comisiones de procesador (2.9% + $0.30 por cobro con tarjeta)",
      "Margen",
    ],
    filas: filas.map((f) => {
      const bruto = f.brutoCentavos ?? 0;
      const costo = costoPorMes.get(`${f.mes}|${f.moneda}`) ?? 0;
      /**
       * LO QUE SE LLEVÓ EL PROCESADOR: 2.9 % + $0.30 POR COBRO CON TARJETA.
       *
       * Esta línea era un cero fijo, con un comentario al lado que prometía
       * que salía por diferencia. No salía: salía cero, y el margen del mes se
       * declaraba con las comisiones de Stripe dentro. En un asiento contable
       * eso es declarar de más.
       *
       * Se calcula con la misma fórmula con la que se armó el precio de venta,
       * así los tres renglones suman el bruto exacto. **No pretende cuadrar al
       * centavo con el extracto de Stripe** —de eso ya se encarga Xero, que
       * está conectado con Stripe y con el banco—: aquí sirve para que el
       * margen no salga inflado y para saber qué buscar en la conciliación.
       */
      const procesador = comisionDelProcesador(
        f.brutoTarjetaCentavos ?? 0,
        f.pedidosTarjeta ?? 0,
      );
      return [
        f.mes,
        f.moneda,
        f.pedidos ?? 0,
        bruto / 100,
        costo / 100,
        procesador / 100,
        (bruto - costo - procesador) / 100,
      ];
    }),
    recortado: filas.length >= TOPE_FILAS,
  };
}
