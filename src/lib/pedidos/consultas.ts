import "server-only";

import { and, desc, eq, or, sql, type SQL } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  ESTADOS_PEDIDO,
  itemsPedido,
  pagos,
  pagosZelle,
  pedidos,
  tiendas,
  user,
} from "@/lib/db/schema";
import { rastroDelPago, type Rastro } from "@/lib/pagos/rastro";

/**
 * Los pedidos vistos desde el panel.
 *
 * REGLA DE ALCANCE: un comercio ve SOLO los pedidos que le compraron a el, y
 * de esos ve lo suyo. Un pedido puede mezclar varios comercios, asi que no
 * basta con filtrar por pedido: se filtra por los renglones que son de esa
 * tienda, y los totales que se muestran son los de ESOS renglones, no los del
 * pedido completo. Mostrarle a un comercio el total de un pedido compartido
 * seria decirle que vendio mas de lo que vendio.
 *
 * El equipo de Mercatren si ve el pedido entero.
 */

/** La tienda que toca, segun quien pregunta. */
/**
 * ══ EL PAÍS DEL SELECTOR APLICA A TODO EL PANEL DEL EQUIPO (28 ago 2026) ══
 *
 * El selector de país existía desde el 17 de agosto y solo lo obedecían
 * Zelle y el catálogo: con el panel en Chile, Órdenes y Clientes seguían
 * enseñando los tres países revueltos. Lo pidió el dueño con estas palabras:
 * «cuando yo selecciono, se debe de limpiar todo ese país donde estoy».
 *
 * La regla, calcada de `listarComercios`: **solo cuando quien mira es el
 * equipo con alcance total**. Un comercio ya está acotado a su tienda —
 * filtrarlo además por país lo haría desaparecer de su propia lista el día
 * que se le cambie de vitrina. Y si el equipo eligió un comercio concreto
 * (`?comercio=`), esa elección explícita manda sobre el país.
 */
async function paisMirado(tiendaId: string | null): Promise<SQL | undefined> {
  if (tiendaId) return undefined;
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  return eq(pedidos.mercado, (await mercadoDelPanel()).codigo);
}

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

const POR_PAGINA = 25;

export type FiltrosPedidos = {
  estado?: string;
  comercio?: string;
  pagina?: number;
};

