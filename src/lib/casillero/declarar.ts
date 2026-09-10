"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { obtenerUsuario } from "@/lib/autorizacion";
import { casilleroDe } from "@/lib/casillero/crear";
import { getDb } from "@/lib/db";
import { eventosPaquete, paquetesCasillero } from "@/lib/db/schema";

/**
 * El cliente declara qué hay dentro y cuánto costó.
 *
 * ══ SE COMPRUEBA QUE EL PAQUETE ES SUYO ══
 *
 * No basta con recibir el id: una acción de servidor se llama con un POST
 * directo, y sin esta comprobación cualquiera declararía —o cambiaría— el
 * valor del paquete de otro, que es lo que la aduana le va a cobrar.
 */
export async function declararPaquete(
  _previo: { error?: string; ok?: boolean } | null,
  formulario: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "sesion" };
  const casillero = await casilleroDe(usuario.id);
  if (!casillero) return { error: "sin-casillero" };

  const paqueteId = String(formulario.get("paqueteId") ?? "");
  const descripcion = String(formulario.get("descripcion") ?? "").trim();
  const valor = Number(String(formulario.get("valor") ?? "").replace(",", "."));
  if (!paqueteId) return { error: "datos" };
  if (descripcion.length < 3) return { error: "descripcion" };
  if (!Number.isFinite(valor) || valor <= 0) return { error: "valor" };

  try {
    const db = getDb();
    const cambios = await db
      .update(paquetesCasillero)
      .set({
        valorDeclaradoCentavos: Math.round(valor * 100),
        descripcionDeclarada: descripcion,
      })
      /* El `and` con el casillero es la comprobación: si el paquete no es
         suyo, no cambia ninguna fila y no pasa nada. */
      .where(
        and(
          eq(paquetesCasillero.id, paqueteId),
          eq(paquetesCasillero.casilleroId, casillero.id),
        ),
      );
    const tocadas = Number(
      (cambios as { meta?: { changes?: number } } | null)?.meta?.changes ?? 0,
    );
    if (tocadas === 0) return { error: "no-es-tuyo" };

    await db.insert(eventosPaquete).values({
      id: nanoid(),
      paqueteId,
      tipo: "declarado",
      detalle: JSON.stringify({ valor, descripcion }),
      visibleCliente: true,
      usuarioId: usuario.id,
      creadoEn: new Date(),
    });
    return { ok: true };
  } catch (fallo) {
    console.error("[casillero] no se pudo declarar:", fallo);
    return { error: "fallo" };
  }
}
