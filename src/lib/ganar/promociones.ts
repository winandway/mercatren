import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, asc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { firmar } from "@/lib/cobros/firma";
import { getDb } from "@/lib/db";
import {
  clicsPromocion,
  gastoPromociones,
  productos,
  promociones,
  tiendas,
} from "@/lib/db/schema";
import {
  cargoDelClic,
  CPC_CENTAVOS,
  diaDelGasto,
  esRobot,
  presupuestoValido,
} from "@/lib/ganar/reglas";
import {
  tarjetasDeProductos,
  type ProductoLista,
} from "@/lib/catalogo/consultas";
import type { Mercado } from "@/lib/mercado/mercados";
import { tiendaVisibleEn } from "@/lib/mercado/repositorio";

/**
 * LOS PRODUCTOS PROMOCIONADOS, EN LA BASE (5 nov 2026).
 *
 * Pago por clic con tope diario (reglas en `reglas.ts`). Lo que cuesta:
 * mostrar un promocionado NO escribe nada (la lista sale cacheada en el
 * borde); solo un clic que cuenta escribe, y como mucho dos filas (la huella
 * del día y la suma del día). Con el presupuesto agotado, ni eso: se lee y
 * se sale. Así un robot o un curioso no gastan base ni dinero del vendedor.
 *
 * NADA SE COBRA TODAVÍA: el gasto queda anotado «por cobrar».
 */

/* ── La firma del clic ─────────────────────────────────────────────────── */

async function secretoDeClics(): Promise<string> {
  const { env } = await getCloudflareContext({ async: true });
  const { secretoDeSesiones } = await import("@/lib/auth");
  const base = await secretoDeSesiones(
    env as unknown as Parameters<typeof secretoDeSesiones>[0],
  );
  return `${base}:promociones`;
}

/**
 * La firma de una promoción para un día. Va con cada promocionado que se
 * muestra, y el clic solo cuenta si la trae: así nadie inventa clics para
 * gastarle el presupuesto a otro. Vale para el día en que se mostró.
 */
export async function firmaDeClic(
  promocionId: string,
  dia: string,
): Promise<string> {
  return (await firmar(`${promocionId}.${dia}`, await secretoDeClics())).slice(
    0,
    32,
  );
}

