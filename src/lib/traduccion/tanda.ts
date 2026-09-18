import "server-only";

import { and, asc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";
import { tomarDeCola } from "@/lib/reloj/cola-guardada";

import {
  traducirDescripciones,
  traducirTanda,
  traducirTandaAlIngles,
  traductorConfigurado,
} from "./modelo";
import { POR_TANDA } from "./reglas";

/**
 * EL TRADUCTOR DESDE EL RELOJ (2 sep 2026).
 *
 * Con cien mil productos entrando de golpe, el botón del panel no alcanza:
 * alguien tendría que dejarlo pulsado días. El reloj de `/datos/sincronizar`
 * traduce unas tandas por vuelta —títulos primero, después descripciones—
 * con el MISMO modelo y las MISMAS reglas del botón (`modelo.ts`): un modelo
 * de texto barato, nada inventado, y sin llave no pasa nada.
 *
 * Lo pendiente se decide en SQL, no cargando el catálogo entero: un título
 * está sin traducir cuando el español todavía es igual al inglés.
 */

const POR_TANDA_DESCRIPCION = 5;

/**
 * ══ LAS COLAS DEL TRADUCTOR SE CALCULAN UNA VEZ POR HORA (18 sep 2026) ══
 *
 * Buscar «los 20 siguientes sin traducir» recorría los 56.000 productos
 * con `trim()` y `lower()` (nada de índice posible) y los ordenaba por
 * fecha, y esto corría 150 veces a la hora para traducir veinte cada vez:
 * 8 millones de filas a la hora. Ahora la consulta cara trae una lista de
 * ids una vez por hora (`tomarDeCola`), cada latido toma los suyos y los
 * vuelve a mirar por id con la misma condición: lo que ya se tradujo por
 * otro camino no se traduce dos veces.
 */
const COLA_TOPE = 600;
const COLA_VIGENCIA_MS = 60 * 60_000;
export const LLAVE_COLA_TITULOS = "traduccion_cola_titulos";
export const LLAVE_COLA_DESCRIPCIONES = "traduccion_cola_descripciones";

function tituloPendiente() {
  return and(
    inArray(tiendas.paisOrigen, PLAZAS),
    isNotNull(productos.tituloEn),
    sql`trim(${productos.tituloEn}) != ''`,
    or(
      sql`trim(${productos.tituloEs}) = ''`,
      sql`lower(trim(${productos.tituloEs})) = lower(trim(${productos.tituloEn}))`,
    ),
  );
}

function descripcionPendiente() {
  return and(
    inArray(tiendas.paisOrigen, PLAZAS),
    isNotNull(productos.descripcionEn),
    sql`trim(${productos.descripcionEn}) != ''`,
    or(
      sql`${productos.descripcionEs} is null`,
      sql`trim(${productos.descripcionEs}) = ''`,
    ),
  );
}

/** Los ids que tocan en este latido, ya en el orden de la cola. */
async function turnoDe(
  llave: string,
  cuantos: number,
  pendiente: () => ReturnType<typeof and>,
): Promise<string[]> {
  const db = getDb();
  const { ids } = await tomarDeCola({
    llave,
    vigenciaMs: COLA_VIGENCIA_MS,
    cuantos,
    calcular: async () =>
      (
        await db
          .select({ id: productos.id })
          .from(productos)
          .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
          .where(pendiente())
          .orderBy(asc(productos.actualizadoEn))
          .limit(COLA_TOPE)
      ).map((f) => f.id),
  });
  return ids;
}
const PLAZAS = ["US", "CL", "CO"];

export async function traducirDesdeElReloj(o: {
  tandasTitulos: number;
  tandasDescripciones: number;
  /** Títulos del español al inglés, para el catálogo venezolano. */
  tandasTitulosIngles?: number;
}): Promise<{
  titulos: number;
  titulosIngles: number;
  descripciones: number;
  motivo?: string;
}> {
  if (!traductorConfigurado()) {
    return {
      titulos: 0,
      titulosIngles: 0,
      descripciones: 0,
      motivo: "Falta TRADUCCION_LLAVE.",
    };
  }
  const db = getDb();
  let titulos = 0;
  let titulosIngles = 0;
  let descripciones = 0;

  for (let i = 0; i < o.tandasTitulos; i++) {
    const turno = await turnoDe(LLAVE_COLA_TITULOS, POR_TANDA, tituloPendiente);
    if (turno.length === 0) break;
    /* Se vuelven a mirar por id: veinte filas, y solo las que siguen sin
       traducir. */
    /* SOLO `id IN (…)` en el WHERE (18 sep 2026): la condición se repite en
       código, para que SQLite use la clave primaria y no otro índice. */
    const pendientes = (
      await db
        .select({
          id: productos.id,
          tituloEn: productos.tituloEn,
          tituloEs: productos.tituloEs,
          pais: tiendas.paisOrigen,
        })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .where(inArray(productos.id, turno))
    ).filter(
      (p) =>
        PLAZAS.includes(p.pais ?? "") &&
        (p.tituloEn ?? "").trim() !== "" &&
        ((p.tituloEs ?? "").trim() === "" ||
          (p.tituloEs ?? "").trim().toLowerCase() ===
            (p.tituloEn ?? "").trim().toLowerCase()),
    );
    if (pendientes.length === 0) continue;

    const r = await traducirTanda(
      pendientes.map((p) => ({
        id: p.id,
        tituloEn: (p.tituloEn ?? "").trim(),
      })),
    );
    if (!r.ok)
      return { titulos, titulosIngles, descripciones, motivo: r.motivo };

    const ahora = new Date();
    const hechas = new Set<string>();
    for (const t of r.traducciones) {
      await db
        .update(productos)
        .set({ tituloEs: t.tituloEs, actualizadoEn: ahora })
        .where(eq(productos.id, t.id))
        .catch(() => undefined);
      hechas.add(t.id);
      titulos += 1;
    }
    /* Lo que el modelo devolvió inservible va al final de la cola, o la
       misma tanda se repetiría en cada vuelta para siempre. */
    const sinServir = pendientes
      .filter((p) => !hechas.has(p.id))
      .map((p) => p.id);
    if (sinServir.length > 0) {
      await db
        .update(productos)
        .set({ actualizadoEn: ahora })
        .where(inArray(productos.id, sinServir))
        .catch(() => undefined);
    }
  }

  /* ══ AL INGLÉS: EL CATÁLOGO VENEZOLANO (14 sep 2026) ══ Los comercios
     escriben en español y `titulo_en` quedaba vacío; la ficha en inglés
     enseñaba el español. Solo lo publicado, lo más viejo primero. */
  for (let i = 0; i < (o.tandasTitulosIngles ?? 0); i++) {
    const pendientes = await db
      .select({ id: productos.id, tituloEs: productos.tituloEs })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .where(
        and(
          eq(tiendas.paisOrigen, "VE"),
          eq(productos.estado, "publicado"),
          sql`trim(${productos.tituloEs}) != ''`,
          or(isNull(productos.tituloEn), sql`trim(${productos.tituloEn}) = ''`),
        ),
      )
      .orderBy(asc(productos.actualizadoEn))
      .limit(POR_TANDA);
    if (pendientes.length === 0) break;
    const r = await traducirTandaAlIngles(
      pendientes.map((p) => ({
        id: p.id,
        tituloEs: (p.tituloEs ?? "").trim(),
      })),
    );
    if (!r.ok)
      return { titulos, titulosIngles, descripciones, motivo: r.motivo };
    const ahora = new Date();
    const hechas = new Set<string>();
    for (const x of r.traducciones) {
      if (!x.tituloEn.trim()) continue;
      await db
        .update(productos)
        .set({ tituloEn: x.tituloEn.trim(), actualizadoEn: ahora })
        .where(eq(productos.id, x.id))
        .catch(() => undefined);
      hechas.add(x.id);
      titulosIngles += 1;
    }
    const sinServir = pendientes
      .filter((p) => !hechas.has(p.id))
      .map((p) => p.id);
    if (sinServir.length > 0) {
      await db
        .update(productos)
        .set({ actualizadoEn: ahora })
        .where(inArray(productos.id, sinServir))
        .catch(() => undefined);
    }
  }
  for (let i = 0; i < o.tandasDescripciones; i++) {
    const turno = await turnoDe(
      LLAVE_COLA_DESCRIPCIONES,
      POR_TANDA_DESCRIPCION,
      descripcionPendiente,
    );
    if (turno.length === 0) break;
    const pendientes = (
      await db
        .select({
          id: productos.id,
          textoEn: productos.descripcionEn,
          textoEs: productos.descripcionEs,
          pais: tiendas.paisOrigen,
        })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .where(inArray(productos.id, turno))
    ).filter(
      (p) =>
        PLAZAS.includes(p.pais ?? "") &&
        (p.textoEn ?? "").trim() !== "" &&
        (p.textoEs ?? "").trim() === "",
    );
    if (pendientes.length === 0) continue;

    const r = await traducirDescripciones(
      pendientes.map((p) => ({ id: p.id, textoEn: (p.textoEn ?? "").trim() })),
    );
    if (!r.ok)
      return { titulos, titulosIngles, descripciones, motivo: r.motivo };

    const ahora = new Date();
    const hechas = new Set<string>();
    for (const t of r.traducciones) {
      if (!t.texto?.trim()) continue;
      await db
        .update(productos)
        .set({ descripcionEs: t.texto, actualizadoEn: ahora })
        .where(eq(productos.id, t.id))
        .catch(() => undefined);
      hechas.add(t.id);
      descripciones += 1;
    }
    const sinServir = pendientes
      .filter((p) => !hechas.has(p.id))
      .map((p) => p.id);
    if (sinServir.length > 0) {
      await db
        .update(productos)
        .set({ actualizadoEn: ahora })
        .where(inArray(productos.id, sinServir))
        .catch(() => undefined);
    }
  }

  return { titulos, titulosIngles, descripciones };
}
