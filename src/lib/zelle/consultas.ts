import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { comercioEfectivo, obtenerAlcance } from "@/lib/autorizacion";
import { mercadoDelPanel } from "@/lib/mercado/panel";
import { getDb } from "@/lib/db";
import {
  billeteras,
  movimientosBilletera,
  pagosZelle,
  tiendas,
} from "@/lib/db/schema";

/**
 * Consultas del modulo de pagos Zelle.
 *
 * DOS REGLAS QUE NO SE TOCAN:
 *
 * 1. Todo total del negocio cuenta SOLO las entradas (`tipo = 'entrada'`).
 *    Los retiros existen como registro, pero jamas se suman.
 *
 * 2. Cada consulta empieza pidiendo el alcance de quien pregunta. Un comercio
 *    solo ve lo suyo, y si intenta pedir otra tienda por la direccion se le
 *    ignora: el alcance manda sobre el filtro.
 */

const SOLO_ENTRADAS = eq(pagosZelle.tipo, "entrada");

export type Periodo = "dia" | "semana" | "mes";

export type FiltrosPagos = {
  busqueda?: string;
  estado?: "aprobado" | "pendiente" | "rechazado";
  tipo?: "entrada" | "retiro";
  cuentaReceptora?: string;
  banco?: string;
  comercio?: string;
  pagina?: number;
  porPagina?: number;
};

/**
 * El filtro de comercio que corresponde a quien pregunta.
 * Un vendedor queda encerrado en su tienda pase lo que pase.
 */
async function filtroDeComercio(comercioPedido?: string) {
  const alcance = await obtenerAlcance();
  const tiendaId = comercioEfectivo(alcance, comercioPedido);
  return tiendaId ? eq(pagosZelle.tiendaId, tiendaId) : undefined;
}

/** Tarjetas de arriba: el estado del negocio de un vistazo. */
export async function obtenerResumen(comercio?: string) {
  const db = getDb();
  const deComercio = await filtroDeComercio(comercio);

  const [entradas] = await db
    .select({
      aprobados: sql<number>`SUM(CASE WHEN ${pagosZelle.estado} = 'aprobado' THEN 1 ELSE 0 END)`,
      montoAprobado: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'aprobado' THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      comisionAprobada: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'aprobado' THEN ${pagosZelle.comisionCentavos} ELSE 0 END), 0)`,
      netoAprobado: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'aprobado' THEN ${pagosZelle.netoCentavos} ELSE 0 END), 0)`,
      pendientes: sql<number>`SUM(CASE WHEN ${pagosZelle.estado} = 'pendiente' THEN 1 ELSE 0 END)`,
      montoPendiente: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'pendiente' THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      rechazados: sql<number>`SUM(CASE WHEN ${pagosZelle.estado} = 'rechazado' THEN 1 ELSE 0 END)`,
      sellers: sql<number>`COUNT(DISTINCT ${pagosZelle.tiendaId})`,
      bancos: sql<number>`COUNT(DISTINCT ${pagosZelle.bancoOrigen})`,
      cuentasReceptoras: sql<number>`COUNT(DISTINCT ${pagosZelle.cuentaReceptora})`,
      primerPago: sql<number | null>`MIN(${pagosZelle.subidoEn})`,
      ultimoPago: sql<number | null>`MAX(${pagosZelle.subidoEn})`,
    })
    .from(pagosZelle)
    .where(and(SOLO_ENTRADAS, deComercio));

  // Los retiros se muestran aparte y siempre marcados como "no contabilizado".
  const [retiros] = await db
    .select({
      cantidad: count(),
      monto: sql<number>`COALESCE(SUM(${pagosZelle.montoCentavos}), 0)`,
    })
    .from(pagosZelle)
    .where(and(eq(pagosZelle.tipo, "retiro"), deComercio));

  return {
    entradas: {
      aprobados: Number(entradas?.aprobados ?? 0),
      montoAprobadoCentavos: Number(entradas?.montoAprobado ?? 0),
      comisionCentavos: Number(entradas?.comisionAprobada ?? 0),
      netoCentavos: Number(entradas?.netoAprobado ?? 0),
      pendientes: Number(entradas?.pendientes ?? 0),
      montoPendienteCentavos: Number(entradas?.montoPendiente ?? 0),
      rechazados: Number(entradas?.rechazados ?? 0),
    },
    sellers: Number(entradas?.sellers ?? 0),
    bancos: Number(entradas?.bancos ?? 0),
    cuentasReceptoras: Number(entradas?.cuentasReceptoras ?? 0),
    primerPago: entradas?.primerPago ? Number(entradas.primerPago) : null,
    ultimoPago: entradas?.ultimoPago ? Number(entradas.ultimoPago) : null,
    retiros: {
      cantidad: Number(retiros?.cantidad ?? 0),
      montoCentavos: Number(retiros?.monto ?? 0),
    },
  };
}

