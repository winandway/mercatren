"use server";

import { revalidatePath } from "next/cache";

import { obtenerAlcance, obtenerUsuario } from "@/lib/autorizacion";
import {
  cancelarPlan,
  empezarMesGratis,
  seguirConPro,
} from "@/lib/ganar/planes";
import {
  cambiarEstadoPromocion,
  guardarPromocion,
} from "@/lib/ganar/promociones";
import { presupuestoDesdeTexto } from "@/lib/ganar/reglas";

/**
 * EL PLAN PRO Y PROMOCIONAR, DESDE EL PANEL WEB (5 nov 2026, Fase 4).
 * Las mismas piezas que usa la app (`/datos/app/mi/plan` y `…/promociones`).
 *
 * Solo el comercio, con su sesión de vendedor: el equipo mirando «su panel»
 * solo mira (la misma regla que los retiros y las entregas). NADA SE COBRA.
 */
async function tiendaDelVendedor(): Promise<string | null> {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance || alcance.tipo !== "tienda") return null;
  const quien = await obtenerUsuario().catch(() => null);
  if (quien?.rol !== "vendedor") return null;
  return alcance.tiendaId;
}

export async function accionDelPlan(
  accion: "empezar" | "cancelar" | "seguir",
): Promise<{ ok: boolean; motivo?: string }> {
  const tiendaId = await tiendaDelVendedor();
  if (!tiendaId) return { ok: false, motivo: "sin_permiso" };
  if (accion === "empezar") {
    const r = await empezarMesGratis(tiendaId);
    if (!r.ok) return { ok: false, motivo: r.motivo };
  } else if (accion === "cancelar") {
    await cancelarPlan(tiendaId);
  } else {
    await seguirConPro(tiendaId);
  }
  revalidatePath("/[locale]/panel", "layout");
  return { ok: true };
}

export async function accionPromocionar(
  productoId: string,
  presupuesto: string,
): Promise<{ ok: boolean; motivo?: string }> {
  const tiendaId = await tiendaDelVendedor();
  if (!tiendaId) return { ok: false, motivo: "sin_permiso" };
  const centavos = presupuestoDesdeTexto(presupuesto);
  if (centavos === null) return { ok: false, motivo: "presupuesto" };
  const r = await guardarPromocion({
    tiendaId,
    productoId: String(productoId ?? "").slice(0, 40),
    presupuestoCentavos: centavos,
  });
  if (!r.ok) return { ok: false, motivo: r.motivo };
  revalidatePath("/[locale]/panel/promociones", "page");
  return { ok: true };
}

export async function accionEstadoPromocion(
  promocionId: string,
  estado: "activa" | "pausada",
): Promise<{ ok: boolean }> {
  const tiendaId = await tiendaDelVendedor();
  if (!tiendaId || (estado !== "activa" && estado !== "pausada"))
    return { ok: false };
  const hecho = await cambiarEstadoPromocion({
    tiendaId,
    promocionId: String(promocionId ?? "").slice(0, 40),
    estado,
  });
  revalidatePath("/[locale]/panel/promociones", "page");
  return { ok: hecho };
}
