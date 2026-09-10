import "server-only";

import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { BODEGA_MIAMI } from "@/lib/casillero/bodega";
import {
  resolverMatch,
  type Candidato,
  type ContextoMatch,
  type EntradaEscaneo,
} from "@/lib/casillero/matching";
import { pesoFacturableLb } from "@/lib/casillero/peso";
import { detectarCarrier, normalizarTracking } from "@/lib/casillero/tracking";
import { getDb } from "@/lib/db";
import {
  asignacionesPaquete,
  avisosEntrante,
  casilleros,
  contadoresCasillero,
  eventosPaquete,
  paquetesCasillero,
  prealertas,
} from "@/lib/db/schema";

/**
 * ══ RECIBIR UNA CAJA ══
 *
 * El operario escanea la guía y, si hay lector de etiquetas, pega el texto.
 * El sistema decide de quién es. Tres finales posibles:
 *
 * - **Se asigna solo** (prealerta, aviso del transportista o código leído).
 * - **Con candidatos** bajo el umbral: decide una persona.
 * - **Huérfano**: se recibe igual y va a la cola de excepciones.
 *
 * **Recibir NUNCA se bloquea.** Rechazar una caja que ya está en la puerta
 * cuesta devolución, reclamo y una reseña de una estrella. Se recibe, y
 * después se averigua de quién es.
 */
export type ResultadoRecepcion = {
  wr: string;
  paqueteId: string;
  asignado: boolean;
  codigo?: string;
  candidatos: Candidato[];
  automatico: boolean;
};

/** El número de recepción, correlativo y atómico. Ver `crear.ts`. */
async function siguienteWr(db: ReturnType<typeof getDb>): Promise<string> {
  await db
    .insert(contadoresCasillero)
    .values({ clave: "wr", valor: 88_000 })
    .onConflictDoNothing();
  const filas = await db.all<{ valor: number }>(
    sql`UPDATE contadores_casillero SET valor = valor + 1 WHERE clave = 'wr' RETURNING valor`,
  );
  const valor = Number(filas?.[0]?.valor);
  if (!Number.isFinite(valor))
    throw new Error("El contador de recepciones falló");
  return `WR-${valor}`;
}

/**
 * El contexto para decidir de quién es la caja.
 *
 * ══ NO SE TRAE EL CATÁLOGO ENTERO ══
 *
 * Con diez mil casilleros, cargarlos todos en cada escaneo es medio segundo
 * por caja y una bodega parada. Se acota a lo que puede cruzar: las
 * prealertas abiertas, los avisos recientes del transportista, y los
 * casilleros de esas prealertas más los que puedan salir del código leído.
 */
async function contextoPara(entrada: EntradaEscaneo): Promise<ContextoMatch> {
  const db = getDb();
  const abiertas = await db
    .select({
      id: prealertas.id,
      casilleroId: prealertas.casilleroId,
      tracking: prealertas.tracking,
      comercio: prealertas.comercio,
    })
    .from(prealertas)
    .where(eq(prealertas.estado, "abierta"))
    .limit(500)
    .catch(() => []);

  const inbounds = entrada.tracking
    ? await db
        .select({
          tracking: avisosEntrante.tracking,
          casilleroId: avisosEntrante.casilleroId,
          remitente: avisosEntrante.remitente,
        })
        .from(avisosEntrante)
        .where(
          eq(avisosEntrante.tracking, normalizarTracking(entrada.tracking)),
        )
        .limit(20)
        .catch(() => [])
    : [];

  /* Los casilleros que pueden ser: los de las prealertas abiertas, y los
     activos recientes para poder sugerir por nombre. */
  const ids = [...new Set(abiertas.map((p) => p.casilleroId))];
  const deLasPrealertas = ids.length
    ? await db
        .select({
          id: casilleros.id,
          codigo: casilleros.codigo,
          clienteId: casilleros.usuarioId,
          nombreLegal: casilleros.nombreLegal,
          estado: casilleros.estado,
        })
        .from(casilleros)
        .where(inArray(casilleros.id, ids))
        .catch(() => [])
    : [];

  const recientes = await db
    .select({
      id: casilleros.id,
      codigo: casilleros.codigo,
      clienteId: casilleros.usuarioId,
      nombreLegal: casilleros.nombreLegal,
      estado: casilleros.estado,
    })
    .from(casilleros)
    .limit(2_000)
    .catch(() => []);

  const porId = new Map(
    [...deLasPrealertas, ...recientes].map((c) => [
      c.id,
      {
        id: c.id,
        codigo: c.codigo,
        clienteId: c.clienteId,
        nombreLegal: c.nombreLegal,
        suspendido: c.estado !== "activo",
      },
    ]),
  );

  return {
    casilleros: [...porId.values()],
    prealertas: abiertas,
    inbounds,
  };
}

