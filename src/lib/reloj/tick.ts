import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { configuracion, latidosVigilante } from "@/lib/db/schema";
import { LLAVE_LATIDO_SINCRONIZAR } from "@/lib/vigilante/reglas";

/**
 * EL RELOJ PROPIO DEL SITIO (3 sep 2026).
 *
 * ══ POR QUÉ ══
 *
 * El reloj de GitHub prometía cada 15 minutos y corría cinco veces al día
 * (11:30, 15:16, 18:48, 21:23, 23:24 el 2 sep): GitHub retrasa y salta los
 * flujos programados cuando anda cargado. De ese reloj dependían la
 * importación de CJ, el afinado de precios y tallas, el stock, la traducción
 * y el vigilante. El dueño lo sintió antes de que se midiera: «que nada se
 * pare».
 *
 * ══ CÓMO ══
 *
 * YaDominios Cloud tiene reloj propio: `triggers.crons` en `yadominios.json`
 * y el planificador invoca `GET /__scheduled` en el minuto que toque (con la
 * cabecera `x-yad-cron`). Aquí late CADA MINUTO, y cada latido hace un
 * trabajo ACOTADO de 25 segundos —lo que Cloudflare deja correr en segundo
 * plano después de contestar— sobre lo que esté pendiente. Mil cuatrocientos
 * latidos al día son horas de trabajo continuo sin depender de nadie.
 *
 * ══ EL RECLAMO ══
 *
 * Antes de trabajar, el latido RECLAMA la marca `sincronizar_ultimo_latido`
 * con un UPDATE condicionado: si otro latido la tomó hace menos de 50 s, no
 * se hace nada. Es lo que impide que dos latidos se pisen y, de paso, lo que
 * hace inofensivo que cualquiera toque la puerta a mano: no puede provocar
 * más trabajo que el que el reloj ya hace.
 */

import {
  TICK_MINIMO_MS,
  TICK_PRESUPUESTO_MS,
  VIGILANTE_CADA_MS,
} from "./constantes";

export { TICK_MINIMO_MS, TICK_PRESUPUESTO_MS, VIGILANTE_CADA_MS };

/** Toma la marca si nadie la tomó hace poco. `true` = a trabajar. */
export async function reclamarTick(ahoraMs: number): Promise<boolean> {
  const db = getDb();
  const limite = ahoraMs - TICK_MINIMO_MS;
  const r = await db
    .update(configuracion)
    .set({ valor: String(ahoraMs) })
    .where(
      sql`${configuracion.clave} = ${LLAVE_LATIDO_SINCRONIZAR} and cast(${configuracion.valor} as integer) < ${limite}`,
    );
  const cambios = Number(
    (r as { meta?: { changes?: number } } | null)?.meta?.changes ?? 0,
  );
  if (cambios > 0) return true;
  /* Sin fila todavía (sitio recién publicado): se crea y se toma. */
  const [fila] = await db
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVE_LATIDO_SINCRONIZAR))
    .limit(1);
  if (fila) return false;
  await db
    .insert(configuracion)
    .values({ clave: LLAVE_LATIDO_SINCRONIZAR, valor: String(ahoraMs) })
    .onConflictDoNothing();
  return true;
}

export type ResultadoTick = {
  hizo: string[];
  duracionMs: number;
};

/**
 * Un latido: lo pendiente, por orden de importancia, hasta agotar el
 * presupuesto. Cada pieza en su propio `catch`: que una falle no deja sin
 * hacer a las demás.
 */
/** Dónde queda escrito el último latido completo, para verlo en el canario. */
export const LLAVE_ULTIMO_TICK = "reloj_ultimo_tick";

async function anotarTick(origen: string, r: ResultadoTick, arranque: number) {
  try {
    const valor = JSON.stringify({
      en: arranque,
      origen,
      duracionMs: r.duracionMs,
      hizo: r.hizo,
    });
    await getDb()
      .insert(configuracion)
      .values({ clave: LLAVE_ULTIMO_TICK, valor })
      .onConflictDoUpdate({
        target: configuracion.clave,
        set: { valor },
      });
  } catch (fallo) {
    console.error("[tick] no se pudo anotar el latido:", fallo);
  }
}

/** Deja el fallo en el historial que se ve en Panel → Vigilante. Nunca
 *  lanza: un fallo al anotar un fallo no puede tumbar el latido. */
async function anotar(origen: string, fallo: unknown): Promise<void> {
  try {
    const { registrarError } = await import("@/lib/errores/registro");
    await registrarError(origen, fallo);
  } catch {
    /* nada: ya se escribió en la consola */
  }
}

