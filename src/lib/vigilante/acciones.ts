"use server";

import { revalidatePath } from "next/cache";

import { esSoporteDeVerdad } from "@/lib/autorizacion";

import { correrVigilante } from "./correr";

/** «Correr ahora» desde el panel. Solo soporte de verdad. */
export async function correrVigilanteDesdePanel(): Promise<
  | { ok: true; alertas: number; acciones: number }
  | { ok: false; motivo: string }
> {
  if (!(await esSoporteDeVerdad())) {
    return {
      ok: false,
      motivo: "Esta parte es solo para el equipo de soporte.",
    };
  }
  try {
    const l = await correrVigilante("panel");
    revalidatePath("/[locale]/panel/vigilante", "page");
    return {
      ok: true,
      alertas: l.alertas.length,
      acciones: l.acciones.filter((a) => a.cantidad > 0).length,
    };
  } catch (fallo) {
    console.error("[vigilante] la corrida desde el panel falló:", fallo);
    return {
      ok: false,
      motivo: fallo instanceof Error ? fallo.message : String(fallo),
    };
  }
}
