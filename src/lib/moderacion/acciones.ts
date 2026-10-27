"use server";

import { and, eq, sql } from "drizzle-orm";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  bloqueosUsuario,
  comentariosVideo,
  denunciasContenido,
  preguntasProducto,
  valoraciones,
} from "@/lib/db/schema";

import {
  esMotivoDeDenuncia,
  esTipoDenunciable,
  puedeModerar,
  seOcultaPorDenuncias,
  type TipoDenunciable,
} from "./reglas";

/**
 * DENUNCIAR Y BLOQUEAR (27 oct 2026). Ver `reglas.ts`.
 *
 * Solo exporta funciones async: un archivo "use server" con una constante o
 * un tipo exportado rompe la compilación entera.
 */

type Contenido = { autorId: string | null; texto: string | null };

/** Quién publicó el contenido y qué decía, leído de su propia tabla. */
async function leerContenido(
  tipo: TipoDenunciable,
  id: string,
): Promise<Contenido | null> {
  const db = getDb();
  if (tipo === "comentario") {
    const [f] = await db
      .select({
        autorId: comentariosVideo.usuarioId,
        texto: comentariosVideo.texto,
      })
      .from(comentariosVideo)
      .where(eq(comentariosVideo.id, id))
      .limit(1);
    return f ?? null;
  }
  if (tipo === "opinion") {
    const [f] = await db
      .select({
        autorId: valoraciones.usuarioId,
        texto: valoraciones.comentario,
      })
      .from(valoraciones)
      .where(eq(valoraciones.id, id))
      .limit(1);
    return f ?? null;
  }
  const [f] = await db
    .select({
      autorId: preguntasProducto.usuarioId,
      texto: preguntasProducto.preguntaEs,
    })
    .from(preguntasProducto)
    .where(eq(preguntasProducto.id, id))
    .limit(1);
  return f ?? null;
}

export async function denunciarContenido(entrada: {
  tipo: string;
  id: string;
  motivo: string;
}): Promise<
  | { ok: true; oculto: boolean }
  | { ok: false; motivo: "sesion" | "propio" | "invalido" | "fallo" }
> {
  if (!esTipoDenunciable(entrada.tipo) || !esMotivoDeDenuncia(entrada.motivo)) {
    return { ok: false, motivo: "invalido" };
  }
  const usuario = await obtenerUsuario();
  const contenido = await leerContenido(entrada.tipo, String(entrada.id)).catch(
    () => null,
  );
  if (!contenido) return { ok: false, motivo: "invalido" };

  const permiso = puedeModerar(usuario?.id ?? null, contenido.autorId);
  if (permiso !== "ok") return { ok: false, motivo: permiso };

  const db = getDb();
  try {
    await db
      .insert(denunciasContenido)
      .values({
        id: crypto.randomUUID(),
        tipo: entrada.tipo,
        objetoId: entrada.id,
        autorId: contenido.autorId,
        denuncianteId: usuario!.id,
        motivo: entrada.motivo,
        estado: "abierta",
        creadoEn: new Date(),
      })
      .onConflictDoNothing();

    const [cuenta] = await db
      .select({ n: sql<number>`count(*)` })
      .from(denunciasContenido)
      .where(
        and(
          eq(denunciasContenido.tipo, entrada.tipo),
          eq(denunciasContenido.objetoId, entrada.id),
          eq(denunciasContenido.estado, "abierta"),
        ),
      );
    const abiertas = Number(cuenta?.n ?? 0);
    const oculto = seOcultaPorDenuncias(abiertas);

    /* El equipo se entera de CADA denuncia. Si el correo falla, la denuncia
       ya quedó guardada: no se pierde por un aviso. */
    try {
      const { correoAvisoAlEquipo } = await import("@/lib/correo/correos");
      await correoAvisoAlEquipo({
        asunto: `Denuncia de ${entrada.tipo} · ${entrada.motivo}`,
        lineas: [
          `Alguien denunció un(a) ${entrada.tipo} por «${entrada.motivo}». Lleva ${abiertas} denuncia(s) abierta(s)${oculto ? " y ya está OCULTO para todos" : ""}.`,
          `Texto: «${(contenido.texto ?? "").slice(0, 300)}»`,
          `Identificador: ${entrada.tipo} ${entrada.id}`,
        ],
        url: "https://mercatren.com/es/panel",
        boton: "Abrir el panel",
      });
    } catch (e) {
      console.error(
        "[moderacion] la denuncia se guardó pero el aviso no salió:",
        e,
      );
    }

    return { ok: true, oculto };
  } catch (e) {
    console.error("[moderacion] no se pudo guardar la denuncia:", e);
    return { ok: false, motivo: "fallo" };
  }
}

export async function bloquearAutor(entrada: {
  tipo: string;
  id: string;
}): Promise<
  | { ok: true }
  | { ok: false; motivo: "sesion" | "propio" | "invalido" | "fallo" }
> {
  if (!esTipoDenunciable(entrada.tipo))
    return { ok: false, motivo: "invalido" };
  const usuario = await obtenerUsuario();
  const contenido = await leerContenido(entrada.tipo, String(entrada.id)).catch(
    () => null,
  );
  if (!contenido?.autorId) return { ok: false, motivo: "invalido" };

  const permiso = puedeModerar(usuario?.id ?? null, contenido.autorId);
  if (permiso !== "ok") return { ok: false, motivo: permiso };

  try {
    await getDb()
      .insert(bloqueosUsuario)
      .values({
        usuarioId: usuario!.id,
        bloqueadoId: contenido.autorId,
        creadoEn: new Date(),
      })
      .onConflictDoNothing();
    return { ok: true };
  } catch (e) {
    console.error("[moderacion] no se pudo bloquear:", e);
    return { ok: false, motivo: "fallo" };
  }
}
