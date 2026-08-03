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

import { exigirPermisoDePanel } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pagosZelle } from "@/lib/db/schema";

/**
 * Consultas del modulo de pagos Zelle.
 *
 * REGLA DE ORO: todo total del negocio cuenta SOLO las entradas
 * (`tipo = 'entrada'`). Los retiros existen como registro y se pueden listar,
 * pero jamas se suman. Cada consulta que devuelve dinero aplica ese filtro.
 */

const SOLO_ENTRADAS = eq(pagosZelle.tipo, "entrada");

export type Periodo = "dia" | "semana" | "mes";

export type FiltrosPagos = {
  busqueda?: string;
  estado?: "aprobado" | "pendiente" | "rechazado";
  tipo?: "entrada" | "retiro";
  cuentaReceptora?: string;
  banco?: string;
  pagina?: number;
  porPagina?: number;
};

/** Tarjetas de arriba: el estado del negocio de un vistazo. */
export async function obtenerResumen() {
  await exigirPermisoDePanel();

  const db = getDb();

  const [entradas] = await db
    .select({
      aprobados: sql<number>`SUM(CASE WHEN ${pagosZelle.estado} = 'aprobado' THEN 1 ELSE 0 END)`,
      montoAprobado: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'aprobado' THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      comisionAprobada: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'aprobado' THEN ${pagosZelle.comisionCentavos} ELSE 0 END), 0)`,
      netoAprobado: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'aprobado' THEN ${pagosZelle.netoCentavos} ELSE 0 END), 0)`,
      pendientes: sql<number>`SUM(CASE WHEN ${pagosZelle.estado} = 'pendiente' THEN 1 ELSE 0 END)`,
      montoPendiente: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'pendiente' THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      rechazados: sql<number>`SUM(CASE WHEN ${pagosZelle.estado} = 'rechazado' THEN 1 ELSE 0 END)`,
      sellers: sql<number>`COUNT(DISTINCT ${pagosZelle.sellerCuenta})`,
      bancos: sql<number>`COUNT(DISTINCT ${pagosZelle.bancoOrigen})`,
      cuentasReceptoras: sql<number>`COUNT(DISTINCT ${pagosZelle.cuentaReceptora})`,
      primerPago: sql<number | null>`MIN(${pagosZelle.subidoEn})`,
      ultimoPago: sql<number | null>`MAX(${pagosZelle.subidoEn})`,
    })
    .from(pagosZelle)
    .where(SOLO_ENTRADAS);

  // Los retiros se muestran aparte y siempre marcados como "no contabilizado".
  const [retiros] = await db
    .select({
      cantidad: count(),
      monto: sql<number>`COALESCE(SUM(${pagosZelle.montoCentavos}), 0)`,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.tipo, "retiro"));

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
export async function obtenerCierre(periodo: Periodo): Promise<FilaCierre[]> {
  await exigirPermisoDePanel();

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
    .where(and(SOLO_ENTRADAS, eq(pagosZelle.estado, "aprobado")))
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
export async function obtenerOpcionesFiltros() {
  await exigirPermisoDePanel();

  const db = getDb();

  const cuentas = await db
    .select({
      valor: pagosZelle.cuentaReceptora,
      cantidad: count(),
    })
    .from(pagosZelle)
    .where(SOLO_ENTRADAS)
    .groupBy(pagosZelle.cuentaReceptora)
    .orderBy(desc(count()));

  const bancos = await db
    .select({
      valor: pagosZelle.bancoOrigen,
      cantidad: count(),
    })
    .from(pagosZelle)
    .where(SOLO_ENTRADAS)
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
  await exigirPermisoDePanel();

  const db = getDb();

  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(100, Math.max(6, filtros.porPagina ?? 24));

  const condiciones = [];

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

    // Si escribieron un numero, tambien se busca por monto exacto.
    const comoMonto = Number(busqueda.replace(/[$,\s]/g, ""));
    if (!Number.isNaN(comoMonto) && comoMonto > 0) {
      const centavos = Math.round(comoMonto * 100);
      porTexto.push(eq(pagosZelle.montoCentavos, centavos));
      // Y por monto aproximado, para cuando escriben solo la parte entera.
      porTexto.push(
        and(
          gte(pagosZelle.montoCentavos, centavos),
          lte(pagosZelle.montoCentavos, centavos + 99),
        )!,
      );
    }

    condiciones.push(or(...porTexto)!);
  }

  const donde = condiciones.length ? and(...condiciones) : undefined;

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

/** Un pago suelto, para el visor del comprobante. */
export async function obtenerPago(id: string) {
  await exigirPermisoDePanel();

  const db = getDb();
  const [pago] = await db
    .select()
    .from(pagosZelle)
    .where(eq(pagosZelle.id, id))
    .limit(1);
  return pago ?? null;
}

/** Los pagos que esperan revision del validador. */
export async function listarPendientesDeValidacion() {
  await exigirPermisoDePanel();

  const db = getDb();
  return db
    .select()
    .from(pagosZelle)
    .where(and(SOLO_ENTRADAS, eq(pagosZelle.estado, "pendiente")))
    .orderBy(asc(pagosZelle.subidoEn));
}
