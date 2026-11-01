import "server-only";

import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { adjuntosAyuda, casosAyuda, mensajesAyuda } from "@/lib/db/schema";
import {
  type AdjuntoParaGerente,
  MAX_CASOS_POR_HORA,
  nuevoCodigo,
  numeroDeCaso,
  ticketParaGerente,
} from "@/lib/soporte/casos";

/**
 * Los casos de ayuda contra la base (1 nov 2026). Las reglas puras están en
 * `casos.ts`; aquí solo el ir y venir. Ver la tabla en `db/schema.ts`.
 */

export type CasoNuevo = {
  usuarioId: string | null;
  nombre: string;
  email: string;
  idioma: string;
  asunto: string;
  mensaje: string;
};

/** ¿Esta persona ya abrió demasiados casos en la última hora? */
export async function demasiadosCasos(email: string): Promise<boolean> {
  const haceUnaHora = new Date(Date.now() - 60 * 60_000);
  const [fila] = await getDb()
    .select({ n: sql<number>`COUNT(*)` })
    .from(casosAyuda)
    .where(
      and(eq(casosAyuda.email, email), gte(casosAyuda.creadoEn, haceUnaHora)),
    );
  return Number(fila?.n ?? 0) >= MAX_CASOS_POR_HORA;
}

export async function crearCaso(d: CasoNuevo) {
  const db = getDb();
  const id = crypto.randomUUID();
  const codigo = nuevoCodigo();
  const ahora = new Date();
  await db.batch([
    db.insert(casosAyuda).values({
      id,
      codigo,
      usuarioId: d.usuarioId,
      nombre: d.nombre,
      email: d.email,
      idioma: d.idioma === "en" ? "en" : "es",
      asunto: d.asunto,
      estado: "abierto",
      creadoEn: ahora,
      actualizadoEn: ahora,
    }),
    db.insert(mensajesAyuda).values({
      id: `ma-${nanoid(14)}`,
      casoId: id,
      autor: "cliente",
      texto: d.mensaje,
      creadoEn: ahora,
    }),
  ]);
  return { id, codigo, numero: numeroDeCaso(id) };
}

/**
 * Los enlaces FIRMADOS de unas capturas (`lib/media/firma.ts`): valen 8 días
 * y abren el archivo sin sesión. Sin llave de firma, no se da ninguno.
 */
async function enlacesDe(
  filas: { mensajeId: string; clave: string; nombre: string; tipo: string }[],
): Promise<Map<string, AdjuntoParaGerente[]>> {
  const porMensaje = new Map<string, AdjuntoParaGerente[]>();
  if (filas.length === 0) return porMensaje;
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { firmarRuta, secretoDeFirma } = await import("@/lib/media/firma");
  const { SITIO } = await import("@/lib/sitio");
  let env: Record<string, string | undefined> = {};
  try {
    env = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
  } catch {
    env = process.env as Record<string, string | undefined>;
  }
  const secreto = secretoDeFirma(env);
  if (!secreto) return porMensaje;
  for (const f of filas) {
    const url = `${SITIO.url}/media/${f.clave}?${await firmarRuta(f.clave, secreto)}`;
    const lista = porMensaje.get(f.mensajeId) ?? [];
    lista.push({ nombre: f.nombre, tipo: f.tipo, url });
    porMensaje.set(f.mensajeId, lista);
  }
  return porMensaje;
}

async function adjuntosDeCasos(casoIds: string[]) {
  if (casoIds.length === 0) return new Map<string, AdjuntoParaGerente[]>();
  const filas = await getDb()
    .select({
      mensajeId: adjuntosAyuda.mensajeId,
      clave: adjuntosAyuda.clave,
      nombre: adjuntosAyuda.nombre,
      tipo: adjuntosAyuda.tipo,
    })
    .from(adjuntosAyuda)
    .where(inArray(adjuntosAyuda.casoId, casoIds))
    .orderBy(asc(adjuntosAyuda.creadoEn));
  return enlacesDe(filas);
}

/** Un caso por la llave de su chat, con sus mensajes. */
export async function casoPorCodigo(codigo: string) {
  const db = getDb();
  const [caso] = await db
    .select({
      id: casosAyuda.id,
      asunto: casosAyuda.asunto,
      estado: casosAyuda.estado,
      nombre: casosAyuda.nombre,
      idioma: casosAyuda.idioma,
      creadoEn: casosAyuda.creadoEn,
    })
    .from(casosAyuda)
    .where(eq(casosAyuda.codigo, codigo))
    .limit(1);
  if (!caso) return null;
  const mensajes = await db
    .select({
      id: mensajesAyuda.id,
      autor: mensajesAyuda.autor,
      texto: mensajesAyuda.texto,
      creadoEn: mensajesAyuda.creadoEn,
    })
    .from(mensajesAyuda)
    .where(eq(mensajesAyuda.casoId, caso.id))
    .orderBy(asc(mensajesAyuda.creadoEn));
  const adjuntos = await adjuntosDeCasos([caso.id]);
  return {
    ...caso,
    numero: numeroDeCaso(caso.id),
    mensajes: mensajes.map((m) => ({
      ...m,
      adjuntos: adjuntos.get(m.id) ?? [],
    })),
  };
}

export type ArchivoNuevo = { nombre: string; tipo: string; datos: ArrayBuffer };

