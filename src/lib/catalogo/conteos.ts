import "server-only";

import { and, count, eq, gt, isNotNull, sql } from "drizzle-orm";

import { recordadoEnElBorde } from "@/lib/cachecito";
import { getDb } from "@/lib/db";
import {
  categorias,
  configuracion,
  depositos,
  productos,
  tiendas,
} from "@/lib/db/schema";
import { zonaPorSlug } from "@/lib/entrega/zonas";
import { MERCADOS, type Mercado } from "@/lib/mercado/mercados";
import { tiendaVisibleEn, visibleEn } from "@/lib/mercado/repositorio";

import {
  armarCobertura,
  armarComercios,
  armarDepartamentos,
  armarMenuDeCategorias,
  type CategoriaDelMenu,
  type ComercioConteo,
} from "./conteos-armar";

/**
 * ══ LOS CONTEOS DEL CATÁLOGO SE GUARDAN, NO SE CALCULAN POR VISITA ══
 * (emergencia de costo, 17 sep 2026)
 *
 * Lo que pasó: la base `site-mercatren-db` leía 134 mil millones de filas al
 * mes ($109 de sobrecosto y subiendo a $775/mes), y las cinco consultas
 * culpables eran CONTEOS que cada visita rehacía sobre el catálogo entero:
 * la tira de departamentos (una subconsulta correlacionada por departamento:
 * 458.000 filas por visita), el directorio de comercios con su conteo, el
 * menú de categorías y el bombillo de ciudades. Todos iguales para todo el
 * que entra por el mismo dominio, y todos recalculados 310.000 veces al día.
 *
 * Lo que hay ahora: UNA foto por mercado, guardada en la tabla
 * `configuracion` (una fila, un JSON), que el reloj rehace cada pocos
 * minutos con dos GROUP BY planos (~20.000 filas leídas por mercado, no
 * por visita). Las pantallas leen la fila: una fila, no veinte mil. Y encima
 * la caché del borde, para que ni esa fila se pida más de una vez por minuto
 * por sede.
 *
 * QUÉ NO VA AQUÍ: nada que dependa de quién mira ni de la ciudad elegida.
 * La tira de departamentos FILTRADA por zona sigue consultando (ya sin la
 * subconsulta correlacionada), porque cambia con cada ciudad.
 *
 * Se guarda en `configuracion` y no en una tabla nueva a propósito: esa
 * tabla ya existe en producción, así que esto funciona desde el primer
 * minuto de la publicación, sin depender de que `schema.sql` corra.
 */

export type ConteosDelMercado = {
  /** Cuándo se calculó, en milisegundos. */
  calculadoEn: number;
  /** Publicados por departamento raíz, hijos incluidos, por slug. */
  departamentos: Record<string, number>;
  /** El menú: categorías con productos, de más a menos. */
  categorias: CategoriaDelMenu[];
  /** Todos los comercios activos con su conteo (cero incluido). */
  comercios: ComercioConteo[];
  /** Los bombillos: zona → cuántos se retiran ahí. */
  cobertura: Record<string, number>;
  /** Publicados en el mercado, en total. */
  total: number;
  /** De esos, con precio: los que la portada de verdad enseña. */
  totalConPrecio: number;
};

/** Cada cuánto rehace el reloj la foto de cada mercado. */
export const CONTEOS_CADA_MS = 5 * 60_000;
/** Más viejo que esto, el canario lo marca: el reloj no está rehaciendo. */
export const CONTEOS_VIEJOS_MS = 30 * 60_000;
/** Cuánto recuerda cada sede del borde la fila leída. */
const RECORDAR_MS = 60_000;

export function llaveDeConteos(mercado: Mercado): string {
  return `conteos_catalogo_${mercado.codigo}`;
}

