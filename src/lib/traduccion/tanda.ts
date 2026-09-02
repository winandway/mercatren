import "server-only";

import { and, asc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";

import {
  traducirDescripciones,
  traducirTanda,
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
const PLAZAS = ["US", "CL", "CO"];

export async function traducirDesdeElReloj(o: {
  tandasTitulos: number;
  tandasDescripciones: number;
}): Promise<{ titulos: number; descripciones: number; motivo?: string }> {
  if (!traductorConfigurado()) {
    return { titulos: 0, descripciones: 0, motivo: "Falta TRADUCCION_LLAVE." };
  }
  const db = getDb();
  let titulos = 0;
  let descripciones = 0;

  for (let i = 0; i < o.tandasTitulos; i++) {
    const pendientes = await db
      .select({ id: productos.id, tituloEn: productos.tituloEn })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .where(
        and(
          inArray(tiendas.paisOrigen, PLAZAS),
          isNotNull(productos.tituloEn),
          sql`trim(${productos.tituloEn}) != ''`,
          or(
            sql`trim(${productos.tituloEs}) = ''`,
            sql`lower(trim(${productos.tituloEs})) = lower(trim(${productos.tituloEn}))`,
          ),
        ),
      )
      .orderBy(asc(productos.actualizadoEn))
      .limit(POR_TANDA);
    if (pendientes.length === 0) break;

    const r = await traducirTanda(
      pendientes.map((p) => ({
        id: p.id,
        tituloEn: (p.tituloEn ?? "").trim(),
      })),
    );
    if (!r.ok) return { titulos, descripciones, motivo: r.motivo };

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

  for (let i = 0; i < o.tandasDescripciones; i++) {
    const pendientes = await db
      .select({ id: productos.id, textoEn: productos.descripcionEn })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .where(
        and(
          inArray(tiendas.paisOrigen, PLAZAS),
          isNotNull(productos.descripcionEn),
          sql`trim(${productos.descripcionEn}) != ''`,
          or(
            sql`${productos.descripcionEs} is null`,
            sql`trim(${productos.descripcionEs}) = ''`,
          ),
        ),
      )
      .orderBy(asc(productos.actualizadoEn))
      .limit(POR_TANDA_DESCRIPCION);
    if (pendientes.length === 0) break;

    const r = await traducirDescripciones(
      pendientes.map((p) => ({ id: p.id, textoEn: (p.textoEn ?? "").trim() })),
    );
    if (!r.ok) return { titulos, descripciones, motivo: r.motivo };

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

  return { titulos, descripciones };
}
