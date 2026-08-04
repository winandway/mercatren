import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { retiros, tiendas, type ESTADOS_RETIRO } from "@/lib/db/schema";

/**
 * Los retiros que se pueden ver desde esta sesión.
 *
 * REGLA DE ALCANCE, como en todo lo que toca dinero: un comercio ve los suyos
 * y nada más. La tienda no se recibe por la dirección; se resuelve desde la
 * sesión. El equipo de Mercatren ve los de todos, porque es quien los paga.
 */

export type Destino = {
  titular?: string;
  banco?: string;
  cuenta?: string;
  ruta?: string;
  comercio?: string;
};

export type RetiroEnLista = {
  id: string;
  tiendaId: string;
  nombreTienda: string;
  montoCentavos: number;
  moneda: string;
  estado: (typeof ESTADOS_RETIRO)[number];
  forma: "comercio" | "ach" | "wire";
  destino: Destino | null;
  destinoTienda: string | null;
  notaComercio: string | null;
  motivoRechazo: string | null;
  referencia: string | null;
  creadoEn: number;
  resueltoEn: number | null;
};

/**
 * La fecha, en milisegundos.
 *
 * Drizzle devuelve un Date cuando la columna es `mode: "timestamp"`, pero por
 * la base pueden llegar segundos sueltos. Multiplicar un Date por mil da el
 * año 58560 — pasó, y en pantalla se lee como si el sistema estuviera roto.
 */
function enMilisegundos(valor: Date | number | null): number | null {
  if (valor == null) return null;
  return valor instanceof Date ? valor.getTime() : Number(valor) * 1000;
}

/** Los últimos cuatro dígitos, que es lo único que hace falta enseñar. */
export function ultimosCuatro(cuenta: string | undefined) {
  if (!cuenta) return null;
  const solo = cuenta.replace(/\D/g, "");
  return solo.length >= 4 ? solo.slice(-4) : null;
}

export async function listarRetiros(opciones?: {
  estados?: (typeof ESTADOS_RETIRO)[number][];
  limite?: number;
}): Promise<RetiroEnLista[]> {
  const alcance = await obtenerAlcance();
  const db = getDb();

  const condiciones = [];
  if (alcance.tipo === "tienda") {
    condiciones.push(eq(retiros.tiendaId, alcance.tiendaId));
  }
  if (opciones?.estados?.length) {
    condiciones.push(inArray(retiros.estado, opciones.estados));
  }

  // Se lee el nombre de la tienda destino aparte: son pocas filas y una
  // segunda unión sobre la misma tabla se lee peor de lo que ahorra.
  const filas = await db
    .select({
      id: retiros.id,
      tiendaId: retiros.tiendaId,
      nombreTienda: tiendas.nombre,
      montoCentavos: retiros.montoCentavos,
      moneda: retiros.moneda,
      estado: retiros.estado,
      forma: retiros.forma,
      destino: retiros.destino,
      destinoTiendaId: retiros.destinoTiendaId,
      notaComercio: retiros.notaComercio,
      motivoRechazo: retiros.motivoRechazo,
      referencia: retiros.referencia,
      creadoEn: retiros.creadoEn,
      resueltoEn: retiros.resueltoEn,
    })
    .from(retiros)
    .innerJoin(tiendas, eq(tiendas.id, retiros.tiendaId))
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(retiros.creadoEn))
    .limit(opciones?.limite ?? 100);

  const destinos = filas
    .map((f) => f.destinoTiendaId)
    .filter((id): id is string => Boolean(id));

  const nombres = new Map<string, string>();
  if (destinos.length) {
    const otras = await db
      .select({ id: tiendas.id, nombre: tiendas.nombre })
      .from(tiendas)
      .where(inArray(tiendas.id, destinos));
    for (const t of otras) nombres.set(t.id, t.nombre);
  }

  return filas.map((f) => ({
    id: f.id,
    tiendaId: f.tiendaId,
    nombreTienda: f.nombreTienda,
    montoCentavos: Number(f.montoCentavos),
    moneda: f.moneda,
    estado: f.estado,
    forma: f.forma,
    destino: (f.destino as Destino | null) ?? null,
    destinoTienda: f.destinoTiendaId
      ? (nombres.get(f.destinoTiendaId) ?? null)
      : null,
    notaComercio: f.notaComercio,
    motivoRechazo: f.motivoRechazo,
    referencia: f.referencia,
    creadoEn: enMilisegundos(f.creadoEn) ?? 0,
    resueltoEn: enMilisegundos(f.resueltoEn),
  }));
}

/** Cuántos hay esperando a que alguien los pague. Para el aviso del menú. */
export async function contarRetirosPendientes(): Promise<number> {
  const alcance = await obtenerAlcance();
  if (alcance.tipo !== "todos") return 0;

  const db = getDb();
  const filas = await db
    .select({ id: retiros.id })
    .from(retiros)
    .where(eq(retiros.estado, "solicitado"));

  return filas.length;
}

/**
 * Los comercios a los que se le puede mandar dinero.
 *
 * Solo los activos, y nunca el propio: mandarse dinero a uno mismo no es un
 * retiro, es una vuelta en círculo que dejaría el saldo igual y un movimiento
 * de más en el historial.
 */
export async function comerciosDestino(
  excepto: string,
): Promise<{ id: string; nombre: string }[]> {
  const db = getDb();
  const filas = await db
    .select({ id: tiendas.id, nombre: tiendas.nombre })
    .from(tiendas)
    .where(eq(tiendas.estado, "activa"));

  return filas.filter((t) => t.id !== excepto);
}
