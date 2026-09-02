"use server";

import { z } from "zod";

import { esSoporteDeVerdad, obtenerUsuario } from "@/lib/autorizacion";
import {
  afinarImportados,
  contarPorAfinar,
  type ResultadoAfinado,
} from "@/lib/cj/afinar";
import { STOCK_MINIMO_POR_DEFECTO } from "@/lib/cj/masivo";
import {
  arrancarImportacion,
  avanzarImportacion,
  estadoDeImportacionDe,
  muestrasDeEnvioDe,
  pausarImportacion,
  reanudarImportacion,
  type EstadoImportacion,
} from "@/lib/cj/masivo-servidor";
import { plazaDelMercado } from "@/lib/cj/plazas";
import { mercadoDelPanel } from "@/lib/mercado/panel";

/**
 * LAS PUERTAS DEL PANEL A LA IMPORTACIÓN MASIVA.
 *
 * Solo el rol `soporte`, comprobado en el servidor y sin el disfraz de «ver
 * su panel» (`esSoporteDeVerdad`): esto publica miles de fichas con precio.
 * La plaza la decide el selector de país del panel, como todo el catálogo.
 *
 * Cada llamada trabaja unos segundos y devuelve cómo va: la pantalla vuelve
 * a llamar mientras siga abierta, y el reloj sigue solo cuando se cierra.
 */

/** Lo que trabaja una llamada desde el panel. Corto: es una acción de
 *  servidor y el navegador está esperando. */
const PRESUPUESTO_PANEL_MS = 20_000;

export type EstadoMasivo = {
  importacion: EstadoImportacion | null;
  porAfinar: number;
  afinados: number;
  muestrasDeEnvio: number;
};

const NO_AUTORIZADO = "Esta parte es solo para el equipo de soporte.";

export async function estadoImportacionMasiva(): Promise<EstadoMasivo | null> {
  if (!(await esSoporteDeVerdad())) return null;
  const plaza = plazaDelMercado(await mercadoDelPanel());
  const [importacion, cola, muestrasDeEnvio] = await Promise.all([
    estadoDeImportacionDe(plaza),
    contarPorAfinar(plaza),
    muestrasDeEnvioDe(plaza),
  ]);
  return { importacion, ...cola, muestrasDeEnvio };
}

const Formulario = z.object({
  stockMinimo: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000)
    .default(STOCK_MINIMO_POR_DEFECTO),
  soloVerificado: z.enum(["si", "no"]).default("si"),
  tope: z.coerce.number().int().min(0).max(1_000_000).default(0),
});

export async function arrancarImportacionMasiva(
  formulario: FormData,
): Promise<
  { ok: true; estado: EstadoImportacion } | { ok: false; motivo: string }
> {
  if (!(await esSoporteDeVerdad())) return { ok: false, motivo: NO_AUTORIZADO };
  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, motivo: "Hace falta una sesión." };

  const leido = Formulario.safeParse({
    stockMinimo: formulario.get("stockMinimo") ?? undefined,
    soloVerificado: formulario.get("soloVerificado") ?? undefined,
    tope: formulario.get("tope") ?? undefined,
  });
  if (!leido.success) {
    return {
      ok: false,
      motivo:
        "Revisa el stock mínimo y el tope: tienen que ser números enteros.",
    };
  }

  const plaza = plazaDelMercado(await mercadoDelPanel());
  try {
    return await arrancarImportacion({
      plaza,
      propietarioId: usuario.id,
      stockMinimo: leido.data.stockMinimo,
      soloVerificado: leido.data.soloVerificado === "si",
      tope: leido.data.tope,
    });
  } catch (fallo) {
    /* El motivo entero: esta pantalla es solo del equipo. */
    console.error("[cj-masivo] no se pudo arrancar:", fallo);
    return {
      ok: false,
      motivo: fallo instanceof Error ? fallo.message : String(fallo),
    };
  }
}

export async function avanzarImportacionMasiva(
  id: string,
): Promise<EstadoImportacion | null> {
  if (!(await esSoporteDeVerdad())) return null;
  return avanzarImportacion(
    String(id ?? "").slice(0, 40),
    PRESUPUESTO_PANEL_MS,
  );
}

export async function pausarImportacionMasiva(
  id: string,
): Promise<EstadoImportacion | null> {
  if (!(await esSoporteDeVerdad())) return null;
  return pausarImportacion(String(id ?? "").slice(0, 40));
}

export async function reanudarImportacionMasiva(
  id: string,
): Promise<EstadoImportacion | null> {
  if (!(await esSoporteDeVerdad())) return null;
  return reanudarImportacion(String(id ?? "").slice(0, 40));
}

/** Afina unos pocos desde el panel: flete real, tallas y stock. */
export async function afinarDesdePanel(): Promise<ResultadoAfinado> {
  if (!(await esSoporteDeVerdad())) {
    return {
      afinados: 0,
      agotados: 0,
      fallidos: 0,
      restantes: 0,
      motivo: NO_AUTORIZADO,
    };
  }
  const plaza = plazaDelMercado(await mercadoDelPanel());
  return afinarImportados({
    limite: 6,
    presupuestoMs: PRESUPUESTO_PANEL_MS,
    plaza,
  });
}
