import "server-only";

import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { casosAyuda, mensajesAyuda } from "@/lib/db/schema";
import {
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
      autor: mensajesAyuda.autor,
      texto: mensajesAyuda.texto,
      creadoEn: mensajesAyuda.creadoEn,
    })
    .from(mensajesAyuda)
    .where(eq(mensajesAyuda.casoId, caso.id))
    .orderBy(asc(mensajesAyuda.creadoEn));
  return { ...caso, numero: numeroDeCaso(caso.id), mensajes };
}

/** La persona vuelve a escribir: el caso queda otra vez esperando respuesta. */
export async function mensajeDelCliente(codigo: string, texto: string) {
  const db = getDb();
  const [caso] = await db
    .select({ id: casosAyuda.id })
    .from(casosAyuda)
    .where(eq(casosAyuda.codigo, codigo))
    .limit(1);
  if (!caso) return false;
  const ahora = new Date();
  await db.batch([
    db.insert(mensajesAyuda).values({
      id: `ma-${nanoid(14)}`,
      casoId: caso.id,
      autor: "cliente",
      texto,
      creadoEn: ahora,
    }),
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
  return casos.map((c) => ticketParaGerente(c, mensajes));
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
