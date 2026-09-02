import "server-only";

import {
  LLAVE_POLITICA_ZELLE,
  politicaZelleDe,
  zelleHabilitadaPara,
} from "@/lib/cobros/zelle";

import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import type { EstadoCobro } from "@/lib/cobros/reglas";
import {
  cobrosSolicitados,
  disputas,
  itemsPedido,
  pagos,
  pedidos,
  tiendas,
  user,
} from "@/lib/db/schema";

/**
 * LOS COBROS CON TARJETA, QUE NO SE VEÍAN EN NINGUNA PANTALLA.
 *
 * ══ POR QUÉ ESTO FALTABA ══
 *
 * El panel tenía una sección entera para Zelle —«Pagos Zelle»— y **ninguna
 * para la tarjeta**, que es el método con el que entró la primera venta real.
 * Para revisar un cobro con tarjeta había que abrir el pedido, uno por uno, o
 * entrar al panel de Stripe. Palabras del dueño: «yo esperaría un botón que
 * diga pago con tarjeta, no lo veo».
 *
 * El menú estaba armado por MECANISMO (Zelle sí, tarjeta no) en vez de por
 * trabajo (los cobros). Esto es la mitad de datos de la corrección.
 *
 * ══ ALCANCE ══
 *
 * Un comercio ve solo los cobros de pedidos donde él vendió algo, y el importe
 * que se le enseña es el de SUS renglones. Un pedido puede mezclar comercios:
 * enseñarle el total del cobro sería decirle que vendió más de lo que vendió.
 */

/** La tienda que toca, según quien pregunta. `null` = el equipo, lo ve todo. */
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

export type CobroTarjeta = {
  id: string;
  pedidoNumero: string | null;
  pedidoEstado: string | null;
  clienteNombre: string | null;
  estado: string;
  /** El `pi_…` de Stripe. Es lo que se busca en su panel. */
  referencia: string | null;
  montoCentavos: number;
  moneda: string;
  creadoEn: Date | null;
  /** El estado de la disputa, si esta venta tiene un contracargo abierto. */
  disputa: string | null;
};

export type ListadoTarjeta = {
  cobros: CobroTarjeta[];
  total: number;
  pagina: number;
  paginas: number;
  /** Lo cobrado de verdad en lo que se está mirando. */
  sumaConfirmadaCentavos: number;
};

/**
 * ══ EL PAÍS DEL SELECTOR APLICA TAMBIÉN A LOS COBROS (28 ago 2026) ══
 *
 * Misma regla que Órdenes: solo para el equipo con alcance total (sin tienda
 * elegida). Un cobro con tarjeta se cuelga de su pedido, que ya sabe su
 * mercado; un enlace de cobro, de su tienda.
 */
async function paisMiradoEnPedidos(
  tiendaId: string | null,
): Promise<SQL | undefined> {
  if (tiendaId) return undefined;
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const codigo = (await mercadoDelPanel()).codigo;
  return sql`EXISTS (SELECT 1 FROM pedidos p2 WHERE p2.id = ${pagos.pedidoId} AND p2.mercado = ${codigo})`;
}

async function paisMiradoEnTiendas(
  tiendaId: string | null,
): Promise<SQL | undefined> {
  if (tiendaId) return undefined;
  const { mercadoDelPanel } = await import("@/lib/mercado/panel");
  const codigo = (await mercadoDelPanel()).codigo;
  return eq(tiendas.mercado, codigo);
}