export type FilaCierre = {
  periodo: string;
  pagos: number;
  montoCentavos: number;
  comisionCentavos: number;
  netoCentavos: number;
};

/**
 * Cierre de ventas por dia, semana o mes, en orden cronologico.
 * Solo entradas aprobadas: es lo que de verdad entro.
 */
export async function obtenerCierre(
  periodo: Periodo,
  comercio?: string,
): Promise<FilaCierre[]> {
  const db = getDb();

  const formato =
    periodo === "dia" ? "%Y-%m-%d" : periodo === "semana" ? "%Y-S%W" : "%Y-%m";

  const clave = sql<string>`strftime(${formato}, ${pagosZelle.subidoEn}, 'unixepoch')`;

  const filas = await db
    .select({
      periodo: clave,
      pagos: count(),
      montoCentavos: sql<number>`COALESCE(SUM(${pagosZelle.montoCentavos}), 0)`,
      comisionCentavos: sql<number>`COALESCE(SUM(${pagosZelle.comisionCentavos}), 0)`,
      netoCentavos: sql<number>`COALESCE(SUM(${pagosZelle.netoCentavos}), 0)`,
    })
    .from(pagosZelle)
    .where(
      and(
        SOLO_ENTRADAS,
        eq(pagosZelle.estado, "aprobado"),
        await filtroDeComercio(comercio),
      ),
    )
    .groupBy(clave)
    .orderBy(asc(clave));

  return filas
    .filter((f) => f.periodo)
    .map((f) => ({
      periodo: String(f.periodo),
      pagos: Number(f.pagos),
      montoCentavos: Number(f.montoCentavos),
      comisionCentavos: Number(f.comisionCentavos),
      netoCentavos: Number(f.netoCentavos),
    }));
}

/** Valores disponibles para los filtros, sacados de los datos reales. */
export async function obtenerOpcionesFiltros(comercio?: string) {
  const db = getDb();
  const donde = and(SOLO_ENTRADAS, await filtroDeComercio(comercio));

  const cuentas = await db
    .select({ valor: pagosZelle.cuentaReceptora, cantidad: count() })
    .from(pagosZelle)
    .where(donde)
    .groupBy(pagosZelle.cuentaReceptora)
    .orderBy(desc(count()));

  const bancos = await db
    .select({ valor: pagosZelle.bancoOrigen, cantidad: count() })
    .from(pagosZelle)
    .where(donde)
    .groupBy(pagosZelle.bancoOrigen)
    .orderBy(desc(count()));

  return {
    cuentasReceptoras: cuentas
      .filter((c) => c.valor)
      .map((c) => ({ valor: String(c.valor), cantidad: Number(c.cantidad) })),
    bancos: bancos
      .filter((b) => b.valor)
      .map((b) => ({ valor: String(b.valor), cantidad: Number(b.cantidad) })),
  };
}

/**
 * Lista de pagos con buscador y filtros.
 * El buscador entiende monto, codigo de confirmacion, nombre y correo.
 */