export type DatosRecepcion = {
  tracking?: string | null;
  textoOcr?: string | null;
  remitente?: string | null;
  pesoLb?: number | null;
  largoIn?: number | null;
  anchoIn?: number | null;
  altoIn?: number | null;
  ubicacion?: string | null;
  condicion?: string | null;
  recibidoPor?: string | null;
};

export async function recibirPaquete(
  datos: DatosRecepcion,
): Promise<ResultadoRecepcion> {
  const db = getDb();
  const ahora = new Date();
  const entrada: EntradaEscaneo = {
    tracking: datos.tracking ?? null,
    textoOcr: datos.textoOcr ?? null,
    remitente: datos.remitente ?? null,
  };

  const ctx = await contextoPara(entrada);
  const match = resolverMatch(entrada, ctx);

  const wr = await siguienteWr(db);
  const paqueteId = nanoid();
  const asignar = match.automatico && match.mejor ? match.mejor : null;

  const medidas =
    datos.largoIn && datos.anchoIn && datos.altoIn
      ? {
          largoIn: datos.largoIn,
          anchoIn: datos.anchoIn,
          altoIn: datos.altoIn,
        }
      : null;
  const facturable = pesoFacturableLb(datos.pesoLb ?? 0, medidas, {
    modo: "decima",
  });

  const tracking = datos.tracking ? normalizarTracking(datos.tracking) : null;

  await db.insert(paquetesCasillero).values({
    id: paqueteId,
    wr,
    bodegaId: BODEGA_MIAMI.id,
    casilleroId: asignar?.casilleroId ?? null,
    prealertaId: asignar?.prealertaId ?? null,
    tracking,
    carrier: tracking ? detectarCarrier(tracking) : null,
    remitente: datos.remitente ?? null,
    pesoLb: datos.pesoLb ?? null,
    largoIn: datos.largoIn ?? null,
    anchoIn: datos.anchoIn ?? null,
    altoIn: datos.altoIn ?? null,
    pesoFacturableLb: facturable,
    ubicacion: datos.ubicacion ?? null,
    /* Sin dueño es HUÉRFANO, y eso es un estado de verdad y no un hueco:
       la cola de excepciones se lee filtrando por él. */
    estado: asignar ? "asignado" : "huerfano",
    condicion: datos.condicion ?? null,
    textoOcr: datos.textoOcr ?? null,
    recibidoEn: ahora,
    recibidoPor: datos.recibidoPor ?? null,
  });

  await db.insert(eventosPaquete).values({
    id: nanoid(),
    paqueteId,
    tipo: "recibido",
    detalle: JSON.stringify({ wr, tracking, facturable }),
    visibleCliente: true,
    usuarioId: datos.recibidoPor ?? null,
    creadoEn: ahora,
  });

  if (asignar) {
    await db.insert(asignacionesPaquete).values({
      id: nanoid(),
      paqueteId,
      casilleroId: asignar.casilleroId,
      metodo: asignar.metodo,
      score: asignar.score,
      automatico: true,
      motivo: asignar.motivo,
      usuarioId: datos.recibidoPor ?? null,
      creadoEn: ahora,
    });
    if (asignar.prealertaId) {
      await db
        .update(prealertas)
        .set({ estado: "cumplida" })
        .where(eq(prealertas.id, asignar.prealertaId))
        .catch(() => undefined);
    }
  }

  return {
    wr,
    paqueteId,
    asignado: Boolean(asignar),
    codigo: asignar?.codigo,
    candidatos: match.candidatos,
    automatico: match.automatico,
  };
}

/** Los paquetes sin dueño, del más viejo al más nuevo: los que urgen. */
export async function huerfanos(limite = 100) {
  return getDb()
    .select({
      id: paquetesCasillero.id,
      wr: paquetesCasillero.wr,
      tracking: paquetesCasillero.tracking,
      remitente: paquetesCasillero.remitente,
      pesoLb: paquetesCasillero.pesoLb,
      recibidoEn: paquetesCasillero.recibidoEn,
    })
    .from(paquetesCasillero)
    .where(isNull(paquetesCasillero.casilleroId))
    .orderBy(paquetesCasillero.recibidoEn)
    .limit(limite)
    .catch(() => []);
}

/** Lo recibido hoy, para el tablero de la bodega. */
export async function recibidosHoy() {
  const desde = new Date(Date.now() - 86_400_000);
  const [f] = await getDb()
    .select({
      total: sql<number>`count(*)`,
      solos: sql<number>`sum(case when ${paquetesCasillero.casilleroId} is not null then 1 else 0 end)`,
    })
    .from(paquetesCasillero)
    .where(and(gte(paquetesCasillero.recibidoEn, desde)));
  const total = Number(f?.total ?? 0);
  const solos = Number(f?.solos ?? 0);
  return {
    total,
    solos,
    /* El porcentaje de auto-asignación es LA métrica que dice si el sistema
       funciona: si baja, alguien está trabajando a mano lo que debería
       resolverse solo. */
    porcentaje: total > 0 ? Math.round((solos / total) * 100) : 0,
  };
}
