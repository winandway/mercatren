import "server-only";

import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { cjConfigurado } from "@/lib/cj/cliente";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import { idDeDepartamento } from "@/lib/cj/departamento";
import {
  fuenteDeCj,
  slugDe,
  tiendaDelRubro,
  tiendaGeneralDePlaza,
  tiendaMayorista,
} from "@/lib/cj/guardar";
import { filasDeCj, type RespuestaLista } from "@/lib/cj/lista";
import * as reglas from "@/lib/cj/masivo";
import { vaAlMayorista } from "@/lib/cj/mayorista";
import { plazaDelMercado, type Plaza } from "@/lib/cj/plazas";
import { llamarCjConRitmo } from "@/lib/cj/ritmo";
import { TIENDA_US_GENERAL } from "@/lib/cj/rubros";
import { getDb, type Db } from "@/lib/db";
import {
  enviosProducto,
  imagenesProducto,
  importacionesCj,
  productos,
  tandasImportacionCj,
  tiendas,
} from "@/lib/db/schema";
import { precioPublicadoDe } from "@/lib/destino/precio-plaza";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { tasaVigente } from "@/lib/mercado/tasas";
import { faltaTraducir } from "@/lib/traduccion/reglas";

/**
 * TRAER EL ALMACÉN COMPLETO DE CJ: LA PARTE QUE HABLA CON CJ Y CON LA BASE.
 *
 * Las reglas (qué es una ficha, cómo se estima el envío, cuándo se parte una
 * categoría) viven en `masivo.ts`, puro y probado. Aquí solo se ejecutan.
 *
 * ══ CÓMO AVANZA ══
 *
 * Un trabajo (`importaciones_cj`) tiene tandas (`tandas_importacion_cj`).
 * Quien tenga tiempo —el panel con su navegador abierto, o el reloj de
 * `/datos/sincronizar` cada 15 minutos— RECLAMA una tanda, le pide páginas a
 * CJ hasta agotar su presupuesto de tiempo, guarda lo que trajo y la suelta
 * (o la marca hecha). Dos trabajadores nunca procesan la misma página: el
 * reclamo es un UPDATE condicionado.
 *
 * ══ LO QUE SE PUBLICA Y CON QUÉ PRECIO ══
 *
 * Precio real de CJ + envío ESTIMADO por departamento (percentil 70 de las
 * cotizaciones reales de esa plaza; sin muestras, el respaldo de la plaza —
 * nunca cero). La fila de envío queda marcada `estimado`, que es lo que el
 * afinado (`afinar.ts`) va corrigiendo por detrás con el flete de verdad.
 *
 * Un producto que YA existía en la plaza no se duplica: se le refresca el
 * costo, el stock y la descripción, y si su envío ya era COTIZADO se respeta
 * — un estimado nunca pisa una cotización real.
 */

export type EstadoImportacion = {
  id: string;
  mercado: string;
  almacen: string;
  estado: "en_curso" | "pausada" | "terminada";
  stockMinimo: number;
  soloVerificado: boolean;
  tope: number;
  agregados: number;
  actualizados: number;
  saltados: number;
  fallidos: number;
  tandasTotal: number;
  tandasHechas: number;
  ultimoError: string | null;
  creadoEn: number;
  actualizadoEn: number;
  terminadoEn: number | null;
};

type Contexto = {
  importacionId: string;
  plaza: Plaza;
  tasa: number | null;
  tabla: reglas.TablaDeEstimados;
  propietarioId: string;
  stockMinimo: number;
  soloVerificado: boolean;
  tope: number;
  /** Tienda por departamento, resuelta una vez por corrida. */
  tiendasPorDepartamento: Map<string, string>;
  tiendaMayoristaId: string | null;
};

const COLUMNAS_ESTADO = {
  id: importacionesCj.id,
  mercado: importacionesCj.mercado,
  almacen: importacionesCj.almacen,
  estado: importacionesCj.estado,
  propietarioId: importacionesCj.propietarioId,
  stockMinimo: importacionesCj.stockMinimo,
  soloVerificado: importacionesCj.soloVerificado,
  tope: importacionesCj.tope,
  agregados: importacionesCj.agregados,
  actualizados: importacionesCj.actualizados,
  saltados: importacionesCj.saltados,
  fallidos: importacionesCj.fallidos,
  ultimoError: importacionesCj.ultimoError,
  creadoEn: importacionesCj.creadoEn,
  actualizadoEn: importacionesCj.actualizadoEn,
  terminadoEn: importacionesCj.terminadoEn,
};

