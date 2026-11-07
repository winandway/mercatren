import "server-only";

import { and, eq, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  bloqueosUsuario,
  comentariosVideo,
  denunciasContenido,
  preguntasProducto,
  productos,
  tiendas,
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
 * DENUNCIAR Y BLOQUEAR: EL NÚCLEO (6 nov 2026).
 *
 * Lo comparten la web (`acciones.ts`, que saca a la persona de la sesión del
 * navegador) y la app nativa (`/datos/app/mi/denunciar` y `/bloquear`, que la
 * sacan de la sesión del teléfono). Quien llama pone el usuario; aquí se
 * decide todo lo demás, para que las dos puertas no se desvíen nunca.
 */

type Contenido = {
  /** El identificador con el que queda guardada la denuncia. */
  objetoId: string;
  autorId: string | null;
  texto: string | null;
};

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
    return f ? { objetoId: id, ...f } : null;
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
    return f ? { objetoId: id, ...f } : null;
  }
  if (tipo === "producto") {
    /* El autor de un producto es el dueño de su tienda. */
    const [f] = await db
      .select({
        objetoId: productos.id,
        autorId: tiendas.propietarioId,
        texto: productos.tituloEs,
      })
      .from(productos)
      .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
      .where(eq(productos.id, id))
      .limit(1);
    return f ?? null;
  }
  if (tipo === "tienda") {
    /* La app conoce la tienda por su slug; la web, por su id. */
    const [f] = await db
      .select({
        objetoId: tiendas.id,
        autorId: tiendas.propietarioId,
        texto: tiendas.nombre,
      })
      .from(tiendas)
      .where(or(eq(tiendas.id, id), eq(tiendas.slug, id)))
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
  return f ? { objetoId: id, ...f } : null;
}

export type Rechazo = "sesion" | "propio" | "invalido" | "fallo";

export async function denunciarComo(
  usuarioId: string | null,
  entrada: { tipo: string; id: string; motivo: string },
): Promise<{ ok: true; oculto: boolean } | { ok: false; motivo: Rechazo }> {
  if (!esTipoDenunciable(entrada.tipo) || !esMotivoDeDenuncia(entrada.motivo)) {
    return { ok: false, motivo: "invalido" };
  }
  if (!usuarioId) return { ok: false, motivo: "sesion" };
  const contenido = await leerContenido(entrada.tipo, String(entrada.id)).catch(
    () => null,
  );
  if (!contenido) return { ok: false, motivo: "invalido" };

  const permiso = puedeModerar(usuarioId, contenido.autorId);
  if (permiso !== "ok") return { ok: false, motivo: permiso };

  const db = getDb();
  try {
    await db
      .insert(denunciasContenido)
      .values({
        id: crypto.randomUUID(),
        tipo: entrada.tipo,
        objetoId: contenido.objetoId,
        autorId: contenido.autorId,
        denuncianteId: usuarioId,
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
          eq(denunciasContenido.objetoId, contenido.objetoId),
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
          `Identificador: ${entrada.tipo} ${contenido.objetoId}`,
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

export async function bloquearComo(
  usuarioId: string | null,
  entrada: { tipo: string; id: string },
): Promise<{ ok: true } | { ok: false; motivo: Rechazo }> {
  if (!esTipoDenunciable(entrada.tipo))
    return { ok: false, motivo: "invalido" };
  if (!usuarioId) return { ok: false, motivo: "sesion" };
  const contenido = await leerContenido(entrada.tipo, String(entrada.id)).catch(
    () => null,
  );
  if (!contenido?.autorId) return { ok: false, motivo: "invalido" };

  const permiso = puedeModerar(usuarioId, contenido.autorId);
  if (permiso !== "ok") return { ok: false, motivo: permiso };

  try {
    await getDb()
      .insert(bloqueosUsuario)
      .values({
        usuarioId,
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
