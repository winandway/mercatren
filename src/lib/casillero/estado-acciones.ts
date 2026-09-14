"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { esSoporteDeVerdad, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { accesosDatos, casilleros } from "@/lib/db/schema";

/**
 * ══ VERIFICAR, SUSPENDER Y REACTIVAR UN CASILLERO (14 sep 2026) ══
 *
 * El casillero nace SIN verificar: recibe pero no despacha (antifraude).
 * Hasta hoy no había pantalla para verificarlo, así que nadie podía llegar
 * a despachar. Esto es la pantalla.
 *
 * Lo hace `esSoporteDeVerdad` y no `esEquipoInterno`: decidir a quién se
 * le despacha mercancía a otro país no se hace desde el disfraz de «ver
 * el panel de un comercio». Cada cambio deja su rastro en `accesos_datos`
 * (quién, cuándo, qué), que es la bitácora que ya existe para todo lo que
 * una persona del equipo hace sobre un casillero.
 */
const ACCIONES = ["verificar", "suspender", "reactivar"] as const;
type Accion = (typeof ACCIONES)[number];

export async function cambiarEstadoCasillero(
  _previo: { ok?: boolean; error?: string } | null,
  formulario: FormData,
): Promise<{ ok?: boolean; error?: string; accion?: Accion }> {
  if (!(await esSoporteDeVerdad())) return { error: "permiso" };
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "permiso" };

  const casilleroId = String(formulario.get("casilleroId") ?? "").trim();
  const accion = String(formulario.get("accion") ?? "") as Accion;
  if (!casilleroId || !ACCIONES.includes(accion)) return { error: "fallo" };

  const cambio =
    accion === "verificar"
      ? { verificado: true }
      : accion === "suspender"
        ? { estado: "suspendido" }
        : { estado: "activo" };

  try {
    const db = getDb();
    const tocadas = await db
      .update(casilleros)
      .set(cambio)
      .where(eq(casilleros.id, casilleroId))
      .returning({ id: casilleros.id });
    if (tocadas.length === 0) return { error: "no-existe" };
    await db.insert(accesosDatos).values({
      id: nanoid(),
      usuarioId: usuario.id,
      casilleroId,
      campo: `estado:${accion}`,
      creadoEn: new Date(),
    });
    return { ok: true, accion };
  } catch (fallo) {
    console.error("[casillero] no se pudo cambiar el estado:", fallo);
    return { error: "fallo" };
  }
}