/** Un resumen de quién hizo clic: ni la IP ni el navegador se guardan. */
async function huellaDe(partes: string[]): Promise<string> {
  const datos = new TextEncoder().encode(partes.join("|"));
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(resumen)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── El vendedor ───────────────────────────────────────────────────────── */

export type ResultadoPromocion =
  | { ok: true; id: string }
  | {
      ok: false;
      motivo: "presupuesto" | "producto" | "no_publicado";
    };

/**
 * Crea o actualiza la promoción de un producto de la tienda (uno, una).
 * Solo productos publicados de esa tienda.
 */
export async function guardarPromocion(o: {
  tiendaId: string;
  productoId: string;
  presupuestoCentavos: number;
  ahora?: number;
}): Promise<ResultadoPromocion> {
  if (!presupuestoValido(o.presupuestoCentavos))
    return { ok: false, motivo: "presupuesto" };
  const db = getDb();
  const [producto] = await db
    .select({ estado: productos.estado })
    .from(productos)
    .where(
      and(eq(productos.id, o.productoId), eq(productos.tiendaId, o.tiendaId)),
    )
    .limit(1);
  if (!producto) return { ok: false, motivo: "producto" };
  if (producto.estado !== "publicado")
    return { ok: false, motivo: "no_publicado" };

  const ahora = new Date(o.ahora ?? Date.now());
  const id = nanoid();
  const [fila] = await db
    .insert(promociones)
    .values({
      id,
      tiendaId: o.tiendaId,
      productoId: o.productoId,
      presupuestoDiarioCentavos: o.presupuestoCentavos,
      cpcCentavos: CPC_CENTAVOS,
      estado: "activa",
      creadaEn: ahora,
      actualizadaEn: ahora,
    })
    .onConflictDoUpdate({
      target: promociones.productoId,
      set: {
        presupuestoDiarioCentavos: o.presupuestoCentavos,
        estado: "activa",
        actualizadaEn: ahora,
      },
      /* El producto de otra tienda no se toca aunque coincida el id. */
      setWhere: eq(promociones.tiendaId, o.tiendaId),
    })
    .returning({ id: promociones.id });
  return fila ? { ok: true, id: fila.id } : { ok: false, motivo: "producto" };
}

export async function cambiarEstadoPromocion(o: {
  tiendaId: string;
  promocionId: string;
  estado: "activa" | "pausada";
}): Promise<boolean> {
  const hecho = await getDb()
    .update(promociones)
    .set({ estado: o.estado, actualizadaEn: new Date() })
    .where(
      and(
        eq(promociones.id, o.promocionId),
        eq(promociones.tiendaId, o.tiendaId),
      ),
    )
    .returning({ id: promociones.id });
  return hecho.length > 0;
}

export type PromocionDeTienda = {
  id: string;
  productoId: string;
  titulo: string;
  estado: "activa" | "pausada";
  presupuestoCentavos: number;
  hoy: { clics: number; gastoCentavos: number };
  ultimos30: { clics: number; gastoCentavos: number };
};

/** Las promociones de la tienda, con lo de hoy y los últimos 30 días. */
export async function promocionesDeTienda(
  tiendaId: string,
  ahora = Date.now(),
): Promise<PromocionDeTienda[]> {
  const db = getDb();
  const hoy = diaDelGasto(ahora);
  const desde = diaDelGasto(ahora - 29 * 24 * 60 * 60 * 1000);
  const [lista, gastos] = await Promise.all([
    db
      .select({
        id: promociones.id,
        productoId: promociones.productoId,
        estado: promociones.estado,
        presupuesto: promociones.presupuestoDiarioCentavos,
        tituloEs: productos.tituloEs,
      })
      .from(promociones)
      .innerJoin(productos, eq(productos.id, promociones.productoId))
      .where(eq(promociones.tiendaId, tiendaId))
      .orderBy(asc(promociones.creadaEn))
      .limit(200),
    db
      .select({
        promocionId: gastoPromociones.promocionId,
        dia: gastoPromociones.dia,
        clics: gastoPromociones.clics,
        gasto: gastoPromociones.gastoCentavos,
      })
      .from(gastoPromociones)
      .where(
        and(
          eq(gastoPromociones.tiendaId, tiendaId),
          gte(gastoPromociones.dia, desde),
        ),
      ),
  ]);
  return lista.map((p) => {
    const suyos = gastos.filter((g) => g.promocionId === p.id);
    const deHoy = suyos.find((g) => g.dia === hoy);
    return {
      id: p.id,
      productoId: p.productoId,
      titulo: p.tituloEs,
      estado: p.estado,
      presupuestoCentavos: p.presupuesto,
      hoy: {
        clics: deHoy?.clics ?? 0,
        gastoCentavos: deHoy?.gasto ?? 0,
      },
      ultimos30: {
        clics: suyos.reduce((t, g) => t + g.clics, 0),
        gastoCentavos: suyos.reduce((t, g) => t + g.gasto, 0),
      },
    };
  });
}

/* ── El comprador ──────────────────────────────────────────────────────── */

export type Promocionado = ProductoLista & {
  promocionId: string;
  firma: string;
};

/**
 * Los promocionados que pueden salir hoy en este país: activos, con
 * presupuesto que quede hoy y su producto visible aquí (el muro del país lo
 * pone `tarjetasDeProductos`). Los que menos gastaron hoy, primero: así se
 * reparte la vitrina.
 */
export async function promocionadosParaMostrar(
  mercado: Mercado,
  limite = 6,
  ahora = Date.now(),
): Promise<Promocionado[]> {
  const hoy = diaDelGasto(ahora);
  const candidatos = await getDb()
    .select({
      id: promociones.id,
      productoId: promociones.productoId,
    })
    .from(promociones)
    .innerJoin(tiendas, eq(tiendas.id, promociones.tiendaId))
    .leftJoin(
      gastoPromociones,
      and(
        eq(gastoPromociones.promocionId, promociones.id),
        eq(gastoPromociones.dia, hoy),
      ),
    )
    .where(
      and(
        eq(promociones.estado, "activa"),
        tiendaVisibleEn(mercado),
        or(
          isNull(gastoPromociones.gastoCentavos),
          lt(
            gastoPromociones.gastoCentavos,
            promociones.presupuestoDiarioCentavos,
          ),
        ),
      ),
    )
    .orderBy(sql`COALESCE(${gastoPromociones.gastoCentavos}, 0)`)
    .limit(24);
  if (candidatos.length === 0) return [];

  const tarjetas = await tarjetasDeProductos(
    mercado,
    candidatos.map((c) => c.productoId),
  );
  const promoDe = new Map(candidatos.map((c) => [c.productoId, c.id]));
  const salida: Promocionado[] = [];
  for (const t of tarjetas.slice(0, limite)) {
    const promocionId = promoDe.get(t.id);
    if (!promocionId) continue;
    salida.push({
      ...t,
      promocionId,
      firma: await firmaDeClic(promocionId, hoy),
    });
  }
  return salida;
}

export type ResultadoClic =
  "cobrado" | "gratis" | "repetido" | "robot" | "firma" | "no_existe";

/**
 * UN CLIC EN UN PROMOCIONADO. Cuenta solo si: no es un robot, trae la firma
 * del día y es el primero de esa persona hoy. Se cobra con el tope del día
 * (`cargoDelClic`); con el presupuesto agotado no escribe nada.
 */
export async function registrarClic(o: {
  promocionId: string;
  firma: string;
  ip: string | null;
  agente: string | null;
  ahora?: number;
}): Promise<ResultadoClic> {
  if (esRobot(o.agente)) return "robot";
  const ahora = o.ahora ?? Date.now();
  const hoy = diaDelGasto(ahora);
  if (o.firma !== (await firmaDeClic(o.promocionId, hoy))) return "firma";

  const db = getDb();
  const [promo] = await db
    .select({
      tiendaId: promociones.tiendaId,
      presupuesto: promociones.presupuestoDiarioCentavos,
      cpc: promociones.cpcCentavos,
      estado: promociones.estado,
      gastado: gastoPromociones.gastoCentavos,
    })
    .from(promociones)
    .leftJoin(
      gastoPromociones,
      and(
        eq(gastoPromociones.promocionId, promociones.id),
        eq(gastoPromociones.dia, hoy),
      ),
    )
    .where(eq(promociones.id, o.promocionId))
    .limit(1);
  if (!promo || promo.estado !== "activa") return "no_existe";

  const gastado = promo.gastado ?? 0;
  const cargo = cargoDelClic({
    gastadoHoyCentavos: gastado,
    presupuestoCentavos: promo.presupuesto,
    cpcCentavos: promo.cpc,
  });
  /* Presupuesto agotado: el clic no cuesta y no se escribe nada. */
  if (cargo === 0) return "gratis";

  const huella = await huellaDe([o.ip ?? "", o.agente ?? "", hoy]);
  const nueva = await db
    .insert(clicsPromocion)
    .values({ promocionId: o.promocionId, dia: hoy, huella })
    .onConflictDoNothing()
    .returning({ huella: clicsPromocion.huella });
  if (nueva.length === 0) return "repetido";

  /* La suma del día, con el tope dentro de la propia sentencia: aunque dos
     clics lleguen a la vez, el gasto nunca pasa del presupuesto. */
  await db
    .insert(gastoPromociones)
    .values({
      promocionId: o.promocionId,
      tiendaId: promo.tiendaId,
      dia: hoy,
      clics: 1,
      gastoCentavos: cargo,
    })
    .onConflictDoUpdate({
      target: [gastoPromociones.promocionId, gastoPromociones.dia],
      set: {
        clics: sql`${gastoPromociones.clics} + 1`,
        gastoCentavos: sql`MIN(${promo.presupuesto}, ${gastoPromociones.gastoCentavos} + ${promo.cpc})`,
      },
    });

  /* El primer clic del día de esta promoción limpia las huellas de días
     anteriores (son de un día: no hace falta guardarlas más). */
  if (gastado === 0) {
    await db
      .delete(clicsPromocion)
      .where(
        and(
          eq(clicsPromocion.promocionId, o.promocionId),
          lt(clicsPromocion.dia, hoy),
        ),
      );
  }
  return "cobrado";
}

/** Para las pruebas y el panel: los ids de promociones de unos productos. */
export async function promocionesDeProductos(ids: string[]) {
  if (ids.length === 0) return [];
  return getDb()
    .select({ id: promociones.id, productoId: promociones.productoId })
    .from(promociones)
    .where(inArray(promociones.productoId, ids.slice(0, 50)));
}