export async function listarPagos(filtros: FiltrosPagos = {}) {
  const db = getDb();

  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(100, Math.max(6, filtros.porPagina ?? 24));

  const condiciones = [await filtroDeComercio(filtros.comercio)];

  if (filtros.tipo) condiciones.push(eq(pagosZelle.tipo, filtros.tipo));
  if (filtros.estado) condiciones.push(eq(pagosZelle.estado, filtros.estado));
  if (filtros.cuentaReceptora) {
    condiciones.push(eq(pagosZelle.cuentaReceptora, filtros.cuentaReceptora));
  }
  if (filtros.banco)
    condiciones.push(eq(pagosZelle.bancoOrigen, filtros.banco));

  const busqueda = filtros.busqueda?.trim();
  if (busqueda) {
    const patron = `%${busqueda.toLowerCase()}%`;
    const porTexto = [
      like(sql`LOWER(${pagosZelle.codigoConfirmacion})`, patron),
      like(sql`LOWER(${pagosZelle.pagadorNombreCrudo})`, patron),
      like(sql`LOWER(${pagosZelle.pagadorNombre})`, patron),
      like(sql`LOWER(${pagosZelle.pagadorCorreo})`, patron),
      like(sql`LOWER(${pagosZelle.receptorNombreCrudo})`, patron),
      like(sql`LOWER(${pagosZelle.cuentaReceptora})`, patron),
      like(sql`LOWER(${pagosZelle.bancoOrigen})`, patron),
      like(sql`LOWER(${pagosZelle.cuentaUltimos4})`, patron),
    ];

    // Si escribieron un numero, tambien se busca por monto.
    const comoMonto = Number(busqueda.replace(/[$,\s]/g, ""));
    if (!Number.isNaN(comoMonto) && comoMonto > 0) {
      const centavos = Math.round(comoMonto * 100);
      porTexto.push(
        and(
          gte(pagosZelle.montoCentavos, centavos),
          lte(pagosZelle.montoCentavos, centavos + 99),
        )!,
      );
    }

    condiciones.push(or(...porTexto)!);
  }

  const donde = and(...condiciones.filter(Boolean));

  const [total] = await db.select({ n: count() }).from(pagosZelle).where(donde);

  // Los totales del listado tambien respetan la regla: solo entradas suman.
  const [sumas] = await db
    .select({
      montoCentavos: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.tipo} = 'entrada' AND ${pagosZelle.estado} = 'aprobado' THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      contados: sql<number>`SUM(CASE WHEN ${pagosZelle.tipo} = 'entrada' AND ${pagosZelle.estado} = 'aprobado' THEN 1 ELSE 0 END)`,
    })
    .from(pagosZelle)
    .where(donde);

  const pagos = await db
    .select()
    .from(pagosZelle)
    .where(donde)
    .orderBy(desc(pagosZelle.subidoEn))
    .limit(porPagina)
    .offset((pagina - 1) * porPagina);

  return {
    pagos,
    total: Number(total?.n ?? 0),
    pagina,
    porPagina,
    paginas: Math.max(1, Math.ceil(Number(total?.n ?? 0) / porPagina)),
    sumaFiltrada: {
      montoCentavos: Number(sumas?.montoCentavos ?? 0),
      contados: Number(sumas?.contados ?? 0),
    },
  };
}

/** Un pago suelto. Devuelve nada si no es del alcance de quien pregunta. */
export async function obtenerPago(id: string) {
  const db = getDb();
  const [pago] = await db
    .select()
    .from(pagosZelle)
    .where(and(eq(pagosZelle.id, id), await filtroDeComercio()))
    .limit(1);
  return pago ?? null;
}

/** Los pagos que esperan revision del validador. */
export async function listarPendientesDeValidacion(comercio?: string) {
  const db = getDb();
  return db
    .select()
    .from(pagosZelle)
    .where(
      and(
        SOLO_ENTRADAS,
        eq(pagosZelle.estado, "pendiente"),
        await filtroDeComercio(comercio),
      ),
    )
    .orderBy(asc(pagosZelle.subidoEn));
}

/**
 * Los comercios que se pueden mirar. Un vendedor solo se ve a si mismo, asi
 * que el selector de comercio no le sirve para espiar a nadie.
 */
