import "server-only";

import { and, eq, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { planesTienda, productos, tiendas } from "@/lib/db/schema";
import {
  nuevaPrueba,
  proHasta,
  puedeEmpezarPrueba,
  puedePublicarOtro,
  tienePro,
  topeDeProductos,
  type PlanGuardado,
} from "@/lib/ganar/reglas";

/**
 * EL PLAN PRO DE UNA TIENDA, EN LA BASE (5 nov 2026).
 *
 * Las reglas viven en `reglas.ts`; aquí solo se leen y se escriben. El cobro
 * está APAGADO: empezar es el mes gratis, sin tarjeta, y cuando termina la
 * tienda vuelve sola al plan sin costo (nada se cobra hasta el sí de Richard).
 */
const ms = (d: Date | null | undefined) =>
  d instanceof Date ? d.getTime() : null;

export async function planDeTienda(
  tiendaId: string,
): Promise<(PlanGuardado & { canceladoEn: number | null }) | null> {
  const [fila] = await getDb()
    .select({
      estado: planesTienda.estado,
      pruebaHasta: planesTienda.pruebaHasta,
      pagadoHasta: planesTienda.pagadoHasta,
      canceladoEn: planesTienda.canceladoEn,
    })
    .from(planesTienda)
    .where(eq(planesTienda.tiendaId, tiendaId))
    .limit(1);
  if (!fila) return null;
  return {
    estado: fila.estado,
    pruebaHasta: ms(fila.pruebaHasta),
    pagadoHasta: ms(fila.pagadoHasta),
    canceladoEn: ms(fila.canceladoEn),
  };
}

/** Los publicados de la tienda, contados en la base (nunca trayendo filas). */
export async function contarPublicados(tiendaId: string): Promise<number> {
  const [fila] = await getDb()
    .select({ n: sql<number>`COUNT(*)` })
    .from(productos)
    .where(
      and(eq(productos.tiendaId, tiendaId), eq(productos.estado, "publicado")),
    );
  return Number(fila?.n ?? 0);
}

export type EstadoDelPlanDeTienda = {
  pro: boolean;
  /** Hasta cuándo tiene Pro (ms), si lo tiene o lo tuvo. */
  hasta: number | null;
  estado: PlanGuardado["estado"] | null;
  enPrueba: boolean;
  puedeProbar: boolean;
  cancelado: boolean;
  publicados: number;
  tope: number;
};

export async function estadoDelPlan(
  tiendaId: string,
  ahora = Date.now(),
): Promise<EstadoDelPlanDeTienda> {
  const [plan, publicados] = await Promise.all([
    planDeTienda(tiendaId),
    contarPublicados(tiendaId),
  ]);
  const pro = tienePro(plan, ahora);
  return {
    pro,
    hasta: proHasta(plan),
    estado: plan?.estado ?? null,
    enPrueba: pro && plan?.estado === "prueba",
    puedeProbar: puedeEmpezarPrueba(plan),
    cancelado: plan?.estado === "cancelada",
    publicados,
    tope: topeDeProductos(pro),
  };
}

/** El mes gratis: uno por tienda, sin tarjeta. */
export async function empezarMesGratis(
  tiendaId: string,
  ahora = Date.now(),
): Promise<{ ok: true } | { ok: false; motivo: "ya_tuvo_prueba" }> {
  if (!puedeEmpezarPrueba(await planDeTienda(tiendaId))) {
    return { ok: false, motivo: "ya_tuvo_prueba" };
  }
  const prueba = nuevaPrueba(ahora);
  /* La llave única por tienda frena una segunda fila aunque dos toques
     lleguen a la vez. */
  await getDb()
    .insert(planesTienda)
    .values({
      id: nanoid(),
      tiendaId,
      estado: "prueba",
      pruebaHasta: new Date(prueba.pruebaHasta!),
      empezadoEn: new Date(ahora),
      actualizadoEn: new Date(ahora),
    })
    .onConflictDoNothing();
  return { ok: true };
}

/** Cancelar: sigue hasta el final de lo que corre; no se renueva. */
export async function cancelarPlan(tiendaId: string, ahora = Date.now()) {
  await getDb()
    .update(planesTienda)
    .set({
      estado: "cancelada",
      canceladoEn: new Date(ahora),
      actualizadoEn: new Date(ahora),
    })
    .where(
      and(
        eq(planesTienda.tiendaId, tiendaId),
        ne(planesTienda.estado, "cancelada"),
      ),
    );
}

/** Deshacer la cancelación mientras todavía corre el mes. */
export async function seguirConPro(tiendaId: string, ahora = Date.now()) {
  const plan = await planDeTienda(tiendaId);
  if (!plan || plan.estado !== "cancelada" || !tienePro(plan, ahora)) return;
  await getDb()
    .update(planesTienda)
    .set({
      estado: plan.pagadoHasta ? "activa" : "prueba",
      canceladoEn: null,
      actualizadoEn: new Date(ahora),
    })
    .where(eq(planesTienda.tiendaId, tiendaId));
}

/**
 * ¿Puede publicar este producto? Lo usan `guardarProducto` y
 * `cambiarEstadoProducto` (la web y la app). Lo que ya estaba publicado nunca
 * se frena; un producto más, solo si cabe en el tope de su plan.
 */
export async function revisarTopeAlPublicar(o: {
  tiendaId: string;
  yaEstabaPublicado: boolean;
  ahora?: number;
}): Promise<{ ok: true } | { ok: false; tope: number; pro: boolean }> {
  if (o.yaEstabaPublicado) return { ok: true };
  const [plan, publicados] = await Promise.all([
    planDeTienda(o.tiendaId),
    contarPublicados(o.tiendaId),
  ]);
  const pro = tienePro(plan, o.ahora ?? Date.now());
  return puedePublicarOtro({ publicados, pro, yaEstabaPublicado: false })
    ? { ok: true }
    : { ok: false, tope: topeDeProductos(pro), pro };
}

/**
 * Las tiendas con Pro ahora mismo (sus slugs), para destacarlas en el
 * directorio. La tabla tiene una fila por tienda que alguna vez probó Pro:
 * es corta, y la cuenta de quién sigue con Pro se hace aquí.
 */
export async function slugsConPro(ahora = Date.now()): Promise<Set<string>> {
  const filas = await getDb()
    .select({
      slug: tiendas.slug,
      estado: planesTienda.estado,
      pruebaHasta: planesTienda.pruebaHasta,
      pagadoHasta: planesTienda.pagadoHasta,
    })
    .from(planesTienda)
    .innerJoin(tiendas, eq(tiendas.id, planesTienda.tiendaId));
  return new Set(
    filas
      .filter((f) =>
        tienePro(
          {
            estado: f.estado,
            pruebaHasta: ms(f.pruebaHasta),
            pagadoHasta: ms(f.pagadoHasta),
          },
          ahora,
        ),
      )
      .map((f) => f.slug),
  );
}
