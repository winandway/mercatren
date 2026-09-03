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

/**
 * LOS BOTONES CORTOS DEL TABLERO (3 sep 2026).
 *
 * Lo pidió el dueño: «que haya un botón corto desde ese mismo lugar donde
 * uno le pueda dar un clic para continuar agregando productos, terminando
 * una traducción o cualquier cosa». Son los mismos trabajos que hace el
 * reloj solo; esto los adelanta cuando uno está mirando.
 *
 * Cada uno con su presupuesto de tiempo: una acción de servidor tiene el
 * suyo contado, y una que se pasa muere sin decir nada.
 */
export type ResultadoEmpujon =
  { ok: true; texto: string } | { ok: false; motivo: string };

async function soloSoporte(): Promise<string | null> {
  if (await esSoporteDeVerdad()) return null;
  return "Esta parte es solo para el equipo de soporte.";
}

/** Afinar: flete real, tallas y stock de lo que está en revisión. */
export async function afinarAhora(): Promise<ResultadoEmpujon> {
  const no = await soloSoporte();
  if (no) return { ok: false, motivo: no };
  try {
    const { afinarImportados } = await import("@/lib/cj/afinar");
    const r = await afinarImportados({ limite: 20, presupuestoMs: 20_000 });
    revalidatePath("/[locale]/panel/vigilante", "page");
    return {
      ok: true,
      texto: `${r.afinados} afinados, ${r.agotados} agotados, ${r.fallidos} fallidos, quedan ${r.restantes}`,
    };
  } catch (fallo) {
    return { ok: false, motivo: motivoDe(fallo) };
  }
}

/** Traducir al español una tanda de títulos y descripciones. */
export async function traducirAhora(): Promise<ResultadoEmpujon> {
  const no = await soloSoporte();
  if (no) return { ok: false, motivo: no };
  try {
    const { traducirDesdeElReloj } = await import("@/lib/traduccion/tanda");
    const r = await traducirDesdeElReloj({
      tandasTitulos: 3,
      tandasDescripciones: 1,
    });
    revalidatePath("/[locale]/panel/vigilante", "page");
    return {
      ok: true,
      texto: `${r.titulos} títulos y ${r.descripciones} descripciones`,
    };
  } catch (fallo) {
    return { ok: false, motivo: motivoDe(fallo) };
  }
}

/** Traer fotos del servidor de los comercios a nuestro bucket. */
export async function traerFotosAhora(): Promise<ResultadoEmpujon> {
  const no = await soloSoporte();
  if (no) return { ok: false, motivo: no };
  try {
    const { traerFotosDesdeElReloj } =
      await import("@/lib/catalogo/fotos-automaticas");
    const r = await traerFotosDesdeElReloj({ presupuestoMs: 20_000 });
    revalidatePath("/[locale]/panel/vigilante", "page");
    return {
      ok: true,
      texto: `${r.copiadas} copiadas, ${r.fallidas} fallidas, faltan ${r.faltan}`,
    };
  } catch (fallo) {
    return { ok: false, motivo: motivoDe(fallo) };
  }
}

/** Empujar la importación masiva que esté en marcha. */
export async function importarAhora(): Promise<ResultadoEmpujon> {
  const no = await soloSoporte();
  if (no) return { ok: false, motivo: no };
  try {
    const { avanzarImportacionesEnCurso } =
      await import("@/lib/cj/masivo-servidor");
    const r = await avanzarImportacionesEnCurso(20_000);
    revalidatePath("/[locale]/panel/vigilante", "page");
    return {
      ok: true,
      texto:
        r.length === 0
          ? "no hay ninguna importación en marcha"
          : r
              .map((x) => `${x.mercado} ${x.tandasHechas}/${x.tandasTotal}`)
              .join(", "),
    };
  } catch (fallo) {
    return { ok: false, motivo: motivoDe(fallo) };
  }
}

/** «Ya lo arreglé» en el historial de fallos. */
export async function resolverError(clave: string): Promise<ResultadoEmpujon> {
  const no = await soloSoporte();
  if (no) return { ok: false, motivo: no };
  try {
    const { marcarErrorResuelto } = await import("@/lib/errores/registro");
    await marcarErrorResuelto(clave);
    revalidatePath("/[locale]/panel/vigilante", "page");
    return { ok: true, texto: "marcado como resuelto" };
  } catch (fallo) {
    return { ok: false, motivo: motivoDe(fallo) };
  }
}

function motivoDe(fallo: unknown): string {
  return fallo instanceof Error ? fallo.message : String(fallo);
}
