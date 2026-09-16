"use server";

import { z } from "zod";

import { cotizarEnvio, type Cotizacion } from "@/lib/casillero/cotizar";
import { listarTarifas, tarifaDe } from "@/lib/casillero/tarifas";

/**
 * ══ LA CALCULADORA PÚBLICA DEL CASILLERO (16 sep 2026) ══
 *
 * Richard: _«ya ver la calculadora funcionando al 100 % y hacer las
 * primeras pruebas»_. Está en la página del casillero, sin sesión: quien
 * va a comprar en Amazon quiere saber cuánto le cuesta traerlo ANTES de
 * crear nada. Solo cotiza los países con tarifa ENCENDIDA en el panel; si
 * no hay ninguno, la calculadora no se dibuja.
 *
 * Es solo lectura (no guarda nada) y todo lo que entra pasa por zod: peso,
 * medidas y valor tienen tope para que nadie la use de calculadora de
 * toneladas ni de generador de números absurdos.
 */
const Entrada = z.object({
  pais: z.string().regex(/^[A-Z]{2}$/),
  pesoLb: z.number().min(0).max(500),
  largoIn: z.number().min(0).max(200).optional(),
  anchoIn: z.number().min(0).max(200).optional(),
  altoIn: z.number().min(0).max(200).optional(),
  valorUsd: z.number().min(0).max(100_000).optional(),
});

const numero = (v: FormDataEntryValue | null): number | undefined => {
  const t = String(v ?? "")
    .trim()
    .replace(",", ".");
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

export type ResultadoCalculadora =
  | { ok: true; cotizacion: Extract<Cotizacion, { ok: true }>; pais: string }
  | { ok: false; error: "entrada" | "sin-tarifa" | "sin-peso" };

export async function cotizarPublico(
  _previo: ResultadoCalculadora | null,
  formulario: FormData,
): Promise<ResultadoCalculadora> {
  const leida = Entrada.safeParse({
    pais: String(formulario.get("pais") ?? "").toUpperCase(),
    pesoLb: numero(formulario.get("pesoLb")) ?? 0,
    largoIn: numero(formulario.get("largoIn")),
    anchoIn: numero(formulario.get("anchoIn")),
    altoIn: numero(formulario.get("altoIn")),
    valorUsd: numero(formulario.get("valorUsd")),
  });
  if (!leida.success) return { ok: false, error: "entrada" };
  const e = leida.data;

  const tarifa = await tarifaDe(e.pais);
  const c = cotizarEnvio(
    {
      pesoRealLb: e.pesoLb,
      medidas:
        e.largoIn && e.anchoIn && e.altoIn
          ? { largoIn: e.largoIn, anchoIn: e.anchoIn, altoIn: e.altoIn }
          : null,
      valorDeclaradoCentavos:
        e.valorUsd !== undefined ? Math.round(e.valorUsd * 100) : null,
    },
    tarifa,
  );
  if (!c.ok) return { ok: false, error: c.motivo };
  return { ok: true, cotizacion: c, pais: e.pais };
}

/** Los países que hoy se pueden cotizar: solo los encendidos en el panel. */
export async function paisesCotizables(): Promise<string[]> {
  const todas = await listarTarifas();
  return todas
    .filter((t) => t.activa && t.tarifaLibraCentavos > 0)
    .map((t) => t.pais);
}