/**
 * LOS DOS AGREGADOS BARATOS, y las dos listas chicas que les dan nombre.
 *
 * `porCategoriaYTienda`: un solo recorrido de los publicados del mercado,
 * agrupado por categoría y tienda (salen unos cientos de pares). De ahí
 * salen los departamentos, el menú, el directorio y el total, en código.
 *
 * `porZona`: solo los productos CON depósito (el índice
 * `idx_productos_deposito_estado` deja fuera al resto) y con precio, que es
 * lo que enciende un bombillo.
 */
export async function calcularConteos(
  mercado: Mercado,
): Promise<ConteosDelMercado> {
  const db = getDb();

  const [pares, porZonaCrudo, listaCategorias, listaTiendas] =
    await Promise.all([
      db
        .select({
          categoriaId: productos.categoriaId,
          tiendaId: productos.tiendaId,
          cuantos: count(),
          /* La parrilla de la portada solo enseña lo que tiene precio: se
             cuenta aquí mismo, en el mismo recorrido, sin otra consulta. */
          conPrecio: sql<number>`SUM(CASE WHEN ${productos.precioCentavos} > 0 THEN 1 ELSE 0 END)`,
        })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .where(visibleEn(mercado))
        .groupBy(productos.categoriaId, productos.tiendaId),
      db
        .select({ zona: depositos.zona, cuantos: count() })
        .from(productos)
        .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
        .innerJoin(depositos, eq(depositos.id, productos.depositoId))
        .where(
          and(
            visibleEn(mercado),
            isNotNull(productos.depositoId),
            gt(productos.precioCentavos, 0),
            eq(depositos.activo, true),
            isNotNull(depositos.zona),
          ),
        )
        .groupBy(depositos.zona),
      db
        .select({
          id: categorias.id,
          slug: categorias.slug,
          nombreEs: categorias.nombreEs,
          nombreEn: categorias.nombreEn,
          padreId: categorias.padreId,
          tiendaId: categorias.tiendaId,
        })
        .from(categorias),
      db
        .select({
          id: tiendas.id,
          slug: tiendas.slug,
          nombre: tiendas.nombre,
          descripcionEs: tiendas.descripcionEs,
          descripcionEn: tiendas.descripcionEn,
          paisOrigen: tiendas.paisOrigen,
          logoClave: tiendas.logoClave,
          ciudad: tiendas.ciudad,
          creadoEn: tiendas.creadoEn,
        })
        .from(tiendas)
        .where(tiendaVisibleEn(mercado)),
    ]);

  const porCategoria = new Map<string, number>();
  const porTienda = new Map<string, number>();
  let total = 0;
  let totalConPrecio = 0;
  for (const p of pares) {
    const n = Number(p.cuantos);
    total += n;
    totalConPrecio += Number(p.conPrecio ?? 0);
    if (p.categoriaId) {
      porCategoria.set(
        p.categoriaId,
        (porCategoria.get(p.categoriaId) ?? 0) + n,
      );
    }
    porTienda.set(p.tiendaId, (porTienda.get(p.tiendaId) ?? 0) + n);
  }

  return {
    calculadoEn: Date.now(),
    departamentos: armarDepartamentos(porCategoria, listaCategorias),
    categorias: armarMenuDeCategorias(porCategoria, listaCategorias),
    comercios: armarComercios(
      porTienda,
      listaTiendas.map(({ creadoEn, ...t }) => ({
        ...t,
        creadoEnMs: creadoEn.getTime(),
      })),
    ),
    cobertura: armarCobertura(porZonaCrudo, (slug) =>
      Boolean(zonaPorSlug(slug)),
    ),
    total,
    totalConPrecio,
  };
}

/** Calcula y guarda la foto de un mercado. Devuelve lo guardado. */
export async function recalcularConteos(
  mercado: Mercado,
): Promise<ConteosDelMercado> {
  const conteos = await calcularConteos(mercado);
  const valor = JSON.stringify(conteos);
  const clave = llaveDeConteos(mercado);
  await getDb()
    .insert(configuracion)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } });
  return conteos;
}

