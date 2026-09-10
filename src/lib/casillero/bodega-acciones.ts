"use server";

import { nanoid } from "nanoid";
import { and, eq, isNull } from "drizzle-orm";

import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { codigoValido, normalizarCodigo } from "@/lib/casillero/codigo";
import { recibirPaquete } from "@/lib/casillero/recepcion";
import { getDb } from "@/lib/db";
import {
  asignacionesPaquete,
  eventosPaquete,
  casilleros,
  paquetesCasillero,
  prealertas,
} from "@/lib/db/schema";

const numero = (v: FormDataEntryValue | null): number | null => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Recibir una caja desde la pantalla de la bodega.
 *
 * La sesión y el rol se comprueban AQUÍ: una acción de servidor es
 * alcanzable con un POST directo, sin pasar por la pantalla.
 */
export async function recibirDesdeBodega(
  _previo: unknown,
  formulario: FormData,
): Promise<{
  error?: string;
  wr?: string;
  asignado?: boolean;
  codigo?: string;
  candidatos?: Array<{
    codigo: string;
    motivo: string;
    score: number;
    casilleroId: string;
  }>;
  paqueteId?: string;
}> {
  if (!(await esEquipoInterno())) return { error: "permiso" };
  const usuario = await obtenerUsuario();

  try {
    const r = await recibirPaquete({
      tracking: String(formulario.get("tracking") ?? "").trim() || null,
      textoOcr: String(formulario.get("textoOcr") ?? "").trim() || null,
      remitente: String(formulario.get("remitente") ?? "").trim() || null,
      pesoLb: numero(formulario.get("pesoLb")),
      largoIn: numero(formulario.get("largoIn")),
      anchoIn: numero(formulario.get("anchoIn")),
      altoIn: numero(formulario.get("altoIn")),
      ubicacion: String(formulario.get("ubicacion") ?? "").trim() || null,
      recibidoPor: usuario?.id ?? null,
    });
    return {
      wr: r.wr,
      asignado: r.asignado,
      codigo: r.codigo,
      paqueteId: r.paqueteId,
      candidatos: r.candidatos.map((c) => ({
        codigo: c.codigo,
        motivo: c.motivo,
        score: c.score,
        casilleroId: c.casilleroId,
      })),
    };
  } catch (fallo) {
    console.error("[bodega] no se pudo recibir:", fallo);
    return { error: "fallo" };
  }
}

/**
 * Asignar a mano un paquete huérfano.
 *
 * Queda registrado como **manual** y con quién lo hizo: cuando alguien
 * reclame un paquete que terminó en otro casillero, esa fila es la única
 * forma de saber qué pasó.
 */
export async function asignarAMano(
  paqueteId: string,
  casilleroId: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await esEquipoInterno())) return { ok: false, error: "permiso" };
  return asignarHuerfano(paqueteId, casilleroId, motivo);
}

/**
 * Asignar escribiendo el CÓDIGO del casillero, que es lo que la persona
 * de la bodega tiene delante (en la etiqueta, en un chat, en un correo).
 *
 * Tres cerrojos antes de mover nada:
 * - el código tiene que ser válido (con su dígito de control: un dedo que
 *   resbala no manda la caja a otro cliente),
 * - el casillero tiene que existir y no estar suspendido,
 * - y el paquete tiene que seguir HUÉRFANO (ver `asignarHuerfano`).
 */
export async function asignarPorCodigo(
  _previo: { ok?: boolean; error?: string } | null,
  formulario: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  if (!(await esEquipoInterno())) return { error: "permiso" };

  const paqueteId = String(formulario.get("paqueteId") ?? "").trim();
  const codigo = normalizarCodigo(String(formulario.get("codigo") ?? "")) ?? "";
  const motivo =
    String(formulario.get("motivo") ?? "").trim() ||
    "asignado a mano en bodega";
  if (!paqueteId) return { error: "fallo" };
  if (!codigoValido(codigo)) return { error: "codigo" };

  const [c] = await getDb()
    .select({ id: casilleros.id, estado: casilleros.estado })
    .from(casilleros)
    .where(eq(casilleros.codigo, codigo))
    .limit(1)
    .catch(() => []);
  if (!c) return { error: "no-existe" };
  if (c.estado === "suspendido") return { error: "suspendido" };

  return asignarHuerfano(paqueteId, c.id, motivo);
}

/**
 * Lo que de verdad asigna, para las dos entradas.
 *
 * **Solo se asigna lo que sigue huérfano** (`casillero_id IS NULL`). Sin ese
 * cerrojo, dos personas de la bodega mirando la misma cola podrían mover
 * el mismo paquete dos veces, y la segunda se lo quitaría a un cliente que
 * ya lo tenía en «mis paquetes». El `RETURNING` es lo que dice si tocó
 * una fila o ninguna.
 */
async function asignarHuerfano(
  paqueteId: string,
  casilleroId: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string }> {
  const usuario = await obtenerUsuario();
  const ahora = new Date();

  try {
    const db = getDb();
    const tocadas = await db
      .update(paquetesCasillero)
      .set({ casilleroId, estado: "asignado" })
      .where(
        and(
          eq(paquetesCasillero.id, paqueteId),
          isNull(paquetesCasillero.casilleroId),
        ),
      )
      .returning({ id: paquetesCasillero.id });
    if (tocadas.length === 0) return { ok: false, error: "ya-asignado" };

    await db.insert(asignacionesPaquete).values({
      id: nanoid(),
      paqueteId,
      casilleroId,
      metodo: "manual",
      score: 0,
      automatico: false,
      motivo,
      usuarioId: usuario?.id ?? null,
      creadoEn: ahora,
    });
    await db.insert(eventosPaquete).values({
      id: nanoid(),
      paqueteId,
      tipo: "asignado_a_mano",
      detalle: JSON.stringify({ casilleroId, motivo }),
      visibleCliente: false,
      usuarioId: usuario?.id ?? null,
      creadoEn: ahora,
    });
    return { ok: true };
  } catch (fallo) {
    console.error("[bodega] no se pudo asignar:", fallo);
    return { ok: false, error: "fallo" };
  }
}

/** Cerrar una prealerta que ya no va a llegar. */
export async function cerrarPrealerta(id: string): Promise<{ ok: boolean }> {
  if (!(await esEquipoInterno())) return { ok: false };
  await getDb()
    .update(prealertas)
    .set({ estado: "vencida" })
    .where(eq(prealertas.id, id))
    .catch(() => undefined);
  return { ok: true };
}
