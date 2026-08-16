import "server-only";

import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  pagosZelle,
  retiros,
  tiendas,
  type ESTADOS_RETIRO,
  type FORMAS_RETIRO,
} from "@/lib/db/schema";

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
  /** Cuando la forma es `zelle`: el correo o el teléfono que recibe. */
  zelle?: string;
};

export type RetiroEnLista = {
  id: string;
  tiendaId: string;
  nombreTienda: string;
  montoCentavos: number;
  moneda: string;
  estado: (typeof ESTADOS_RETIRO)[number];
  /** Null en los retiros del sistema anterior: de esos no se guardó la vía. */
  forma: (typeof FORMAS_RETIRO)[number] | null;
  destino: Destino | null;
  destinoTienda: string | null;
  /** Respaldo: lo que el comercio puso en su ficha de empresa. */
  direccionFicha: string | null;
  ciudadFicha: string | null;
  notaComercio: string | null;
  motivoRechazo: string | null;
  referencia: string | null;
  /** La captura del banco, si el equipo la subió al marcarlo pagado. */
  comprobanteClave: string | null;
  creadoEn: number;
  resueltoEn: number | null;
  /**
   * VIENE DEL SISTEMA ANTERIOR.
   *
   * Se enseña, pero no se toca: no tiene botones ni se puede cancelar. Es un
   * hecho ya ocurrido y pagado, traído para que la lista de retiros del
   * comercio esté completa.
   */
  historico: boolean;
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

/**
 * LOS RETIROS DEL SISTEMA ANTERIOR TAMBIÉN SON RETIROS.
 *
 * ══ LA CONTRADICCIÓN QUE HABÍA ══
 *
 * Los 70 retiros del histórico viven en `pagos_zelle` con `tipo = 'retiro'`,
 * y esta pantalla solo leía la tabla `retiros`. Resultado: la billetera del
 * comercio le RESTABA $302.859,50 en retiros y la pantalla de Retiros le decía
 * «todavía no has pedido ningún retiro».
 *
 * Dos pantallas diciendo cosas distintas del mismo dinero es exactamente como
 * un comercio deja de creerle al sistema. Aquí se juntan las dos fuentes.
 *
 * Vienen marcados y sin acciones: son hechos ya pagados, no una cola.
 */
async function retirosDelHistorico(
  tiendaId: string,
  limite: number,
): Promise<RetiroEnLista[]> {
  const db = getDb();

  const filas = await db
    .select({
      id: pagosZelle.id,
      monto: pagosZelle.montoCentavos,
      moneda: pagosZelle.moneda,
      fecha: pagosZelle.fechaTransaccion,
      nota: pagosZelle.notas,
      codigo: pagosZelle.codigoConfirmacion,
      nombreTienda: tiendas.nombre,
    })
    .from(pagosZelle)
    .innerJoin(tiendas, eq(tiendas.id, pagosZelle.tiendaId))
    .where(
      and(
        eq(pagosZelle.tiendaId, tiendaId),
        eq(pagosZelle.tipo, "retiro"),
        eq(pagosZelle.estado, "aprobado"),
      ),
    )
    .orderBy(desc(pagosZelle.fechaTransaccion))
    .limit(limite)
    .catch(() => []);

  return filas.map((f) => ({
    id: f.id,
    tiendaId,
    nombreTienda: f.nombreTienda,
    montoCentavos: Number(f.monto),
    moneda: f.moneda,
    /* Ya se pagaron: por eso el saldo los descuenta. */
    estado: "pagado" as const,
    /* El histórico del sistema anterior llegó sin comprobantes. */
    comprobanteClave: null,
    /* No se guardó por qué vía salió, y no se inventa una. */
    forma: null,
    destino: null,
    destinoTienda: null,
    direccionFicha: null,
    ciudadFicha: null,
    notaComercio: f.nota,
    motivoRechazo: null,
    referencia: f.codigo,
    /**
     * SIN FECHA SE QUEDA EN 0 Y LA PANTALLA NO DIBUJA NINGUNA.
     *
     * El archivo del sistema anterior trajo los 70 retiros SIN fecha de
     * transacción. Se probó poner la fecha de importación como respaldo y es
     * peor: los 70 salían con el mismo día, diciéndole al comercio que sacó
     * todo su dinero en una sola tarde. Un dato que falta se dice; no se
     * rellena con el que había a mano.
     */
    creadoEn: enMilisegundos(f.fecha) ?? 0,
    resueltoEn: enMilisegundos(f.fecha),
    historico: true,
  }));
}

export async function listarRetiros(opciones?: {
  estados?: (typeof ESTADOS_RETIRO)[number][];
  limite?: number;
  busqueda?: string;
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

  /* Se busca por el comercio y por la referencia bancaria: son las dos cosas
     con las que se llega aquí — «el retiro de Bley» o «el que tiene esta
     referencia en el extracto». El alcance ya está en `condiciones`, así que
     un vendedor que busque otro comercio sigue viendo solo el suyo. */
  const texto = (opciones?.busqueda ?? "").trim().toLowerCase();
  if (texto) {
    const patron = `%${texto}%`;
    condiciones.push(
      or(
        sql`LOWER(${tiendas.nombre}) LIKE ${patron}`,
        sql`LOWER(COALESCE(${retiros.referencia}, '')) LIKE ${patron}`,
      )!,
    );
  }

  // Se lee el nombre de la tienda destino aparte: son pocas filas y una
  // segunda unión sobre la misma tabla se lee peor de lo que ahorra.
  const filas = await db
    .select({
      id: retiros.id,
      tiendaId: retiros.tiendaId,
      nombreTienda: tiendas.nombre,
      /* La dirección de la ficha de empresa del comercio. Es el RESPALDO para
         los retiros pedidos antes de que el formulario la preguntara: sin ella,
         quien va al banco no puede crear el destinatario internacional y el
         comercio se queda esperando sin saber por qué. */
      direccionFicha: tiendas.direccion,
      ciudadFicha: tiendas.ciudad,
      montoCentavos: retiros.montoCentavos,
      moneda: retiros.moneda,
      estado: retiros.estado,
      forma: retiros.forma,
      destino: retiros.destino,
      destinoTiendaId: retiros.destinoTiendaId,
      notaComercio: retiros.notaComercio,
      motivoRechazo: retiros.motivoRechazo,
      referencia: retiros.referencia,
      /**
       * LA CAPTURA DE LA TRANSFERENCIA, si el equipo la subió.
       *
       * Va en la misma consulta y no en una aparte: una ACH tarda uno o dos
       * días, y en ese hueco el comercio ve «pagado» y nada en su cuenta. La
       * captura contesta antes de que pregunte.
       */
      comprobanteClave: sql<
        string | null
      >`(SELECT c.clave FROM comprobantes_retiro c WHERE c.retiro_id = ${retiros.id} ORDER BY c.creado_en DESC LIMIT 1)`,
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

  const propios: RetiroEnLista[] = filas.map((f) => ({
    id: f.id,
    tiendaId: f.tiendaId,
    nombreTienda: f.nombreTienda,
    montoCentavos: Number(f.montoCentavos),
    moneda: f.moneda,
    estado: f.estado,
    forma: f.forma,
    destino: (f.destino as Destino | null) ?? null,
    direccionFicha: f.direccionFicha ?? null,
    ciudadFicha: f.ciudadFicha ?? null,
    destinoTienda: f.destinoTiendaId
      ? (nombres.get(f.destinoTiendaId) ?? null)
      : null,
    notaComercio: f.notaComercio,
    motivoRechazo: f.motivoRechazo,
    referencia: f.referencia,
    comprobanteClave: f.comprobanteClave,
    creadoEn: enMilisegundos(f.creadoEn) ?? 0,
    resueltoEn: enMilisegundos(f.resueltoEn),
    historico: false,
  }));

  /**
   * El histórico se suma SOLO cuando se está mirando un comercio concreto y no
   * se está filtrando por estado.
   *
   * Filtrando —la cola de «solicitado» que trabaja el equipo— no pinta nada:
   * son retiros ya pagados y llenarían de ruido una lista de pendientes.
   */
  if (alcance.tipo !== "tienda" || opciones?.estados?.length) return propios;

  const viejos = await retirosDelHistorico(
    alcance.tiendaId,
    opciones?.limite ?? 100,
  );
  if (viejos.length === 0) return propios;

  return [...propios, ...viejos].sort((a, b) => b.creadoEn - a.creadoEn);
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