export async function listarComercios(busqueda?: string) {
  const db = getDb();
  const alcance = await obtenerAlcance();
  const mercadoMirado = await mercadoDelPanel();

  /* El filtro va EN LA BASE, no sobre lo ya traído: con una tienda por rubro
     de Estados Unidos más los comercios reales, esta lista solo crece. */
  const texto = (busqueda ?? "").trim().toLowerCase();
  const patron = `%${texto}%`;

  const aprobadosDeLaTienda = sql`${pagosZelle.tiendaId} = ${tiendas.id} AND ${pagosZelle.tipo} = 'entrada' AND ${pagosZelle.estado} = 'aprobado'`;

  const filas = await db
    .select({
      id: tiendas.id,
      nombre: tiendas.nombre,
      slug: tiendas.slug,
      estado: tiendas.estado,
      paisOrigen: tiendas.paisOrigen,
      comisionPuntosBase: tiendas.comisionPuntosBase,
      pagos: sql<number>`(SELECT COUNT(*) FROM ${pagosZelle} WHERE ${aprobadosDeLaTienda})`,
      ingresosCentavos: sql<number>`COALESCE((SELECT SUM(${pagosZelle.montoCentavos}) FROM ${pagosZelle} WHERE ${aprobadosDeLaTienda}), 0)`,
      saldoCentavos: sql<number>`COALESCE((SELECT ${billeteras.saldoCentavos} FROM ${billeteras} WHERE ${billeteras.tiendaId} = ${tiendas.id}), 0)`,
    })
    .from(tiendas)
    .where(
      and(
        /* El alcance manda SIEMPRE, buscando o sin buscar: un vendedor que
           escriba el nombre de otro comercio sigue viendo solo el suyo. */
        alcance.tipo === "tienda"
          ? eq(tiendas.id, alcance.tiendaId)
          : undefined,
        /**
         * EL PAÍS QUE EL EQUIPO ESTÁ MIRANDO (fase 4 del plan multi-país).
         *
         * Solo se le aplica al equipo. Un comercio ve el suyo y punto, y su
         * alcance ya lo dejó en una sola fila — filtrarlo además por país lo
         * haría desaparecer de su propia lista el día que se le cambie de
         * vitrina, y no entendería por qué.
         */
        alcance.tipo === "todos"
          ? eq(tiendas.mercado, mercadoMirado.codigo)
          : undefined,
        texto
          ? or(
              sql`LOWER(${tiendas.nombre}) LIKE ${patron}`,
              sql`LOWER(${tiendas.slug}) LIKE ${patron}`,
              sql`LOWER(COALESCE(${tiendas.razonSocial}, '')) LIKE ${patron}`,
              sql`LOWER(COALESCE(${tiendas.ciudad}, '')) LIKE ${patron}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(tiendas.creadoEn));

  return filas.map((f) => ({
    ...f,
    pagos: Number(f.pagos),
    ingresosCentavos: Number(f.ingresosCentavos),
    saldoCentavos: Number(f.saldoCentavos),
  }));
}

/** La billetera de un comercio. */
export async function obtenerBilletera(comercio?: string) {
  const db = getDb();
  const alcance = await obtenerAlcance();

  const tiendaId =
    alcance.tipo === "tienda" ? alcance.tiendaId : (comercio ?? null);
  if (!tiendaId) return null;

  const [fila] = await db
    .select({
      id: billeteras.id,
      tiendaId: billeteras.tiendaId,
      nombreTienda: tiendas.nombre,
      saldoCentavos: billeteras.saldoCentavos,
      moneda: billeteras.moneda,
      proveedor: billeteras.proveedor,
      proveedorBilleteraId: billeteras.proveedorBilleteraId,
      estado: billeteras.estado,
      sincronizadoEn: billeteras.sincronizadoEn,
    })
    .from(billeteras)
    .innerJoin(tiendas, eq(tiendas.id, billeteras.tiendaId))
    .where(eq(billeteras.tiendaId, tiendaId))
    .limit(1);

  return fila ?? null;
}

/** Movimientos de la billetera de un comercio, del mas nuevo al mas viejo. */
export async function listarMovimientos(comercio?: string, limite = 50) {
  const db = getDb();
  const billetera = await obtenerBilletera(comercio);
  if (!billetera) return [];

  return db
    .select()
    .from(movimientosBilletera)
    .where(eq(movimientosBilletera.billeteraId, billetera.id))
    .orderBy(desc(movimientosBilletera.creadoEn))
    .limit(limite);
}
