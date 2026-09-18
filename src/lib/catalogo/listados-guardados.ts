import "server-only";

import { eq, sql } from "drizzle-orm";

import { recordadoEnElBorde } from "@/lib/cachecito";
import { getDb } from "@/lib/db";
import { configuracion } from "@/lib/db/schema";
import { MERCADOS, type Mercado } from "@/lib/mercado/mercados";

/**
 * ══ LOS LISTADOS QUE ORDENAN EL CATÁLOGO ENTERO SE GUARDAN YA ORDENADOS ══
 * (emergencia de costo, 18 sep 2026 — cuarta parte)
 *
 * Medido por YaDominios con todo lo anterior ya puesto: tres consultas se
 * llevaban ~54 millones de filas a la hora, y las tres eran páginas que
 * ORDENAN EL CATÁLOGO ENTERO para devolver dos docenas:
 *
 *  - la parrilla de la portada (`ROW_NUMBER() OVER (PARTITION BY …)`, la
 *    mezcla por tienda): 107.000 filas por llamada, 190 veces a la hora;
 *  - el catálogo sin filtros (`ORDER BY CASE creado_en > ? …, actualizado_en
 *    DESC`): 68.000 filas, 328 veces a la hora;
 *  - las bandas de departamentos (la misma ventana, por departamento):
 *    14.500 filas, 784 veces a la hora.
 *
 * «Cacheado 60 s por sede» no alcanzaba: esa memoria vive en cada isolate,
 * y Cloudflare corre muchos a la vez en muchas ciudades. Así que se hace lo
 * mismo que con los conteos: UNA foto por mercado con el orden ya calculado
 * —los primeros `LISTADO_TOPE` ids de la parrilla y del catálogo, y los de
 * cada banda—, guardada en `configuracion`, rehecha por el reloj cada cinco
 * minutos. La página lee la foto, corta su tramo y trae esas dos docenas
 * de productos POR ID. Más allá del tope (nadie baja cuarenta pantallas) o
 * con ciudad elegida (Venezuela, catálogo chico), se consulta en vivo.
 *
 * Este archivo solo guarda y lee; las consultas que arman cada orden viven
 * en `consultas.ts` (`recalcularListados`), que es quien sabe de rondas y
 * de novedad. Así no hay ciclo entre los dos.
 *
 * Lo que cambia para quien mira: la parrilla y las bandas se barajan con la
 * semilla DEL DÍA, no con la de cada visita; la primera pantalla de la
 * portada sigue girando por visita (`rotarComienzo`). Es el mismo trato que
 * ya tenía la primera página desde el 24 ago 2026.
 */

export type ClaveDeListado = "parrilla" | "catalogo";

/** Cuántos ids se guardan de la parrilla y del catálogo: ~40 pantallas. */
export const LISTADO_TOPE = 1000;
/** Cada cuánto rehace el reloj los listados de cada mercado. */
export const LISTADOS_CADA_MS = 5 * 60_000;
/** Más viejo que esto, el canario lo marca. */
export const LISTADOS_VIEJOS_MS = 30 * 60_000;
const RECORDAR_MS = 60_000;

export type ListadoGuardado = {
  calculadoEn: number;
  /** La semilla con la que se ordenó (la del día). */
  semilla: number;
  ids: string[];
};

export type BandasGuardadas = {
  calculadoEn: number;
  semilla: number;
  /** slug del departamento → ids en el orden de la banda. */
  bandas: Record<string, string[]>;
};

export function llaveDeListado(
  mercado: Mercado,
  clave: ClaveDeListado | "bandas",
): string {
  return `listado_${clave}_${mercado.codigo}`;
}

async function leerFila(llave: string): Promise<string | null> {
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, llave))
    .limit(1);
  return fila?.valor ?? null;
}

async function guardarFila(llave: string, valor: string): Promise<void> {
  await getDb()
    .insert(configuracion)
    .values({ clave: llave, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } });
}

function esListado(v: unknown): v is ListadoGuardado {
  const c = v as Partial<ListadoGuardado> | null;
  return (
    typeof c === "object" &&
    c !== null &&
    typeof c.calculadoEn === "number" &&
    typeof c.semilla === "number" &&
    Array.isArray(c.ids)
  );
}

function sonBandas(v: unknown): v is BandasGuardadas {
  const c = v as Partial<BandasGuardadas> | null;
  return (
    typeof c === "object" &&
    c !== null &&
    typeof c.calculadoEn === "number" &&
    typeof c.semilla === "number" &&
    typeof c.bandas === "object" &&
    c.bandas !== null
  );
}