export async function correrTick(
  origen: "puerta" | "trafico" = "puerta",
  presupuestoMs = TICK_PRESUPUESTO_MS,
): Promise<ResultadoTick> {
  const arranque = Date.now();
  const hasta = arranque + presupuestoMs;
  const queda = () => hasta - Date.now();
  const hizo: string[] = [];

  /* 0. El vigilante, cuando le toca: mira todo y avisa. Ese latido es suyo. */
  try {
    const [ultimo] = await getDb()
      .select({ corridoEn: latidosVigilante.corridoEn })
      .from(latidosVigilante)
      .orderBy(desc(latidosVigilante.corridoEn))
      .limit(1);
    const haceMs = ultimo ? arranque - ultimo.corridoEn.getTime() : Infinity;
    if (haceMs > VIGILANTE_CADA_MS) {
      const { correrVigilante } = await import("@/lib/vigilante/correr");
      const l = await correrVigilante("reloj");
      hizo.push(`vigilante: ${l.alertas.length} alertas`);
      const r = { hizo, duracionMs: Date.now() - arranque };
      await anotarTick(origen, r, arranque);
      return r;
    }
  } catch (fallo) {
    console.error("[tick] el vigilante falló:", fallo);
    await anotar("reloj/vigilante", fallo);
  }

  /* 1. La importación masiva, si hay alguna en marcha. */
  try {
    if (queda() > 8_000) {
      const { avanzarImportacionesEnCurso } =
        await import("@/lib/cj/masivo-servidor");
      const r = await avanzarImportacionesEnCurso(Math.floor(queda() * 0.4));
      if (r.length > 0)
        hizo.push(
          `importación: ${r.map((x) => `${x.mercado} ${x.tandasHechas}/${x.tandasTotal}`).join(", ")}`,
        );
    }
  } catch (fallo) {
    console.error("[tick] la importación falló:", fallo);
    await anotar("reloj/importacion", fallo);
  }

  /* 2. El afinado: flete real, tallas y stock de lo que está en revisión. */
  try {
    if (queda() > 6_000) {
      const { afinarImportados } = await import("@/lib/cj/afinar");
      const r = await afinarImportados({
        limite: 6,
        presupuestoMs: Math.floor(queda() * 0.7),
      });
      if (r.afinados + r.fallidos + r.agotados > 0) {
        hizo.push(
          `afinado: ${r.afinados} ok, ${r.agotados} agotados, ${r.fallidos} fallidos, quedan ${r.restantes}`,
        );
      }
    }
  } catch (fallo) {
    console.error("[tick] el afinado falló:", fallo);
    await anotar("reloj/afinado", fallo);
  }

  /* 3. El barrido: nada de CJ a la venta sin el último filtro. */
  try {
    if (queda() > 2_000) {
      const { barrerNoVerificados } = await import("@/lib/cj/verificados");
      const b = await barrerNoVerificados();
      if (b.retirados + b.publicados > 0) {
        hizo.push(
          `barrido: ${b.retirados} retirados, ${b.publicados} publicados`,
        );
      }
    }
  } catch (fallo) {
    console.error("[tick] el barrido falló:", fallo);
    await anotar("reloj/barrido", fallo);
  }

  /* 4. El stock de CJ, un par por latido. */
  try {
    if (queda() > 4_000) {
      const { refrescarExistenciasCj } = await import("@/lib/cj/existencias");
      const r = await refrescarExistenciasCj(2);
      if (r.mirados > 0) hizo.push(`stock: ${r.mirados} mirados`);
    }
  } catch (fallo) {
    console.error("[tick] el stock falló:", fallo);
    await anotar("reloj/stock", fallo);
  }

  /* 5. Una tanda de títulos al español. */
  try {
    if (queda() > 5_000) {
      const { traducirDesdeElReloj } = await import("@/lib/traduccion/tanda");
      const r = await traducirDesdeElReloj({
        tandasTitulos: 1,
        tandasDescripciones: 0,
      });
      if (r.titulos > 0) hizo.push(`traducción: ${r.titulos} títulos`);
    }
  } catch (fallo) {
    console.error("[tick] la traducción falló:", fallo);
    await anotar("reloj/traduccion", fallo);
  }

  /* 6. Las fotos que viven en el servidor de un comercio, a nuestro bucket:
     un par por latido, con tope por hora (ver `fotos-reglas.ts`). */
  try {
    if (queda() > 5_000) {
      const { traerFotosDesdeElReloj } =
        await import("@/lib/catalogo/fotos-automaticas");
      const r = await traerFotosDesdeElReloj({
        presupuestoMs: Math.min(10_000, Math.floor(queda() * 0.8)),
      });
      if (r.copiadas + r.fallidas > 0) {
        hizo.push(
          `fotos: ${r.copiadas} copiadas, ${r.fallidas} fallidas${r.rotas ? `, ${r.rotas} dadas por perdidas` : ""}, faltan ${r.faltan}`,
        );
      }
    }
  } catch (fallo) {
    console.error("[tick] las fotos fallaron:", fallo);
    await anotar("reloj/fotos", fallo);
  }

  const r = { hizo, duracionMs: Date.now() - arranque };
  await anotarTick(origen, r, arranque);
  return r;
}

/* ══ Y SI NINGÚN RELOJ LLAMA, LATE CON EL TRÁFICO (3 sep 2026) ══
   Cada visita pública o del panel puede dejar un latido en segundo plano:
   si la marca lleva más de 50 s sin tomarse, se reclama y el trabajo corre
   con `ctx.waitUntil` mientras la página ya se entregó. Con Google y los
   compradores entrando a toda hora, el sitio se mueve solo aunque el reloj
   de la plataforma o el de GitHub fallen. Un contador por instancia evita
   siquiera mirar la base más de una vez por minuto. */
let ultimoIntentoMs = 0;

export function latirConElTrafico(): void {
  const ahora = Date.now();
  if (ahora - ultimoIntentoMs < 60_000) return;
  ultimoIntentoMs = ahora;
  type Contexto = { waitUntil: (p: Promise<unknown>) => void };
  let ctx: Contexto | null = null;
  try {
    ctx = getCloudflareContext().ctx as unknown as Contexto;
  } catch {
    return; /* Sin contexto (un build, una prueba): no hay dónde latir. */
  }
  if (!ctx || typeof ctx.waitUntil !== "function") return;
  ctx.waitUntil(
    (async () => {
      if (!(await reclamarTick(ahora))) return;
      const r = await correrTick("trafico");
      console.log(
        "[tick·tráfico]",
        r.duracionMs,
        "ms:",
        r.hizo.join(" · ") || "nada pendiente",
      );
    })().catch((fallo) => console.error("[tick·tráfico] falló:", fallo)),
  );
}