async function leerFila(db: Db, id: string) {
  const [fila] = await db
    .select(COLUMNAS_ESTADO)
    .from(importacionesCj)
    .where(eq(importacionesCj.id, id))
    .limit(1);
  return fila ?? null;
}

async function leerEstado(
  db: Db,
  id: string,
): Promise<EstadoImportacion | null> {
  const fila = await leerFila(db, id);
  if (!fila) return null;
  const [conteo] = await db
    .select({
      total: sql<number>`sum(case when ${tandasImportacionCj.estado} != 'partida' then 1 else 0 end)`,
      hechas: sql<number>`sum(case when ${tandasImportacionCj.estado} in ('hecha', 'con_error') then 1 else 0 end)`,
    })
    .from(tandasImportacionCj)
    .where(eq(tandasImportacionCj.importacionId, id));
  return {
    id: fila.id,
    mercado: fila.mercado,
    almacen: fila.almacen,
    estado: fila.estado,
    stockMinimo: fila.stockMinimo,
    soloVerificado: Boolean(fila.soloVerificado),
    tope: fila.tope,
    agregados: fila.agregados,
    actualizados: fila.actualizados,
    saltados: fila.saltados,
    fallidos: fila.fallidos,
    tandasTotal: Number(conteo?.total ?? 0),
    tandasHechas: Number(conteo?.hechas ?? 0),
    ultimoError: fila.ultimoError,
    creadoEn: fila.creadoEn.getTime(),
    actualizadoEn: fila.actualizadoEn.getTime(),
    terminadoEn: fila.terminadoEn?.getTime() ?? null,
  };
}

/** La última importación de una plaza, viva o terminada, para el panel. */
export async function estadoDeImportacionDe(
  plaza: Plaza,
): Promise<EstadoImportacion | null> {
  const db = getDb();
  const [fila] = await db
    .select({ id: importacionesCj.id })
    .from(importacionesCj)
    .where(eq(importacionesCj.mercado, plaza.mercado))
    .orderBy(desc(importacionesCj.creadoEn))
    .limit(1)
    .catch(() => []);
  return fila ? leerEstado(db, fila.id) : null;
}

/**
 * La tabla de envíos estimados de la plaza, sacada de lo que CJ ya cotizó de
 * verdad para productos de esa misma plaza. Se arma en cada corrida: son
 * unas pocas miles de filas y así cada vuelta del afinado la mejora.
 */
async function tablaDeEstimadosDe(
  db: Db,
  plaza: Plaza,
): Promise<reglas.TablaDeEstimados> {
  const filas = await db
    .select({
      categoriaId: productos.categoriaId,
      costoCentavos: enviosProducto.costoCentavos,
    })
    .from(enviosProducto)
    .innerJoin(productos, eq(productos.id, enviosProducto.productoId))
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(
        eq(tiendas.paisOrigen, plaza.paisEntrega),
        eq(productos.fuenteId, FUENTE_CJ),
        eq(enviosProducto.origen, "cotizado"),
      ),
    )
    .catch(() => []);
  return reglas.tablaDeEstimados(filas);
}

/** Cuántas cotizaciones reales respaldan hoy el estimado de la plaza. */
export async function muestrasDeEnvioDe(plaza: Plaza): Promise<number> {
  return (await tablaDeEstimadosDe(getDb(), plaza)).muestras;
}

/* ═══════════════════════ Arrancar ═══════════════════════ */

export async function arrancarImportacion(o: {
  plaza: Plaza;
  propietarioId: string;
  stockMinimo: number;
  soloVerificado: boolean;
  tope: number;
}): Promise<
  { ok: true; estado: EstadoImportacion } | { ok: false; motivo: string }