/**
 * Para el reloj: rehace los cuatro mercados. Devuelve una línea por mercado
 * para el latido («US 19.812 · VE 1.197 …»). Un mercado que falle no frena a
 * los demás: se anota y se sigue.
 */
export async function recalcularTodosLosConteos(): Promise<{
  hizo: string[];
  fallos: string[];
}> {
  const hizo: string[] = [];
  const fallos: string[] = [];
  for (const mercado of MERCADOS) {
    try {
      const c = await recalcularConteos(mercado);
      hizo.push(`${mercado.codigo} ${c.total}`);
    } catch (fallo) {
      fallos.push(
        `${mercado.codigo}: ${fallo instanceof Error ? fallo.message : String(fallo)}`,
      );
    }
  }
  return { hizo, fallos };
}

/** La fila guardada, tal cual, o null si nunca se calculó. */
export async function conteosGuardados(
  mercado: Mercado,
): Promise<ConteosDelMercado | null> {
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, llaveDeConteos(mercado)))
    .limit(1);
  if (!fila) return null;
  const c = JSON.parse(fila.valor) as Partial<ConteosDelMercado>;
  /* Una fila vieja con otra forma no puede tumbar la portada: se rehace. */
  if (
    typeof c.calculadoEn !== "number" ||
    typeof c.totalConPrecio !== "number" ||
    !c.departamentos ||
    !Array.isArray(c.categorias) ||
    !Array.isArray(c.comercios) ||
    !c.cobertura
  ) {
    return null;
  }
  return c as ConteosDelMercado;
}

/**
 * LO QUE LEEN LAS PANTALLAS.
 *
 * Memoria y borde primero (un minuto); después la fila guardada; y si no
 * hay fila —la primera visita después de publicar, antes de que el reloj
 * lata— se calcula y se guarda en ese momento, UNA vez, no en cada visita.
 * Una foto vieja se sirve igual: mejor un conteo de hace veinte minutos que
 * veinte mil filas por visita. El canario (`/datos/salud` → `conteos`) es
 * quien avisa si el reloj dejó de rehacerla.
 */
export async function conteosDe(mercado: Mercado): Promise<ConteosDelMercado> {
  return recordadoEnElBorde(
    `conteos-catalogo-${mercado.codigo}`,
    RECORDAR_MS,
    async () => (await conteosGuardados(mercado)) ?? recalcularConteos(mercado),
  );
}

/**
 * Para el canario: la edad de la foto de cada mercado, en minutos, o null si
 * no existe. `viejos` nombra los que pasan de `CONTEOS_VIEJOS_MS`.
 */
export async function edadDeLosConteos(): Promise<{
  minutos: Record<string, number | null>;
  viejos: string[];
}> {
  const filas = await getDb()
    .select({ clave: configuracion.clave, valor: configuracion.valor })
    .from(configuracion)
    .where(
      sql`${configuracion.clave} IN (${sql.join(
        MERCADOS.map((m) => sql`${llaveDeConteos(m)}`),
        sql`, `,
      )})`,
    );
  const minutos: Record<string, number | null> = {};
  const viejos: string[] = [];
  for (const m of MERCADOS) {
    const crudo = filas.find((f) => f.clave === llaveDeConteos(m))?.valor;
    let edad: number | null = null;
    if (crudo) {
      try {
        const en = Number(
          (JSON.parse(crudo) as { calculadoEn?: number }).calculadoEn,
        );
        if (Number.isFinite(en) && en > 0) edad = Date.now() - en;
      } catch {
        /* una fila ilegible cuenta como inexistente */
      }
    }
    minutos[m.codigo] = edad === null ? null : Math.round(edad / 60_000);
    if (edad === null || edad > CONTEOS_VIEJOS_MS) viejos.push(m.codigo);
  }
  return { minutos, viejos };
}