/**
 * La persona vuelve a escribir, con o sin capturas: el caso queda otra vez
 * esperando respuesta. Las capturas se suben ANTES de guardar el mensaje: si
 * una falla, no queda un mensaje que diga que hay una captura que no está.
 */
export async function mensajeDelCliente(
  codigo: string,
  texto: string,
  archivos: ArchivoNuevo[] = [],
) {
  const db = getDb();
  const [caso] = await db
    .select({ id: casosAyuda.id })
    .from(casosAyuda)
    .where(eq(casosAyuda.codigo, codigo))
    .limit(1);
  if (!caso) return false;
  const ahora = new Date();
  const mensajeId = `ma-${nanoid(14)}`;
  const { extensionDe } = await import("@/lib/soporte/adjuntos");
  const subidos: {
    id: string;
    clave: string;
    nombre: string;
    tipo: string;
    bytes: number;
  }[] = [];
  if (archivos.length > 0) {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    for (const a of archivos) {
      const id = `aa-${nanoid(14)}`;
      const clave = `ayuda/${caso.id}/${id}.${extensionDe(a.tipo)}`;
      await env.BUCKET.put(clave, a.datos, {
        httpMetadata: { contentType: a.tipo },
      });
      subidos.push({
        id,
        clave,
        nombre: a.nombre,
        tipo: a.tipo,
        bytes: a.datos.byteLength,
      });
    }
  }
  await db.batch([
    db.insert(mensajesAyuda).values({
      id: mensajeId,
      casoId: caso.id,
      autor: "cliente",
      texto,
      creadoEn: ahora,
    }),
    ...subidos.map((a) =>
      db
        .insert(adjuntosAyuda)
        .values({ ...a, mensajeId, casoId: caso.id, creadoEn: ahora }),
    ),
    db
      .update(casosAyuda)
      .set({ estado: "abierto", actualizadoEn: ahora })
      .where(eq(casosAyuda.id, caso.id)),
  ]);
  return true;
}

/** Los casos de quien entró con su cuenta, los más recientes primero. */
export async function casosDelUsuario(usuarioId: string) {
  const filas = await getDb()
    .select({
      id: casosAyuda.id,
      codigo: casosAyuda.codigo,
      asunto: casosAyuda.asunto,
      estado: casosAyuda.estado,
      actualizadoEn: casosAyuda.actualizadoEn,
    })
    .from(casosAyuda)
    .where(eq(casosAyuda.usuarioId, usuarioId))
    .orderBy(desc(casosAyuda.actualizadoEn))
    .limit(50);
  return filas.map((f) => ({ ...f, numero: numeroDeCaso(f.id) }));
}

/** Para el gerente: los abiertos (o todos), con su chat. Sin correo ni llave. */
export async function ticketsParaGerente(soloAbiertos: boolean) {
  const db = getDb();
  const casos = await db
    .select({
      id: casosAyuda.id,
      nombre: casosAyuda.nombre,
      idioma: casosAyuda.idioma,
      asunto: casosAyuda.asunto,
      estado: casosAyuda.estado,
      creadoEn: casosAyuda.creadoEn,
    })
    .from(casosAyuda)
    .where(soloAbiertos ? eq(casosAyuda.estado, "abierto") : undefined)
    .orderBy(desc(casosAyuda.actualizadoEn))
    .limit(100);
  const mensajes = casos.length
    ? await db
        .select({
          id: mensajesAyuda.id,
          casoId: mensajesAyuda.casoId,
          autor: mensajesAyuda.autor,
          texto: mensajesAyuda.texto,
          creadoEn: mensajesAyuda.creadoEn,
        })
        .from(mensajesAyuda)
        .where(
          inArray(
            mensajesAyuda.casoId,
            casos.map((c) => c.id),
          ),
        )
        .orderBy(asc(mensajesAyuda.creadoEn))
    : [];
  const adjuntos = await adjuntosDeCasos(casos.map((c) => c.id));
  return casos.map((c) => ticketParaGerente(c, mensajes, adjuntos));
}

/** El gerente contesta: queda el mensaje y el caso pasa a respondido o cerrado. */
export async function respuestaDeSoporte(
  id: string,
  d: { texto: string; plantilla?: string; cerrar: boolean },
) {
  const db = getDb();
  const [caso] = await db
    .select({
      id: casosAyuda.id,
      codigo: casosAyuda.codigo,
      nombre: casosAyuda.nombre,
      email: casosAyuda.email,
      idioma: casosAyuda.idioma,
      asunto: casosAyuda.asunto,
    })
    .from(casosAyuda)
    .where(eq(casosAyuda.id, id))
    .limit(1);
  if (!caso) return null;
  const ahora = new Date();
  await db.batch([
    db.insert(mensajesAyuda).values({
      id: `ma-${nanoid(14)}`,
      casoId: caso.id,
      autor: "soporte",
      texto: d.texto,
      plantilla: d.plantilla ?? null,
      creadoEn: ahora,
    }),
    db
      .update(casosAyuda)
      .set({
        estado: d.cerrar ? "cerrado" : "respondido",
        actualizadoEn: ahora,
      })
      .where(eq(casosAyuda.id, caso.id)),
  ]);
  return { ...caso, numero: numeroDeCaso(caso.id) };
}