> {
  if (!cjConfigurado()) {
    return {
      ok: false,
      motivo: "Falta la variable CJ_API_KEY en el panel del sitio.",
    };
  }
  const db = getDb();
  const { plaza } = o;

  /* Una viva por plaza: dos a la vez sobre el mismo almacén se pisarían y
     el conteo dejaría de decir la verdad. */
  const [viva] = await db
    .select({ id: importacionesCj.id, estado: importacionesCj.estado })
    .from(importacionesCj)
    .where(
      and(
        eq(importacionesCj.mercado, plaza.mercado),
        inArray(importacionesCj.estado, ["en_curso", "pausada"]),
      ),
    )
    .limit(1);
  if (viva) {
    return {
      ok: false,
      motivo:
        viva.estado === "pausada"
          ? "Hay una importación en pausa para esta plaza: retómala en vez de empezar otra."
          : "Ya hay una importación en marcha para esta plaza.",
    };
  }

  if (plaza.mercado !== "US" && (await tasaVigente(plaza.mercado)) === null) {
    return {
      ok: false,
      motivo: `Falta la tasa del dólar de ${plaza.mercado === "CL" ? "Chile" : "Colombia"}: cárgala en Configuración → La tasa del dólar.`,
    };
  }

  /* La tienda general y la fuente `cj` tienen que existir antes del primer
     producto: `productos.fuente_id` es llave foránea. */
  await tiendaGeneralDePlaza(plaza, o.propietarioId);
  await fuenteDeCj(TIENDA_US_GENERAL);

  /* ══ LA SONDA: ¿cuántos hay con estos filtros? ══
     Si CJ dice menos de 6.000, una sola tanda recorre el almacén entero. Si
     dice 6.000 (su tope), hay que ir categoría por categoría. Y si dice
     cero, se avisa AQUÍ, antes de crear nada: un trabajo vacío que «termina
     bien» haría creer que el almacén no tiene nada. */
  const sonda = await llamarCjConRitmo<RespuestaLista>(
    `/product/listV2?${reglas.parametrosDeLista({
      almacen: plaza.almacen,
      pagina: 1,
      categoriaId: null,
      desdeCentavos: null,
      hastaCentavos: null,
      stockMinimo: o.stockMinimo,
      soloVerificado: o.soloVerificado,
      conExtras: false,
    })}`,
  );
  if (!sonda.ok) {
    return { ok: false, motivo: `CJ no contestó el listado: ${sonda.motivo}` };
  }
  const total = sonda.datos?.totalRecords ?? null;
  if (filasDeCj(sonda.datos).length === 0) {
    return {
      ok: false,
      motivo: `CJ no devolvió ningún producto del almacén ${plaza.almacen} con esos filtros (stock ≥ ${o.stockMinimo}${o.soloVerificado ? ", solo inventario verificado" : ""}). Prueba bajando el stock mínimo o quitando el filtro de verificado.`,
    };
  }

  let tandas: Array<{ categoriaId: string | null; nombre: string | null }>;
  if (!reglas.estaTopada(total)) {
    tandas = [{ categoriaId: null, nombre: null }];
  } else {
    const arbol = await llamarCjConRitmo<unknown>("/product/getCategory");
    if (!arbol.ok) {
      return {
        ok: false,
        motivo: `CJ no dio el árbol de categorías: ${arbol.motivo}`,
      };
    }
    const categorias = reglas.aplanarCategorias(arbol.datos);
    if (categorias.length === 0) {
      return { ok: false, motivo: "CJ contestó el árbol de categorías vacío." };
    }
    tandas = categorias.map((c) => ({ categoriaId: c.id, nombre: c.nombre }));
  }

  const id = `imp-${nanoid(10)}`;
  const ahora = new Date();
  await db.insert(importacionesCj).values({
    id,
    mercado: plaza.mercado,
    almacen: plaza.almacen,
    estado: "en_curso",
    propietarioId: o.propietarioId,
    stockMinimo: o.stockMinimo,
    soloVerificado: o.soloVerificado,
    tope: o.tope,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  /* De a 20 filas por sentencia: D1 admite 100 parámetros por consulta. */
  for (let i = 0; i < tandas.length; i += 20) {
    await db.insert(tandasImportacionCj).values(
      tandas.slice(i, i + 20).map((t) => ({
        id: `tanda-${nanoid(10)}`,
        importacionId: id,
        categoriaId: t.categoriaId,
        categoriaNombre: t.nombre,
        estado: "pendiente" as const,
      })),
    );
  }

  const estado = await leerEstado(db, id);
  return estado
    ? { ok: true, estado }
    : { ok: false, motivo: "La importación se creó pero no se pudo leer." };
}

/* ═══════════════════════ Avanzar ═══════════════════════ */

/**
 * Trabaja sobre una importación durante `presupuestoMs` y devuelve cómo va.
 * Se puede llamar desde el panel (cada pocos segundos) y desde el reloj a
 * la vez: el reclamo de tandas evita que se pisen.
 */
export async function avanzarImportacion(
  id: string,
  presupuestoMs: number,
): Promise<EstadoImportacion | null> {
  const db = getDb();
  const arranque = Date.now();
  const hasta = arranque + presupuestoMs;

  const fila = await leerFila(db, id);
  if (!fila) return null;
  if (fila.estado !== "en_curso" || !cjConfigurado()) return leerEstado(db, id);

  const plaza = plazaDelMercado(mercadoPorCodigo(fila.mercado));
  const tasa = plaza.mercado === "US" ? null : await tasaVigente(plaza.mercado);
  if (plaza.mercado !== "US" && tasa === null) {
    await anotarError(
      db,
      id,
      "Falta la tasa del dólar de la plaza; se reintenta en la próxima vuelta.",
    );
    return leerEstado(db, id);
  }

  const ctx: Contexto = {
    importacionId: id,
    plaza,
    tasa,
    tabla: await tablaDeEstimadosDe(db, plaza),
    propietarioId: fila.propietarioId,
    stockMinimo: fila.stockMinimo,
    soloVerificado: Boolean(fila.soloVerificado),
    tope: fila.tope,
    tiendasPorDepartamento: new Map(),
    tiendaMayoristaId: null,
  };

  while (Date.now() < hasta) {
    const actual = await leerFila(db, id);
    if (!actual || actual.estado !== "en_curso") break;
    if (ctx.tope > 0 && actual.agregados >= ctx.tope) {
      await terminar(
        db,
        id,
        `Se alcanzó el tope de ${ctx.tope} productos nuevos.`,
      );
      break;
    }

    const tanda = await reclamarTanda(db, id);
    if (!tanda) {
      const [quedan] = await db
        .select({ n: sql<number>`count(*)` })
        .from(tandasImportacionCj)
        .where(
          and(
            eq(tandasImportacionCj.importacionId, id),
            inArray(tandasImportacionCj.estado, ["pendiente", "en_curso"]),
          ),
        );
      if (Number(quedan?.n ?? 0) === 0) await terminar(db, id);
      break;
    }

    try {
      await procesarTanda(db, tanda, ctx, hasta);
    } catch (fallo) {
      const motivo = fallo instanceof Error ? fallo.message : String(fallo);
      console.error("[cj-masivo] la tanda falló", tanda.id, fallo);
      await db
        .update(tandasImportacionCj)
        .set({ estado: "con_error", ultimoError: motivo.slice(0, 500) })
        .where(eq(tandasImportacionCj.id, tanda.id));
      await db
        .update(importacionesCj)
        .set({
          fallidos: sql`${importacionesCj.fallidos} + 1`,
          ultimoError: motivo.slice(0, 500),
          actualizadoEn: new Date(),
        })
        .where(eq(importacionesCj.id, id));
    }
  }

  return leerEstado(db, id);
}

/** Las importaciones en curso de TODAS las plazas, para el reloj. */
export async function avanzarImportacionesEnCurso(
  presupuestoMs: number,
): Promise<
  Array<{
    id: string;
    mercado: string;
    agregados: number;
    tandasHechas: number;
    tandasTotal: number;
    estado: string;
  }>
> {
  const db = getDb();
  const vivas = await db
    .select({ id: importacionesCj.id })
    .from(importacionesCj)
    .where(eq(importacionesCj.estado, "en_curso"))
    .catch(() => []);
  const arranque = Date.now();
  const salida = [];
  for (const v of vivas) {
    const restante = presupuestoMs - (Date.now() - arranque);
    if (restante < 5_000) break;
    const e = await avanzarImportacion(v.id, restante);
    if (e) {
      salida.push({
        id: e.id,
        mercado: e.mercado,
        agregados: e.agregados,
        tandasHechas: e.tandasHechas,
        tandasTotal: e.tandasTotal,
        estado: e.estado,
      });
    }
  }
  return salida;
}

export async function pausarImportacion(
  id: string,
): Promise<EstadoImportacion | null> {
  const db = getDb();
  await db
    .update(importacionesCj)
    .set({ estado: "pausada", actualizadoEn: new Date() })
    .where(
      and(eq(importacionesCj.id, id), eq(importacionesCj.estado, "en_curso")),
    );
  return leerEstado(db, id);
}

export async function reanudarImportacion(
  id: string,
): Promise<EstadoImportacion | null> {
  const db = getDb();
  await db
    .update(importacionesCj)
    .set({ estado: "en_curso", actualizadoEn: new Date() })
    .where(
      and(eq(importacionesCj.id, id), eq(importacionesCj.estado, "pausada")),
    );
  return leerEstado(db, id);
}

/* ═══════════════════════ Por dentro ═══════════════════════ */

type Tanda = {
  id: string;
  categoriaId: string | null;
  categoriaNombre: string | null;
  desdeCentavos: number | null;
  hastaCentavos: number | null;
  pagina: number;
  totalPaginas: number | null;
};

/**
 * Reclama UNA tanda: pendiente, o en curso pero abandonada hace más de 10
 * minutos. El UPDATE lleva la misma condición que la búsqueda, así que si
 * otro trabajador la tomó un instante antes, aquí no se toma nada.
 */
async function reclamarTanda(
  db: Db,
  importacionId: string,
): Promise<Tanda | null> {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() - reglas.ABANDONO_MS);
  const disponible = or(
    eq(tandasImportacionCj.estado, "pendiente"),
    and(
      eq(tandasImportacionCj.estado, "en_curso"),
      or(
        isNull(tandasImportacionCj.tomadaEn),
        lt(tandasImportacionCj.tomadaEn, limite),
      ),
    ),
  );

  for (let intento = 0; intento < 3; intento++) {
    const [candidata] = await db
      .select({ id: tandasImportacionCj.id })
      .from(tandasImportacionCj)
      .where(
        and(eq(tandasImportacionCj.importacionId, importacionId), disponible),
      )
      /* Primero las que ya iban a medias: terminar lo empezado antes de
         abrir otra. */
      .orderBy(
        desc(sql`${tandasImportacionCj.pagina} > 0`),
        asc(tandasImportacionCj.id),
      )
      .limit(1);
    if (!candidata) return null;

    const tomadas = await db
      .update(tandasImportacionCj)
      .set({ estado: "en_curso", tomadaEn: ahora })
      .where(and(eq(tandasImportacionCj.id, candidata.id), disponible))
      .returning({
        id: tandasImportacionCj.id,
        categoriaId: tandasImportacionCj.categoriaId,
        categoriaNombre: tandasImportacionCj.categoriaNombre,
        desdeCentavos: tandasImportacionCj.desdeCentavos,
        hastaCentavos: tandasImportacionCj.hastaCentavos,
        pagina: tandasImportacionCj.pagina,
        totalPaginas: tandasImportacionCj.totalPaginas,
      });
    if (tomadas[0]) return tomadas[0];
  }
  return null;
}

async function procesarTanda(
  db: Db,
  tanda: Tanda,
  ctx: Contexto,
  hasta: number,
) {
  let pagina = tanda.pagina;
  let totalPaginas = tanda.totalPaginas;
  const categoria = tanda.categoriaNombre
    ? { niveles: reglas.nivelesDe(tanda.categoriaNombre) }
    : null;

  while (Date.now() < hasta) {
    const siguiente = pagina + 1;
    if (
      (totalPaginas !== null && siguiente > totalPaginas) ||
      siguiente > reglas.ULTIMA_PAGINA
    ) {
      await cerrarTanda(db, tanda.id, "hecha", { pagina, totalPaginas });
      return;
    }

    const consulta = {
      almacen: ctx.plaza.almacen,
      pagina: siguiente,
      categoriaId: tanda.categoriaId,
      desdeCentavos: tanda.desdeCentavos,
      hastaCentavos: tanda.hastaCentavos,
      stockMinimo: ctx.stockMinimo,
      soloVerificado: ctx.soloVerificado,
    };
    /* Con las extras (descripción y categorías dentro del listado). Si CJ
       rechazara ese parámetro, se repite la página sin él: perder la
       descripción es mejor que perder la página. */
    let r = await llamarCjConRitmo<RespuestaLista>(
      `/product/listV2?${reglas.parametrosDeLista({ ...consulta, conExtras: true })}`,
    );
    if (!r.ok && !/too many requests|qps/i.test(r.motivo)) {
      r = await llamarCjConRitmo<RespuestaLista>(
        `/product/listV2?${reglas.parametrosDeLista({ ...consulta, conExtras: false })}`,
      );
    }
    if (!r.ok) throw new Error(`CJ (página ${siguiente}): ${r.motivo}`);

    const total = r.datos?.totalRecords ?? null;
    if (typeof r.datos?.totalPages === "number")
      totalPaginas = r.datos.totalPages;

    /* Topada en su primera página: se parte en bandas de precio y esta tanda
       se retira. Una banda que también esté topada sigue hasta donde CJ
       deje, y queda anotado. */
    if (siguiente === 1 && reglas.estaTopada(total)) {
      const bandas = reglas.bandasPara(tanda);
      if (bandas) {
        await db.insert(tandasImportacionCj).values(
          bandas.map((b) => ({
            id: `tanda-${nanoid(10)}`,
            importacionId: ctx.importacionId,
            categoriaId: tanda.categoriaId,
            categoriaNombre: tanda.categoriaNombre,
            desdeCentavos: b.desdeCentavos,
            hastaCentavos: b.hastaCentavos,
            estado: "pendiente" as const,
          })),
        );
        await cerrarTanda(db, tanda.id, "partida", {
          pagina: 0,
          totalPaginas,
          totalRegistros: total,
        });
        return;
      }
      await db
        .update(tandasImportacionCj)
        .set({
          ultimoError: `CJ solo deja ver ${reglas.TOPE_POR_CONSULTA} de esta banda; el resto no entra.`,
        })
        .where(eq(tandasImportacionCj.id, tanda.id));
    }

    const filas = filasDeCj(r.datos);
    const fichas = filas
      .map((f) => reglas.fichaDesdeFila(f as reglas.FilaMasiva, categoria))
      .filter((f): f is reglas.FichaMasiva => f !== null);
    const cuenta = await guardarFichas(db, fichas, ctx);
    cuenta.saltados += filas.length - fichas.length;

    pagina = siguiente;
    const terminada =
      filas.length < reglas.POR_PAGINA ||
      (totalPaginas !== null && pagina >= totalPaginas);

    await db.batch([
      db
        .update(tandasImportacionCj)
        .set({
          pagina,
          totalPaginas,
          totalRegistros: total,
          agregados: sql`${tandasImportacionCj.agregados} + ${cuenta.agregados}`,
          actualizados: sql`${tandasImportacionCj.actualizados} + ${cuenta.actualizados}`,
          saltados: sql`${tandasImportacionCj.saltados} + ${cuenta.saltados}`,
          estado: terminada ? "hecha" : "en_curso",
          tomadaEn: new Date(),
        })
        .where(eq(tandasImportacionCj.id, tanda.id)),
      db
        .update(importacionesCj)
        .set({
          agregados: sql`${importacionesCj.agregados} + ${cuenta.agregados}`,
          actualizados: sql`${importacionesCj.actualizados} + ${cuenta.actualizados}`,
          saltados: sql`${importacionesCj.saltados} + ${cuenta.saltados}`,
          fallidos: sql`${importacionesCj.fallidos} + ${cuenta.fallidos}`,
          actualizadoEn: new Date(),
        })
        .where(eq(importacionesCj.id, ctx.importacionId)),
    ]);

    if (terminada) return;
    if (ctx.tope > 0) {
      const actual = await leerFila(db, ctx.importacionId);
      if (actual && actual.agregados >= ctx.tope) break;
    }
  }

  /* Se acabó el tiempo a mitad: se SUELTA (vuelve a pendiente con su página
     guardada) para que el próximo trabajador —este mismo, en un segundo— la
     pueda seguir sin esperar los 10 minutos del abandono. */
  await db
    .update(tandasImportacionCj)
    .set({ estado: "pendiente", tomadaEn: null })
    .where(
      and(
        eq(tandasImportacionCj.id, tanda.id),
        eq(tandasImportacionCj.estado, "en_curso"),
      ),
    );
}

async function cerrarTanda(
  db: Db,
  id: string,
  estado: "hecha" | "partida",
  datos: {
    pagina: number;
    totalPaginas: number | null;
    totalRegistros?: number | null;
  },
) {
  await db
    .update(tandasImportacionCj)
    .set({ estado, tomadaEn: new Date(), ...datos })
    .where(eq(tandasImportacionCj.id, id));
  if (estado === "hecha" || estado === "partida") {
    await db
      .update(importacionesCj)
      .set({ actualizadoEn: new Date() })
      .where(
        eq(
          importacionesCj.id,
          (
            await db
              .select({ i: tandasImportacionCj.importacionId })
              .from(tandasImportacionCj)
              .where(eq(tandasImportacionCj.id, id))
              .limit(1)
          )[0]?.i ?? "",
        ),
      );
  }
}

async function terminar(db: Db, id: string, nota?: string) {
  const ahora = new Date();
  await db
    .update(importacionesCj)
    .set({
      estado: "terminada",
      terminadoEn: ahora,
      actualizadoEn: ahora,
      ...(nota ? { ultimoError: nota } : {}),
    })
    .where(eq(importacionesCj.id, id));
}

async function anotarError(db: Db, id: string, motivo: string) {
  await db
    .update(importacionesCj)
    .set({ ultimoError: motivo.slice(0, 500), actualizadoEn: new Date() })
    .where(eq(importacionesCj.id, id));
}

async function tiendaPara(
  ctx: Contexto,
  ficha: reglas.FichaMasiva,
  margenUsd: number | null,
) {
  if (margenUsd !== null && vaAlMayorista(margenUsd)) {
    ctx.tiendaMayoristaId ??= await tiendaMayorista(ctx.propietarioId);
    return ctx.tiendaMayoristaId;
  }
  const llave = ficha.departamento ?? "";
  const conocida = ctx.tiendasPorDepartamento.get(llave);
  if (conocida) return conocida;
  const id = await tiendaDelRubro(
    ficha.departamento,
    ctx.propietarioId,
    ctx.plaza,
  );
  ctx.tiendasPorDepartamento.set(llave, id);
  return id;
}

/**
 * Guarda una página de fichas. Lo que ya está en la plaza se refresca; lo
 * nuevo se publica con envío estimado. Una ficha que falla no detiene a las
 * demás: se cuenta y se sigue.
 */
async function guardarFichas(
  db: Db,
  fichas: reglas.FichaMasiva[],
  ctx: Contexto,
): Promise<{
  agregados: number;
  actualizados: number;
  saltados: number;
  fallidos: number;
}> {
  const cuenta = { agregados: 0, actualizados: 0, saltados: 0, fallidos: 0 };
  if (fichas.length === 0) return cuenta;

  /* ¿Cuáles ya están en esta plaza? Por externo, en cualquiera de sus
     tiendas (rubro, general o mayorista). De a 50: D1 admite 100 parámetros. */
  const previos = new Map<
    string,
    {
      id: string;
      tituloEs: string;
      tituloEn: string | null;
      descripcionEn: string | null;
      envioOrigen: string | null;
      envioCentavos: number | null;
    }
  >();
  const ids = fichas.map((f) => f.externoId);
  for (let i = 0; i < ids.length; i += 50) {
    const filas = await db
      .select({
        id: productos.id,
        externoId: productos.externoId,
        tituloEs: productos.tituloEs,
        tituloEn: productos.tituloEn,
        descripcionEn: productos.descripcionEn,
        envioOrigen: enviosProducto.origen,
        envioCentavos: enviosProducto.costoCentavos,
      })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
      .where(
        and(
          eq(productos.fuenteId, FUENTE_CJ),
          eq(tiendas.paisOrigen, ctx.plaza.paisEntrega),
          inArray(productos.externoId, ids.slice(i, i + 50)),
        ),
      );
    for (const f of filas) if (f.externoId) previos.set(f.externoId, f);
  }

  const ahora = new Date();

  for (const ficha of fichas) {
    try {
      if (!reglas.pasaElFiltro(ficha, ctx.stockMinimo)) {
        cuenta.saltados += 1;
        continue;
      }
      const previo = previos.get(ficha.externoId);
      const categoriaId = idDeDepartamento(ficha.departamento);

      /* Un estimado NUNCA pisa una cotización real. */
      const envio =
        previo?.envioOrigen === "cotizado" && (previo.envioCentavos ?? 0) > 0
          ? previo.envioCentavos!
          : reglas.envioEstimadoPara(
              categoriaId,
              ctx.tabla,
              ctx.plaza.envioEstimadoUsdCentavos,
            );

      const precio = precioPublicadoDe(
        ctx.plaza,
        ficha.costoCentavos,
        envio,
        ctx.tasa,
      );
      if (!precio.ok) {
        /* Sobre el tope de Chile, o sin poder calcular: no se publica. */
        cuenta.saltados += 1;
        continue;
      }

      if (previo) {
        const sinTraducir = faltaTraducir({
          tituloEs: previo.tituloEs,
          tituloEn: previo.tituloEn,
        });
        await db
          .update(productos)
          .set({
            precioCentavos: precio.publicadoCentavos,
            precioBaseCentavos: ficha.costoCentavos,
            ...(ficha.existencias !== null
              ? {
                  existencias: ficha.existencias,
                  controlaExistencias: true,
                  sincronizadoEn: ahora,
                }
              : {}),
            ...(sinTraducir
              ? { tituloEs: ficha.nombre, tituloEn: ficha.nombre }
              : {}),
            ...(!previo.descripcionEn?.trim() && ficha.descripcion
              ? { descripcionEn: ficha.descripcion }
              : {}),
            ...(categoriaId ? { categoriaId } : {}),
            actualizadoEn: ahora,
          })
          .where(eq(productos.id, previo.id));
        cuenta.actualizados += 1;
        continue;
      }

      const tiendaId = await tiendaPara(ctx, ficha, precio.margenUsdCentavos);
      const id = `prod-${nanoid(12)}`;
      const lote = [
        db.insert(productos).values({
          id,
          tiendaId,
          slug: slugDe(ficha.nombre, ficha.externoId),
          sku: ficha.sku,
          /* El título en inglés en los dos campos, como el botón de a uno:
             el traductor lo pasa a español por detrás. No se inventa. */
          tituloEs: ficha.nombre,
          tituloEn: ficha.nombre,
          descripcionEn: ficha.descripcion,
          precioCentavos: precio.publicadoCentavos,
          precioBaseCentavos: ficha.costoCentavos,
          moneda: ctx.plaza.moneda,
          existencias: ficha.existencias ?? 0,
          /* Sin dato de stock no se dibuja el contador: un cero inventado
             sería «agotado» para el comprador. El reloj lo pregunta después. */
          controlaExistencias: ficha.existencias !== null,
          categoriaId,
          estado: "publicado" as const,
          fuenteId: FUENTE_CJ,
          externoId: ficha.externoId,
          sincronizadoEn: ficha.existencias !== null ? ahora : null,
          creadoEn: ahora,
          actualizadoEn: ahora,
        }),
        db.insert(enviosProducto).values({
          productoId: id,
          costoCentavos: envio,
          origen: "estimado",
          transporte: null,
          cotizadoEn: ahora,
        }),
        ...(ficha.imagen
          ? [
              db.insert(imagenesProducto).values({
                id: `img-${nanoid(12)}`,
                productoId: id,
                url: ficha.imagen,
                orden: 0,
              }),
            ]
          : []),
      ];
      await db.batch(lote as unknown as Parameters<Db["batch"]>[0]);
      previos.set(ficha.externoId, {
        id,
        tituloEs: ficha.nombre,
        tituloEn: ficha.nombre,
        descripcionEn: ficha.descripcion,
        envioOrigen: "estimado",
        envioCentavos: envio,
      });
      cuenta.agregados += 1;
    } catch (fallo) {
      console.error("[cj-masivo] no se pudo guardar", ficha.externoId, fallo);
      cuenta.fallidos += 1;
    }
  }
  return cuenta;
}
