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

/** Dónde queda la hora del último barrido completo. */
export const LLAVE_ULTIMO_BARRIDO = "reloj_ultimo_barrido";
/** Sin cambios del afinado, el barrido corre cada tanto. */
export const BARRIDO_CADA_MS = 15 * 60_000;

/** Una marca de tiempo guardada en `configuracion`, o 0 si no existe. */
async function marcaDe(llave: string): Promise<number> {
  try {
    const [fila] = await getDb()
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(eq(configuracion.clave, llave))
      .limit(1);
    const n = Number(fila?.valor);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * ══ RECLAMAR UN TRABAJO PESADO ANTES DE EMPEZARLO (18 sep 2026) ══
 *
 * Igual que `reclamarTick`, pero para un trabajo concreto: un UPDATE
 * condicional que solo gana UN latido cada `cadaMs`, aunque dos latidos
 * corran a la vez o el primero se corte a mitad. Sin esto, la foto de 1.000
 * ids se rehizo 202 veces a la hora en vez de ~48 (medido por YaDominios):
 * un latido que se corta deja la foto vieja y el siguiente la rehace entera.
 */
async function reclamarMarca(
  llave: string,
  cadaMs: number,
  ahoraMs: number,
): Promise<boolean> {
  try {
    const db = getDb();
    const r = await db
      .update(configuracion)
      .set({ valor: String(ahoraMs) })
      .where(
        sql`${configuracion.clave} = ${llave} and cast(${configuracion.valor} as integer) < ${ahoraMs - cadaMs}`,
      );
    const cambios = Number(
      (r as { meta?: { changes?: number } } | null)?.meta?.changes ?? 0,
    );
    if (cambios > 0) return true;
    const ins = await db
      .insert(configuracion)
      .values({ clave: llave, valor: String(ahoraMs) })
      .onConflictDoNothing();
    return (
      Number(
        (ins as { meta?: { changes?: number } } | null)?.meta?.changes ?? 0,
      ) > 0
    );
  } catch {
    return false;
  }
}

/** Dónde se marca cada intento de rehacer los conteos y los listados. */
export const LLAVE_INTENTO_CONTEOS = "reloj_intento_conteos";
export const LLAVE_INTENTO_LISTADOS = "reloj_intento_listados";
export const LLAVE_OPTIMIZAR_BASE = "reloj_optimizar_base";
export const LLAVE_INTENTO_TEXTO = "reloj_intento_texto_de_busqueda";
/** Entre dos intentos de rehacer, como mínimo. */
const INTENTO_CADA_MS = 4 * 60_000;
/** `PRAGMA optimize` una vez al día (lo recomienda Cloudflare para D1). */
const OPTIMIZAR_CADA_MS = 24 * 60 * 60_000;

async function anotarMarca(llave: string, ms: number): Promise<void> {
  const valor = String(ms);
  await getDb()
    .insert(configuracion)
    .values({ clave: llave, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } })
    .catch(() => undefined);
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

  /** Si este latido rehízo los conteos, los listados esperan al siguiente. */
  let rehizoConteos = false;

  /* 0b. LOS CONTEOS DEL CATÁLOGO, cada cinco minutos (emergencia de costo,
     17 sep 2026). Va ANTES que CJ a propósito: si fuera al final, el afinado
     y el stock se comerían el presupuesto y la foto no se rehacería nunca.
     Cuesta unas 25.000 filas leídas por corrida —lo que antes costaba UNA
     visita a la portada— y sin ella las pantallas leerían la foto vieja.
     Ver `src/lib/catalogo/conteos.ts`. */
  try {
    if (queda() > 4_000) {
      const { edadDeLosConteos, recalcularTodosLosConteos, CONTEOS_CADA_MS } =
        await import("@/lib/catalogo/conteos");
      const edad = await edadDeLosConteos();
      const masViejo = Math.max(
        ...Object.values(edad.minutos).map((m) => (m === null ? Infinity : m)),
      );
      if (
        masViejo * 60_000 >= CONTEOS_CADA_MS &&
        (await reclamarMarca(LLAVE_INTENTO_CONTEOS, INTENTO_CADA_MS, arranque))
      ) {
        const r = await recalcularTodosLosConteos();
        rehizoConteos = true;
        hizo.push(`conteos: ${r.hizo.join(" · ")}`);
        if (r.fallos.length > 0) {
          await anotar(
            "reloj/conteos",
            new Error(`no se pudo rehacer: ${r.fallos.join("; ")}`),
          );
        }
      }
    }
  } catch (fallo) {
    console.error("[tick] los conteos fallaron:", fallo);
    await anotar("reloj/conteos", fallo);
  }

  /* 0c. LOS LISTADOS YA ORDENADOS (parrilla, catálogo y bandas), cada cinco
     minutos: las tres consultas que ordenaban el catálogo entero en cada
     visita (54 millones de filas a la hora) ahora se ordenan aquí, una vez,
     y las páginas leen la foto. Ver `listados-guardados.ts`. */
  try {
    /* Nunca en el mismo latido que los conteos: los dos juntos se comían el
       presupuesto y el latido se cortaba a mitad (18 sep 2026). */
    if (queda() > 6_000 && !rehizoConteos) {
      const { edadDeLosListados, LISTADOS_CADA_MS } =
        await import("@/lib/catalogo/listados-guardados");
      const edad = await edadDeLosListados();
      const masViejo = Math.max(
        ...Object.values(edad.minutos).map((m) => (m === null ? Infinity : m)),
      );
      if (
        masViejo * 60_000 >= LISTADOS_CADA_MS &&
        (await reclamarMarca(LLAVE_INTENTO_LISTADOS, INTENTO_CADA_MS, arranque))
      ) {
        const { recalcularTodosLosListados } =
          await import("@/lib/catalogo/consultas");
        const r = await recalcularTodosLosListados();
        hizo.push(`listados: ${r.hizo.join(" · ")}`);
        if (r.fallos.length > 0) {
          await anotar(
            "reloj/listados",
            new Error(`no se pudo rehacer: ${r.fallos.join("; ")}`),
          );
        }
      }
    }
  } catch (fallo) {
    console.error("[tick] los listados fallaron:", fallo);
    await anotar("reloj/listados", fallo);
  }

  /* 0d. LAS ESTADÍSTICAS DE LA BASE, una vez al día (18 sep 2026). Sin
     ellas (no existía `sqlite_stat1`), SQLite creía que `estado = ?` era
     selectivo y elegía el índice de estado en todas partes: 25.000 filas
     por una búsqueda de 24 ids. `PRAGMA optimize=0x10002` solo vuelve a
     analizar las tablas que crecieron o se encogieron mucho. */
  try {
    if (
      queda() > 3_000 &&
      (await reclamarMarca(LLAVE_OPTIMIZAR_BASE, OPTIMIZAR_CADA_MS, arranque))
    ) {
      await getDb().run(sql.raw("PRAGMA optimize=0x10002"));
      hizo.push("base: estadísticas al día");
    }
  } catch (fallo) {
    console.error("[tick] PRAGMA optimize falló:", fallo);
    await anotar("reloj/optimizar", fallo);
  }

  /* 0e. EL TEXTO DE BÚSQUEDA YA PREPARADO (20 sep 2026). Buscar tardaba 19 s
     porque quitar acentos eran catorce `REPLACE` por producto y por búsqueda.
     Aquí se hace una vez por producto: los nuevos, los que cambiaron y los
     de más de una semana. Mientras la tabla no está completa se insiste cada
     minuto; después, cada cinco. Ver `catalogo/texto-de-busqueda.ts`. */
  try {
    if (queda() > 6_000) {
      const {
        ponerAlDiaElTextoDeBusqueda,
        textoDeBusquedaListo,
        TEXTO_CADA_MS,
      } = await import("@/lib/catalogo/texto-de-busqueda");
      const cada = (await textoDeBusquedaListo()) ? TEXTO_CADA_MS : 60_000;
      if (await reclamarMarca(LLAVE_INTENTO_TEXTO, cada, arranque)) {
        const r = await ponerAlDiaElTextoDeBusqueda(queda);
        if (r.preparados > 0)
          hizo.push(
            `búsqueda: ${r.preparados} textos preparados${r.listo ? "" : " (sigue)"}`,
          );
      }
    }
  } catch (fallo) {
    console.error("[tick] el texto de búsqueda falló:", fallo);
    await anotar("reloj/texto-de-busqueda", fallo);
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

  /* Cuántos esperan su envío real. Lo llena el afinado; si no llegó a correr
     se queda en null y el stock se comporta como siempre. */
  let colaPorAfinar: number | null = null;
  /** CJ se quedó sin puntos: nadie más le habla en este latido. */
  let cjEnPausa = false;
  /** Cuántos afinó o agotó este latido: si hubo, el barrido tiene trabajo. */
  let afinadoEsteLatido = 0;
  /** Los productos que este latido afinó o miró: el barrido va solo a esos. */
  const idsTocados: string[] = [];

  /* 2. El afinado: flete real, tallas y stock de lo que está en revisión. */
  try {
    if (queda() > 6_000) {
      const { afinarImportados } = await import("@/lib/cj/afinar");
      const r = await afinarImportados({
        limite: 6,
        /* Medido el 3 sep 2026: con 0,7 el afinado se comía el latido entero
           y el paso de las fotos no llegaba a correr nunca. */
        presupuestoMs: Math.floor(queda() * 0.45),
      });
      if (r.motivo) {
        /* «CJ sin puntos» no es un fallo del sitio: se dice tal cual para
           que la pantalla no lo lea como avería (4 sep 2026). */
        hizo.push(`afinado en pausa: ${r.motivo}`);
        /* Y el stock tampoco llama: es la misma API y los mismos puntos. */
        cjEnPausa = true;
      } else if (r.afinados + r.fallidos + r.agotados > 0) {
        hizo.push(
          `afinado: ${r.afinados} ok, ${r.agotados} agotados, ${r.fallidos} fallidos, quedan ${r.restantes}` +
            /* POR QUÉ FALLA, EN VOZ ALTA (8 sep 2026): un día entero con
               «0 ok, 3 fallidos» y la causa muriendo en un console.error
               que nadie lee. */
            (r.ultimoFallo ? ` · último fallo: ${r.ultimoFallo}` : ""),
        );
      }
      /* Lo que queda por afinar decide si el stock puede gastar puntos de CJ
         en este latido: los dos usan la misma llamada de 10 puntos.
         Se asigna FUERA de las ramas de arriba: en la primera versión vivía
         dentro del `else if`, así que con el afinado en pausa se quedaba en
         null y el stock gastaba a manos llenas — justo cuando no quedaba
         nada que gastar. Se vio en producción a los diez minutos. */
      colaPorAfinar = r.restantes ?? colaPorAfinar;
      afinadoEsteLatido = r.afinados + r.agotados;
      idsTocados.push(...(r.ids ?? []));
    }
  } catch (fallo) {
    console.error("[tick] el afinado falló:", fallo);
    await anotar("reloj/afinado", fallo);
  }

  /* 3. El barrido: nada de CJ a la venta sin el último filtro.

     ══ SOLO CUANDO ALGO CAMBIÓ, O CADA 15 MINUTOS (emergencia de costo, 18
     sep 2026) ══ Son dos UPDATE que recorren el catálogo de CJ entero con
     subconsultas sobre los envíos y las tallas (100.000–165.000 filas cada
     uno), y corrían CADA MINUTO aunque el afinado no hubiera tocado nada.
     Ahora corre cuando este latido afinó o agotó algo (lo que retira o
     publica sale de ahí), y si no, a los 15 minutos del último; el
     vigilante lo corre además cada 20. Lo que cambió el stock del latido
     anterior lo recoge la vuelta que toque. */
  try {
    const ultimoBarrido = await marcaDe(LLAVE_ULTIMO_BARRIDO);
    const haceMs = arranque - ultimoBarrido;
    if (queda() > 2_000 && haceMs > BARRIDO_CADA_MS) {
      const { barrerNoVerificados } = await import("@/lib/cj/verificados");
      const b = await barrerNoVerificados();
      await anotarMarca(LLAVE_ULTIMO_BARRIDO, arranque);
      if (b.retirados + b.publicados > 0) {
        hizo.push(
          `barrido: ${b.retirados} retirados, ${b.publicados} publicados`,
        );
      }
    } else if (
      queda() > 2_000 &&
      afinadoEsteLatido > 0 &&
      idsTocados.length > 0
    ) {
      /* Solo lo que este latido afinó: unas filas, no el catálogo. */
      const { barrerNoVerificados } = await import("@/lib/cj/verificados");
      const b = await barrerNoVerificados({ soloIds: idsTocados });
      if (b.retirados + b.publicados > 0) {
        hizo.push(
          `barrido de lo afinado: ${b.retirados} retirados, ${b.publicados} publicados`,
        );
      }
    }
  } catch (fallo) {
    console.error("[tick] el barrido falló:", fallo);
    await anotar("reloj/barrido", fallo);
  }

  /* 4. Las fotos que viven en el servidor de un comercio, a nuestro bucket:
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

  /* 4b. Las listas de fotos guardadas de más de un día se rehacen (un
     puñado por latido): es la red de seguridad de `fotos_de_producto`, por
     si a algún sitio que toca las fotos se le olvidó borrar la suya. */
  try {
    if (queda() > 3_000) {
      const { refrescarFotosViejas } =
        await import("@/lib/catalogo/fotos-de-producto");
      const n = await refrescarFotosViejas(150);
      if (n > 0) hizo.push(`fotos guardadas: ${n} rehechas`);
    }
  } catch (fallo) {
    console.error("[tick] las fotos guardadas fallaron:", fallo);
    await anotar("reloj/fotos-guardadas", fallo);
  }

  /* 5. El stock de CJ — Y CEDE SUS PUNTOS MIENTRAS HAYA COLA (4 sep 2026).
     Refrescar el stock usa la MISMA llamada de 10 puntos que el afinado, y a
     2 por latido se llevaba la mitad del presupuesto diario de CJ sin
     publicar ni un producto. Ver `reparto-de-puntos.ts`. */
  try {
    if (queda() > 4_000) {
      const { cuantosDeStock } = await import("@/lib/cj/reparto-de-puntos");
      const { contarCasiListos, refrescarExistenciasCj } =
        await import("@/lib/cj/existencias");
      /* Las retiradas con flete real que solo esperan una lectura de stock
         (8 sep 2026): mientras haya, el stock no cede sus puntos. */
      const casiListos = cjEnPausa ? 0 : await contarCasiListos();
      const ahora = new Date();
      const cuantos = cuantosDeStock(
        colaPorAfinar ?? 0,
        ahora.getUTCHours() * 60 + ahora.getUTCMinutes(),
        cjEnPausa,
        casiListos,
      );
      if (cuantos > 0) {
        const r = await refrescarExistenciasCj(cuantos);
        if (r.mirados > 0)
          hizo.push(
            `stock: ${r.mirados} mirados, ${r.agotados} agotados, ${r.fallidos} fallidos` +
              (casiListos > 0
                ? ` · casi listos por mirar: ${casiListos}`
                : "") +
              (r.ultimoFallo ? ` · último fallo: ${r.ultimoFallo}` : ""),
          );
        /* Lo que cambió de stock se barre ya, y solo eso (18 sep 2026): un
           agotado sale de la venta en este latido, no en 15 minutos. */
        if (r.ids && r.ids.length > 0 && queda() > 1_500) {
          const { barrerNoVerificados } = await import("@/lib/cj/verificados");
          const b = await barrerNoVerificados({ soloIds: r.ids });
          if (b.retirados + b.publicados > 0) {
            hizo.push(
              `barrido del stock: ${b.retirados} retirados, ${b.publicados} publicados`,
            );
          }
        }
      }
    }
  } catch (fallo) {
    console.error("[tick] el stock falló:", fallo);
    await anotar("reloj/stock", fallo);
  }

  /**
   * 6. Una tanda de títulos Y UNA DE DESCRIPCIONES al español.
   *
   * ══ POR QUÉ LAS DESCRIPCIONES VAN AQUÍ (8 sep 2026) ══
   *
   * Este latido corre cada minuto y traducía `tandasDescripciones: 0`. Las
   * descripciones solo las traducían el flujo de GitHub —que corre unas
   * cinco veces al día— y el botón del panel. Medido en producción: **~50
   * descripciones al día**, con 8.651 fichas publicadas sin descripción en
   * español (Chile todas, Colombia todas). A ese ritmo, más de cien días.
   *
   * No gasta puntos de CJ: es el traductor de texto (Gemini), que cuesta
   * centavos. Lo que sí gasta es tiempo del latido, y por eso va DESPUÉS
   * del stock y con su propio `queda()`: una tanda de cinco descripciones
   * no puede robarle el presupuesto a publicar.
   */
  try {
    if (queda() > 5_000) {
      const { traducirDesdeElReloj } = await import("@/lib/traduccion/tanda");
      const r = await traducirDesdeElReloj({
        tandasTitulos: 1,
        tandasDescripciones: queda() > 9_000 ? 1 : 0,
        tandasTitulosIngles: 1,
      });
      if (r.titulos > 0) hizo.push(`traducción: ${r.titulos} títulos`);
      if (r.titulosIngles > 0) {
        hizo.push(`traducción: ${r.titulosIngles} títulos al inglés`);
      }
      if (r.descripciones > 0) {
        hizo.push(`traducción: ${r.descripciones} descripciones`);
      }
    }
  } catch (fallo) {
    console.error("[tick] la traducción falló:", fallo);
    await anotar("reloj/traduccion", fallo);
  }

  /* 6b. UNA descripción de CJ por latido, para todas las plazas (14 sep
     2026): el reloj traducía descripciones pero nadie las traía de CJ, y
     Chile tenía 1.245 fichas a la venta sin texto en ningún idioma. Cuesta
     10 puntos: cede si CJ está sin puntos, y va cada tres minutos para no
     comerse el presupuesto del afinado. Ver `descripcion-reloj.ts`. */
  try {
    if (!cjEnPausa && queda() > 6_000 && new Date().getUTCMinutes() % 3 === 0) {
      const { traerDescripcionDesdeElReloj } =
        await import("@/lib/traduccion/descripcion-reloj");
      const r = await traerDescripcionDesdeElReloj();
      if (r.traidas + r.sinDatos > 0) {
        hizo.push(
          `descripción de CJ: ${r.traidas} traída${r.sinDatos ? `, ${r.sinDatos} sin datos` : ""}, faltan ${r.faltan}`,
        );
      }
    }
  } catch (fallo) {
    console.error("[tick] traer la descripción falló:", fallo);
    await anotar("reloj/descripcion", fallo);
  }

  /* 7. ¿YA DESPACHÓ EL PROVEEDOR? LA GUÍA AL COMPRADOR (21 sep 2026).
     Hasta hoy el número de guía solo entraba si alguien del equipo pulsaba
     «actualizar» en Panel → Pedidos al proveedor, y el correo de «ya va en
     camino» no existía: el comprador de EE. UU. pagaba y no sabía nada más
     hasta que el paquete aparecía en su puerta.

     Va al FINAL y de últimas a propósito: son dos consultas a CJ como
     máximo, cede si no hay puntos, y ninguna fila se vuelve a preguntar
     antes de dos horas. Publicar catálogo manda sobre preguntar. */
  try {
    if (!cjEnPausa && queda() > 5_000) {
      const { mirarDespachosDelProveedor } =
        await import("@/lib/pedidos/despacho-automatico");
      const r = await mirarDespachosDelProveedor();
      if (r.preguntadas > 0) {
        hizo.push(
          `despachos: ${r.preguntadas} preguntadas, ${r.conGuia} con guía, ${r.despachados} despachados, ${r.avisados} avisados` +
            (r.ultimoFallo ? ` · último fallo: ${r.ultimoFallo}` : ""),
        );
      }
    }
  } catch (fallo) {
    console.error("[tick] los despachos fallaron:", fallo);
    await anotar("reloj/despachos", fallo);
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