export async function guardarListado(
  mercado: Mercado,
  clave: ClaveDeListado,
  semilla: number,
  ids: string[],
): Promise<ListadoGuardado> {
  const listado = { calculadoEn: Date.now(), semilla, ids };
  await guardarFila(llaveDeListado(mercado, clave), JSON.stringify(listado));
  return listado;
}

export async function guardarBandas(
  mercado: Mercado,
  semilla: number,
  bandas: Record<string, string[]>,
): Promise<BandasGuardadas> {
  const guardadas = { calculadoEn: Date.now(), semilla, bandas };
  await guardarFila(
    llaveDeListado(mercado, "bandas"),
    JSON.stringify(guardadas),
  );
  return guardadas;
}

/**
 * El listado guardado, con memoria y borde de un minuto delante, o `null`
 * si todavía no existe.
 *
 * ══ LA PÁGINA NUNCA LO REHACE (18 sep 2026, quinta parte) ══
 * La primera versión, sin fila, lo calculaba en la visita y lo guardaba.
 * Medido por YaDominios: la consulta que arma los 1.000 ids corría 202
 * veces a la hora en vez de ~48, porque cada isolate con la memoria vencida
 * y la fila ausente (recién publicado, o un latido cortado) la rehacía. Ahora
 * solo la arma el reloj; sin fila, la página va por el camino de siempre
 * (la consulta en vivo) hasta que el reloj la escriba, un minuto después.
 */
export async function listadoGuardado(
  mercado: Mercado,
  clave: ClaveDeListado,
): Promise<ListadoGuardado | null> {
  return recordadoEnElBorde(
    `listado-${clave}-${mercado.codigo}`,
    RECORDAR_MS,
    async () => {
      const crudo = await leerFila(llaveDeListado(mercado, clave));
      if (!crudo) return null;
      try {
        const v: unknown = JSON.parse(crudo);
        return esListado(v) ? v : null;
      } catch {
        return null;
      }
    },
  );
}

/** Igual que `listadoGuardado`, para las bandas de departamentos. */
export async function bandasGuardadas(
  mercado: Mercado,
): Promise<BandasGuardadas | null> {
  return recordadoEnElBorde(
    `listado-bandas-${mercado.codigo}`,
    RECORDAR_MS,
    async () => {
      const crudo = await leerFila(llaveDeListado(mercado, "bandas"));
      if (!crudo) return null;
      try {
        const v: unknown = JSON.parse(crudo);
        return sonBandas(v) ? v : null;
      } catch {
        return null;
      }
    },
  );
}

/**
 * Para el reloj y el canario: la edad en minutos del listado más viejo de
 * cada mercado (null si falta alguno), y qué mercados están viejos.
 */
export async function edadDeLosListados(): Promise<{
  minutos: Record<string, number | null>;
  viejos: string[];
}> {
  const llaves = MERCADOS.flatMap((m) => [
    llaveDeListado(m, "parrilla"),
    llaveDeListado(m, "catalogo"),
    llaveDeListado(m, "bandas"),
  ]);
  const filas = await getDb()
    .select({ clave: configuracion.clave, valor: configuracion.valor })
    .from(configuracion)
    .where(
      sql`${configuracion.clave} IN (${sql.join(
        llaves.map((l) => sql`${l}`),
        sql`, `,
      )})`,
    );
  const porLlave = new Map(filas.map((f) => [f.clave, f.valor]));
  const minutos: Record<string, number | null> = {};
  const viejos: string[] = [];
  const ahora = Date.now();
  for (const m of MERCADOS) {
    let masViejo: number | null = 0;
    for (const clave of ["parrilla", "catalogo", "bandas"] as const) {
      const crudo = porLlave.get(llaveDeListado(m, clave));
      let en = 0;
      if (crudo) {
        try {
          en = Number(
            (JSON.parse(crudo) as { calculadoEn?: number }).calculadoEn,
          );
        } catch {
          en = 0;
        }
      }
      if (!Number.isFinite(en) || en <= 0) {
        masViejo = null;
        break;
      }
      masViejo = Math.max(masViejo, ahora - en);
    }
    minutos[m.codigo] =
      masViejo === null ? null : Math.round(masViejo / 60_000);
    if (masViejo === null || masViejo > LISTADOS_VIEJOS_MS)
      viejos.push(m.codigo);
  }
  return { minutos, viejos };
}