export async function listarCobrosConTarjeta(
  filtros: {
    estado?: string;
    comercio?: string;
    pagina?: number;
  } = {},
): Promise<ListadoTarjeta> {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(filtros.comercio);
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const condiciones: SQL[] = [eq(pagos.metodo, "stripe")];

  /* Solo un estado que exista de verdad: lo que llega por la dirección es
     texto que escribe cualquiera. */
  const ESTADOS = ["pendiente", "confirmado", "rechazado", "reembolsado"];
  if (filtros.estado && ESTADOS.includes(filtros.estado)) {
    condiciones.push(sql`${pagos.estado} = ${filtros.estado}`);
  }

  if (tiendaId) {
    condiciones.push(
      sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pagos.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`,
    );
  }

  const porPais = await paisMiradoEnPedidos(tiendaId);
  if (porPais) condiciones.push(porPais);

  const donde = and(...condiciones);

  /* El importe: si quien mira es un comercio, solo sus renglones. */
  const monto = tiendaId
    ? sql<number>`(SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pagos.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql<number>`${pagos.montoCentavos}`;

  const [conteo] = await db
    .select({
      n: sql<number>`COUNT(*)`,
      suma: sql<number>`COALESCE(SUM(CASE WHEN ${pagos.estado} = 'confirmado' THEN ${monto} ELSE 0 END), 0)`,
    })
    .from(pagos)
    .where(donde);

  const filas = await db
    .select({
      id: pagos.id,
      pedidoId: pagos.pedidoId,
      pedidoNumero: pedidos.numero,
      pedidoEstado: pedidos.estado,
      clienteNombre: user.name,
      estado: pagos.estado,
      referencia: pagos.referenciaExterna,
      montoCentavos: monto,
      moneda: pagos.moneda,
      creadoEn: pagos.creadoEn,
    })
    .from(pagos)
    .leftJoin(pedidos, eq(pedidos.id, pagos.pedidoId))
    .leftJoin(user, eq(user.id, pedidos.clienteId))
    .where(donde)
    .orderBy(desc(pagos.creadoEn))
    .limit(POR_PAGINA)
    .offset((pagina - 1) * POR_PAGINA);

  /* Las disputas de la tanda, en UNA consulta: una por fila serían 25 viajes
     a la base por pantalla. */
  const ids = filas.map((f) => f.pedidoId).filter(Boolean) as string[];
  const conDisputa = new Map<string, string>();
  if (ids.length > 0) {
    const filasDisputa = await db
      .select({ pedidoId: disputas.pedidoId, estado: disputas.estado })
      .from(disputas)
      .where(inArray(disputas.pedidoId, ids))
      .catch(() => []);
    for (const d of filasDisputa) {
      if (d.pedidoId) conDisputa.set(d.pedidoId, d.estado);
    }
  }

  const total = Number(conteo?.n ?? 0);

  return {
    cobros: filas.map((f) => ({
      id: f.id,
      pedidoNumero: f.pedidoNumero,
      pedidoEstado: f.pedidoEstado,
      clienteNombre: f.clienteNombre,
      estado: f.estado,
      referencia: f.referencia,
      montoCentavos: Number(f.montoCentavos ?? 0),
      moneda: f.moneda,
      creadoEn: f.creadoEn,
      disputa: f.pedidoId ? (conDisputa.get(f.pedidoId) ?? null) : null,
    })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    sumaConfirmadaCentavos: Number(conteo?.suma ?? 0),
  };
}

export type ResumenTarjeta = {
  confirmados: number;
  montoConfirmadoCentavos: number;
  pendientes: number;
  rechazados: number;
  /** Contracargos que siguen abiertos: dinero que ya salió de la cuenta. */
  disputasAbiertas: number;
  montoDisputadoCentavos: number;
};

export async function resumenDeTarjeta(
  comercio?: string,
): Promise<ResumenTarjeta> {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercio);

  const porPaisResumen = await paisMiradoEnPedidos(tiendaId);
  const alcance = tiendaId
    ? sql`AND EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pagos.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : porPaisResumen
      ? sql`AND ${porPaisResumen}`
      : sql``;

  const monto = tiendaId
    ? sql<number>`(SELECT COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0) FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${pagos.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql<number>`${pagos.montoCentavos}`;

  const [fila] = await db
    .select({
      confirmados: sql<number>`COALESCE(SUM(CASE WHEN ${pagos.estado} = 'confirmado' THEN 1 ELSE 0 END), 0)`,
      montoConfirmado: sql<number>`COALESCE(SUM(CASE WHEN ${pagos.estado} = 'confirmado' THEN ${monto} ELSE 0 END), 0)`,
      pendientes: sql<number>`COALESCE(SUM(CASE WHEN ${pagos.estado} = 'pendiente' THEN 1 ELSE 0 END), 0)`,
      rechazados: sql<number>`COALESCE(SUM(CASE WHEN ${pagos.estado} IN ('rechazado','reembolsado') THEN 1 ELSE 0 END), 0)`,
    })
    .from(pagos)
    .where(sql`${pagos.metodo} = 'stripe' ${alcance}`);

  /**
   * LAS DISPUTAS TAMBIÉN PASAN POR EL ALCANCE.
   *
   * Un contracargo es de una venta concreta, y esa venta es de un comercio.
   * Sin el filtro, a un comercio le saldrían los contracargos de otro —con su
   * monto— en su propia pantalla. La primera versión de esta consulta los
   * contaba todos: quedaba «tienes 1 contracargo» sobre una venta que no era
   * suya.
   */
  const soloSuyas = tiendaId
    ? sql`AND EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${disputas.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql``;

  const [d] = await db
    .select({
      n: sql<number>`COUNT(*)`,
      monto: sql<number>`COALESCE(SUM(${disputas.montoCentavos}), 0)`,
    })
    .from(disputas)
    .where(sql`${disputas.estado} = 'abierta' ${soloSuyas}`)
    .catch(() => [{ n: 0, monto: 0 }]);

  return {
    confirmados: Number(fila?.confirmados ?? 0),
    montoConfirmadoCentavos: Number(fila?.montoConfirmado ?? 0),
    pendientes: Number(fila?.pendientes ?? 0),
    rechazados: Number(fila?.rechazados ?? 0),
    disputasAbiertas: Number(d?.n ?? 0),
    montoDisputadoCentavos: Number(d?.monto ?? 0),
  };
}

export type DisputaVista = {
  id: string;
  estado: string;
  motivo: string | null;
  montoCentavos: number;
  moneda: string;
  respondeHasta: Date | null;
  creadoEn: Date | null;
  pedidoNumero: string | null;
};

/**
 * LOS CONTRACARGOS, EN UNA LISTA.
 *
 * Antes solo salían dentro de la ficha del pedido disputado. Para saber si
 * había alguno abierto había que abrir los pedidos de uno en uno — es decir,
 * había que sospechar primero. Un contracargo es dinero que YA salió de la
 * cuenta: tiene que verse sin buscarlo.
 */
export async function listarDisputas(
  comercio?: string,
): Promise<DisputaVista[]> {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercio);

  /* El mismo candado que en el resumen: un comercio ve los contracargos de
     SUS ventas y de ninguna otra. */
  const codigoPais = tiendaId
    ? null
    : (await (await import("@/lib/mercado/panel")).mercadoDelPanel()).codigo;
  const soloSuyas = tiendaId
    ? sql`EXISTS (SELECT 1 FROM ${itemsPedido} WHERE ${itemsPedido.pedidoId} = ${disputas.pedidoId} AND ${itemsPedido.tiendaId} = ${tiendaId})`
    : sql`EXISTS (SELECT 1 FROM pedidos p2 WHERE p2.id = ${disputas.pedidoId} AND p2.mercado = ${codigoPais})`;

  return db
    .select({
      id: disputas.id,
      estado: disputas.estado,
      motivo: disputas.motivo,
      montoCentavos: disputas.montoCentavos,
      moneda: disputas.moneda,
      respondeHasta: disputas.respondeHasta,
      creadoEn: disputas.creadoEn,
      pedidoNumero: pedidos.numero,
    })
    .from(disputas)
    .leftJoin(pedidos, eq(pedidos.id, disputas.pedidoId))
    .where(soloSuyas)
    .orderBy(desc(disputas.creadoEn))
    .limit(50)
    .catch(() => []);
}

export type EnlaceDeCobro = {
  id: string;
  /** El secreto que se pega en el chat. Es lo que el comercio reenvía. */
  enlace: string;
  referencia: string;
  concepto: string | null;
  contactoNombre: string | null;
  contactoCorreo: string;
  montoCentavos: number;
  moneda: string;
  estado: EstadoCobro;
  venceEn: Date | null;
  pagadoEn: Date | null;
  creadoEn: Date | null;
  tiendaNombre: string | null;
};

/**
 * Los cobros que el comercio pidió desde SU sistema (el enlace de pago).
 *
 * El estado que se guarda no se toca aquí: `vencido` se calcula al mostrarlo
 * (`estadoParaMostrar`), porque un estado guardado depende de que algo lo
 * escriba a tiempo y, si eso falla, un enlace caducado seguiría diciendo que
 * se puede pagar.
 */
export async function listarEnlacesDeCobro(
  comercio?: string,
): Promise<EnlaceDeCobro[]> {
  const db = getDb();
  const tiendaId = await tiendaDelAlcance(comercio);

  const donde = tiendaId
    ? eq(cobrosSolicitados.tiendaId, tiendaId)
    : await paisMiradoEnTiendas(null);

  return db
    .select({
      id: cobrosSolicitados.id,
      /* EL ENLACE, QUE ES LO QUE SE REENVÍA.
         No estaba, y por eso el comercio veía su cobro en pantalla y no tenía
         nada que copiar: para mandárselo a alguien había que sacarlo de la
         base a mano. Es un secreto, sí — pero es SU secreto, y el alcance ya
         garantiza que solo ve los suyos. */
      enlace: cobrosSolicitados.enlace,
      referencia: cobrosSolicitados.referencia,
      concepto: cobrosSolicitados.concepto,
      contactoNombre: cobrosSolicitados.contactoNombre,
      contactoCorreo: cobrosSolicitados.contactoCorreo,
      montoCentavos: cobrosSolicitados.montoCentavos,
      moneda: cobrosSolicitados.moneda,
      estado: cobrosSolicitados.estado,
      venceEn: cobrosSolicitados.venceEn,
      pagadoEn: cobrosSolicitados.pagadoEn,
      creadoEn: cobrosSolicitados.creadoEn,
      tiendaNombre: tiendas.nombre,
    })
    .from(cobrosSolicitados)
    .leftJoin(tiendas, eq(tiendas.id, cobrosSolicitados.tiendaId))
    .where(donde)
    .orderBy(desc(cobrosSolicitados.creadoEn))
    .limit(100)
    .catch(() => []);
}

/**
 * LA DECISIÓN DE ZELLE PARA UN COBRO CONCRETO.
 *
 * Junta las tres fuentes —el interruptor de la tienda, el mínimo general del
 * panel y la variable del receptor— y le pasa todo a la función pura, que es
 * la que decide y la que está probada. Aquí solo se lee.
 */
export async function zelleDelCobro(
  tiendaId: string,
  montoCentavos: number,
): Promise<
  | { disponible: true; receptor: string; minimoCentavos: number }
  | {
      disponible: false;
      /**
       * ¿SE PASÓ DEL TOPE DE ZELLE?
       *
       * Va como un sí/no y NO como el motivo entero, y es deliberado: la página
       * pública del cobro tiene un candado que prohíbe la palabra «motivo» en
       * todo el archivo (`cobros-anular.test.ts`), porque ahí vive el motivo de
       * una anulación —escrito por una persona, y puede nombrar al comercio—
       * que jamás puede llegarle a quien paga. Este dato es otra cosa, pero la
       * regla es del archivo, no del dato: se le pasa lo justo.
       */
      topeSuperado: boolean;
      maximoCentavos: number;
    }
> {
  const { decidirZelle } = await import("@/lib/cobros/zelle");
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { zelleCobrosTienda, configuracion } = await import("@/lib/db/schema");

  const db = getDb();
  const { env } = getCloudflareContext();
  const receptor = env.ZELLE_CORREO_RECEPTOR?.trim() || null;

  const [fila] = await db
    .select({
      habilitado: zelleCobrosTienda.habilitado,
      minimoCentavos: zelleCobrosTienda.minimoCentavos,
    })
    .from(zelleCobrosTienda)
    .where(eq(zelleCobrosTienda.tiendaId, tiendaId))
    .limit(1);

  const [global] = await db
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, "zelle_cobros_minimo_centavos"))
    .limit(1);

  const minimoGlobal = global ? Number.parseInt(global.valor, 10) : null;

  /* EL TOPE, que el equipo edita desde Configuración. Va en `configuracion`
     —llave y valor— y no en una columna nueva: una columna no llega sola a
     producción. */
  const [topeFila] = await db
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, "zelle_cobros_maximo_centavos"))
    .limit(1);

  const maximoGlobal = topeFila ? Number.parseInt(topeFila.valor, 10) : null;

  const [politicaFila] = await db
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVE_POLITICA_ZELLE))
    .limit(1);
  const politica = politicaZelleDe(politicaFila?.valor);

  const decision = decidirZelle(
    {
      /**
       * SIN FILA, ZELLE ESTÁ DISPONIBLE. El equipo lo APAGA, no lo enciende.
       *
       * Antes era al revés: sin fila no había Zelle, y encenderlo era un acto
       * del equipo tienda por tienda. En la práctica eso significó que **ningún
       * comercio lo tenía** — un cobro de $620 salía solo con tarjeta, y Zelle
       * es la forma de pago de esta clientela.
       *
       * Lo que de verdad filtra lo que no compensa es el MÍNIMO, no el
       * interruptor: por debajo de él, validar la captura cuesta más de lo que
       * deja el margen. El interruptor se queda para poder quitárselo a un
       * comercio concreto que dé problemas.
       */
      /* ══ Y DESDE EL 2 SEP 2026, LA POLÍTICA GLOBAL MANDA ══ Decisión del
         dueño: Zelle CERRADO para todos (solo tarjeta) salvo la tienda que
         el equipo enciende a mano para una persona de confianza. Con la
         política en «abierto» vuelve la regla de arriba. */
      habilitada: zelleHabilitadaPara(
        politica,
        fila ? Boolean(fila.habilitado) : null,
      ),
      minimoTiendaCentavos: fila?.minimoCentavos ?? null,
      minimoGlobalCentavos: Number.isFinite(minimoGlobal) ? minimoGlobal : null,
      receptorConfigurado: Boolean(receptor),
      maximoGlobalCentavos: Number.isFinite(maximoGlobal) ? maximoGlobal : null,
    },
    montoCentavos,
  );

  if (!decision.disponible || !receptor) {
    return {
      disponible: false,
      topeSuperado: !decision.disponible && decision.motivo === "monto_alto",
      maximoCentavos: decision.maximoCentavos,
    };
  }
  return {
    disponible: true,
    receptor,
    minimoCentavos: decision.minimoCentavos,
  };
}

/**
 * ¿Este cobro ya tiene una captura esperando al validador?
 *
 * Con una pendiente no se acumula otra — la misma regla de los pedidos — y la
 * página deja de ofrecer los métodos de pago: lo que toca es esperar.
 */
export async function comprobantePendienteDeCobro(
  cobroId: string,
): Promise<boolean> {
  const { cobrosZelle, pagosZelle } = await import("@/lib/db/schema");
  const db = getDb();

  const [fila] = await db
    .select({ id: pagosZelle.id })
    .from(cobrosZelle)
    .innerJoin(pagosZelle, eq(pagosZelle.id, cobrosZelle.pagoZelleId))
    .where(
      and(eq(cobrosZelle.cobroId, cobroId), eq(pagosZelle.estado, "pendiente")),
    )
    .limit(1);

  return Boolean(fila);
}