export async function listarPedidosDelPanel(filtros: FiltrosPedidos = {}) {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(filtros.comercio);
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const condiciones: SQL[] = [];

  // Solo se acepta un estado que exista de verdad: lo que venga en la
  // direccion es texto de cualquiera.
  const estado = ESTADOS_PEDIDO.find((e) => e === filtros.estado);
  if (estado) condiciones.push(eq(pedidos.estado, estado));

  // Si hay tienda, solo los pedidos que tienen algun renglon suyo.
  if (tiendaId) {
    condiciones.push(
      sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`,
    );
  }

  const porPais = await paisMirado(tiendaId);
  if (porPais) condiciones.push(porPais);

  const donde = condiciones.length ? and(...condiciones) : undefined;

  // Los importes: si quien mira es un comercio, solo sus renglones.
  const subtotal = tiendaId
    ? sql<number>`(SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql<number>`${pedidos.totalCentavos}`;

  const articulos = tiendaId
    ? sql<number>`(SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql<number>`(SELECT COUNT(*) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id})`;

  const [conteo] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(pedidos)
    .where(donde);

  const filas = await db
    .select({
      numero: pedidos.numero,
      estado: pedidos.estado,
      creadoEn: pedidos.creadoEn,
      paisDestino: pedidos.paisDestino,
      clienteNombre: user.name,
      clienteCorreo: user.email,
      montoCentavos: subtotal,
      moneda: pedidos.moneda,
      articulos,
      estadoPago: sql<
        string | null
      >`(SELECT ${pagosZelle.estado} FROM ${pagosZelle} WHERE ${pagosZelle.pedidoId} = ${pedidos.id} ORDER BY ${pagosZelle.creadoEn} DESC LIMIT 1)`,
      /* CÓMO SE PAGÓ. Hasta el 10 ago 2026 el dato estaba guardado y ninguna
         pantalla lo enseñaba: para saber si una venta entró por tarjeta o por
         Zelle había que ir a «Pagos Zelle» y deducirlo por descarte. */
      metodoPago: pedidos.metodoPago,
      estadoTarjeta: sql<
        string | null
      >`(SELECT ${pagos.estado} FROM ${pagos} WHERE ${pagos.pedidoId} = ${pedidos.id} AND ${pagos.metodo} = 'stripe' ORDER BY ${pagos.creadoEn} DESC LIMIT 1)`,
    })
    .from(pedidos)
    .innerJoin(user, eq(user.id, pedidos.clienteId))
    .where(donde)
    .orderBy(desc(pedidos.creadoEn))
    .limit(POR_PAGINA)
    .offset((pagina - 1) * POR_PAGINA);

  const total = Number(conteo?.n ?? 0);

  return {
    pedidos: filas.map((f) => ({
      ...f,
      montoCentavos: Number(f.montoCentavos),
      articulos: Number(f.articulos),
      rastro: rastroDelPago({
        metodo: f.metodoPago,
        estadoTarjeta: f.estadoTarjeta,
        estadoZelle: f.estadoPago,
        estadoPedido: f.estado,
      }),
    })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    /** true cuando los importes son solo de este comercio. */
    soloDeEsteComercio: Boolean(tiendaId),
  };
}

/** Cuantos pedidos hay en cada estado, para las pestanas. */
export async function contarPedidosPorEstado(comercioPedido?: string) {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercioPedido);

  const donde = tiendaId
    ? sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : await paisMirado(null);

  const filas = await db
    .select({ estado: pedidos.estado, n: sql<number>`COUNT(*)` })
    .from(pedidos)
    .where(donde)
    .groupBy(pedidos.estado);

  const cuenta: Record<string, number> = { total: 0 };
  for (const f of filas) {
    cuenta[f.estado] = Number(f.n);
    cuenta.total += Number(f.n);
  }
  return cuenta;
}

/**
 * Los clientes que han comprado, con lo que llevan gastado.
 *
 * Un comercio ve solo a quienes le compraron A EL, y el gasto es lo que
 * gastaron EN SU TIENDA. El equipo de Mercatren ve a todos.
 */
export async function listarClientes(
  comercioPedido?: string,
  busqueda?: string,
) {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercioPedido);

  /* Se filtra en la base: esta lista crece con CADA comprador, así que es de
     las que más rápido se vuelven imposibles de recorrer a ojo. */
  const texto = (busqueda ?? "").trim().toLowerCase();
  const patron = `%${texto}%`;

  const gastado = tiendaId
    ? sql<number>`COALESCE(SUM((SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})), 0)`
    : sql<number>`COALESCE(SUM(${pedidos.totalCentavos}), 0)`;

  const donde = tiendaId
    ? sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pedidos.id} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : await paisMirado(null);

  const filas = await db
    .select({
      id: user.id,
      nombre: user.name,
      correo: user.email,
      pais: user.paisEntrega,
      pedidos: sql<number>`COUNT(${pedidos.id})`,
      gastadoCentavos: gastado,
      ultimo: sql<number | null>`MAX(${pedidos.creadoEn})`,
    })
    .from(pedidos)
    .innerJoin(user, eq(user.id, pedidos.clienteId))
    .where(
      texto
        ? and(
            donde,
            or(
              sql`LOWER(${user.name}) LIKE ${patron}`,
              sql`LOWER(${user.email}) LIKE ${patron}`,
            ),
          )
        : donde,
    )
    .groupBy(user.id, user.name, user.email, user.paisEntrega)
    .orderBy(desc(sql`COUNT(${pedidos.id})`))
    .limit(100);

  return filas.map((f) => ({
    ...f,
    pedidos: Number(f.pedidos),
    gastadoCentavos: Number(f.gastadoCentavos),
  }));
}

/**
 * UN pedido, con todo lo que hace falta para entregarlo.
 *
 * Hasta ahora el panel enseñaba el pedido pero no a dónde mandarlo: el
 * comercio veía "MT-000012 · pagado" y tenía que llamar al cliente para
 * preguntarle su dirección. La dirección se guarda en el pedido justo para
 * esto, congelada tal como estaba el día de la compra.
 *
 * ALCANCE: un comercio solo abre un pedido en el que tenga algún renglón, y
 * solo ve SUS renglones. Un pedido puede mezclar comercios, y lo que le compró
 * a otro no es asunto suyo.
 */
export type PedidoDelPanel = {
  id: string;
  numero: string;
  estado: (typeof ESTADOS_PEDIDO)[number];
  creadoEn: number;
  totalCentavos: number;
  moneda: string;
  cliente: { nombre: string; correo: string };
  entrega: {
    direccion: Record<string, string> | null;
    pais: string | null;
    telefono: string | null;
    notas: string | null;
  };
  renglones: {
    id: string;
    titulo: string;
    cantidad: number;
    subtotalCentavos: number;
    tiendaId: string | null;
  }[];
  /** Cómo se pagó y con qué se identifica ese cobro. */
  rastro: Rastro;
  /** true cuando los renglones que se ven son solo los de este comercio. */
  soloDeEsteComercio: boolean;
};

export async function obtenerPedidoDelPanel(
  numero: string,
): Promise<PedidoDelPanel | null> {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance();

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      estado: pedidos.estado,
      creadoEn: pedidos.creadoEn,
      totalCentavos: pedidos.totalCentavos,
      moneda: pedidos.moneda,
      direccionEntrega: pedidos.direccionEntrega,
      paisDestino: pedidos.paisDestino,
      telefonoContacto: pedidos.telefonoContacto,
      notasCliente: pedidos.notasCliente,
      clienteNombre: user.name,
      clienteCorreo: user.email,
      metodoPago: pedidos.metodoPago,
      /* El cobro con tarjeta y el comprobante de Zelle, cada uno en su tabla.
         Se traen los dos y `rastroDelPago` decide cuál manda según el método
         elegido: traducir estados en cada pantalla acaba en dos pantallas que
         dicen cosas distintas del mismo pedido. */
      estadoTarjeta: sql<
        string | null
      >`(SELECT ${pagos.estado} FROM ${pagos} WHERE ${pagos.pedidoId} = ${pedidos.id} AND ${pagos.metodo} = 'stripe' ORDER BY ${pagos.creadoEn} DESC LIMIT 1)`,
      referenciaTarjeta: sql<
        string | null
      >`(SELECT ${pagos.referenciaExterna} FROM ${pagos} WHERE ${pagos.pedidoId} = ${pedidos.id} AND ${pagos.metodo} = 'stripe' ORDER BY ${pagos.creadoEn} DESC LIMIT 1)`,
      estadoZelle: sql<
        string | null
      >`(SELECT ${pagosZelle.estado} FROM ${pagosZelle} WHERE ${pagosZelle.pedidoId} = ${pedidos.id} ORDER BY ${pagosZelle.creadoEn} DESC LIMIT 1)`,
      codigoZelle: sql<
        string | null
      >`(SELECT ${pagosZelle.codigoConfirmacion} FROM ${pagosZelle} WHERE ${pagosZelle.pedidoId} = ${pedidos.id} ORDER BY ${pagosZelle.creadoEn} DESC LIMIT 1)`,
      bancoZelle: sql<
        string | null
      >`(SELECT ${pagosZelle.bancoOrigen} FROM ${pagosZelle} WHERE ${pagosZelle.pedidoId} = ${pedidos.id} ORDER BY ${pagosZelle.creadoEn} DESC LIMIT 1)`,
      ultimosCuatroZelle: sql<
        string | null
      >`(SELECT ${pagosZelle.cuentaUltimos4} FROM ${pagosZelle} WHERE ${pagosZelle.pedidoId} = ${pedidos.id} ORDER BY ${pagosZelle.creadoEn} DESC LIMIT 1)`,
    })
    .from(pedidos)
    .innerJoin(user, eq(user.id, pedidos.clienteId))
    .where(eq(pedidos.numero, numero))
    .limit(1);

  if (!pedido) return null;

  const renglones = await db
    .select({
      id: itemsPedido.id,
      titulo: itemsPedido.titulo,
      cantidad: itemsPedido.cantidad,
      subtotalCentavos: itemsPedido.subtotalCentavos,
      tiendaId: itemsPedido.tiendaId,
    })
    .from(itemsPedido)
    .where(
      tiendaId
        ? and(
            eq(itemsPedido.pedidoId, pedido.id),
            eq(itemsPedido.tiendaId, tiendaId),
          )
        : eq(itemsPedido.pedidoId, pedido.id),
    );

  // Un comercio sin ningún renglón aquí no tiene nada que hacer en este
  // pedido: se responde como si no existiera, igual que con los comprobantes.
  if (tiendaId && renglones.length === 0) return null;

  return {
    id: pedido.id,
    numero: pedido.numero,
    estado: pedido.estado,
    creadoEn:
      pedido.creadoEn instanceof Date
        ? pedido.creadoEn.getTime()
        : Number(pedido.creadoEn) * 1000,
    // A un comercio se le suman SUS renglones, no el total del pedido.
    totalCentavos: tiendaId
      ? renglones.reduce((t, r) => t + Number(r.subtotalCentavos), 0)
      : Number(pedido.totalCentavos),
    moneda: pedido.moneda,
    cliente: { nombre: pedido.clienteNombre, correo: pedido.clienteCorreo },
    entrega: {
      direccion:
        (pedido.direccionEntrega as Record<string, string> | null) ?? null,
      pais: pedido.paisDestino,
      telefono: pedido.telefonoContacto,
      notas: pedido.notasCliente,
    },
    renglones: renglones.map((r) => ({
      ...r,
      cantidad: Number(r.cantidad),
      subtotalCentavos: Number(r.subtotalCentavos),
    })),
    rastro: rastroDelPago({
      metodo: pedido.metodoPago,
      estadoTarjeta: pedido.estadoTarjeta,
      referenciaTarjeta: pedido.referenciaTarjeta,
      estadoZelle: pedido.estadoZelle,
      codigoZelle: pedido.codigoZelle,
      bancoZelle: pedido.bancoZelle,
      ultimosCuatroZelle: pedido.ultimosCuatroZelle,
      estadoPedido: pedido.estado,
    }),
    soloDeEsteComercio: Boolean(tiendaId),
  };
}
