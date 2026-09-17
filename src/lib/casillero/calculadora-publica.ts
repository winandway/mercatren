"use server";

import { z } from "zod";

import {
  aLibras,
  cotizarEnvio,
  cotizarEnvioMaritimo,
  type Cotizacion,
  type CotizacionMaritima,
} from "@/lib/casillero/cotizar";
import {
  listarTarifas,
  listarTarifasMaritimas,
  tarifaDe,
  tarifaMaritimaDe,
} from "@/lib/casillero/tarifas";

/**
 * ══ LA CALCULADORA PÚBLICA DEL CASILLERO (16 sep 2026) ══
 *
 * Richard: _«ya ver la calculadora funcionando al 100 % y hacer las
 * primeras pruebas»_. Sin sesión: quien va a comprar en Amazon quiere saber
 * cuánto le cuesta traerlo ANTES de crear nada. Solo cotiza los países con
 * tarifa ENCENDIDA en el panel; si no hay ninguno, la calculadora no se
 * dibuja.
 *
 * Y el mismo día: **avión o barco** («en lo marítimo el peso no aplica»),
 * **libras o kilos**, y el **seguro como casilla opcional**. Solo lectura;
 * todo por zod con tope.
 */
const Entrada = z.object({
  pais: z.string().regex(/^[A-Z]{2}$/),
  modo: z.enum(["aereo", "maritimo"]).default("aereo"),
  unidad: z.enum(["lb", "kg"]).default("lb"),
  peso: z.number().min(0).max(500),
  largoIn: z.number().min(0).max(200).optional(),
  anchoIn: z.number().min(0).max(200).optional(),
  altoIn: z.number().min(0).max(200).optional(),
  valorUsd: z.number().min(0).max(100_000).optional(),
  conSeguro: z.boolean(),
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
  | {
      ok: true;
      modo: "aereo";
      cotizacion: Extract<Cotizacion, { ok: true }>;
      pais: string;
    }
  | {
      ok: true;
      modo: "maritimo";
      cotizacion: Extract<CotizacionMaritima, { ok: true }>;
      pais: string;
    }
  | {
      ok: false;
      error: "entrada" | "sin-tarifa" | "sin-peso" | "sin-medidas";
    };

export async function cotizarPublico(
  _previo: ResultadoCalculadora | null,
  formulario: FormData,
): Promise<ResultadoCalculadora> {
  const leida = Entrada.safeParse({
    pais: String(formulario.get("pais") ?? "").toUpperCase(),
    modo: String(formulario.get("modo") ?? "aereo"),
    unidad: String(formulario.get("unidad") ?? "lb"),
    peso: numero(formulario.get("peso")) ?? 0,
    largoIn: numero(formulario.get("largoIn")),
    anchoIn: numero(formulario.get("anchoIn")),
    altoIn: numero(formulario.get("altoIn")),
    valorUsd: numero(formulario.get("valorUsd")),
    conSeguro: formulario.get("conSeguro") === "on",
  });
  if (!leida.success) return { ok: false, error: "entrada" };
  const e = leida.data;

  const medidas =
    e.largoIn && e.anchoIn && e.altoIn
      ? { largoIn: e.largoIn, anchoIn: e.anchoIn, altoIn: e.altoIn }
      : null;
  const valorDeclaradoCentavos =
    e.valorUsd !== undefined ? Math.round(e.valorUsd * 100) : null;

  if (e.modo === "maritimo") {
    const tarifa = await tarifaMaritimaDe(e.pais);
    const c = cotizarEnvioMaritimo(
      { medidas, valorDeclaradoCentavos, conSeguro: e.conSeguro },
      tarifa,
    );
    if (!c.ok) return { ok: false, error: c.motivo };
    return { ok: true, modo: "maritimo", cotizacion: c, pais: e.pais };
  }

  const tarifa = await tarifaDe(e.pais);
  const c = cotizarEnvio(
    {
      pesoRealLb: aLibras(e.peso, e.unidad),
      medidas,
      valorDeclaradoCentavos,
      conSeguro: e.conSeguro,
    },
    tarifa,
  );
  if (!c.ok) return { ok: false, error: c.motivo };
  return { ok: true, modo: "aereo", cotizacion: c, pais: e.pais };
}

export type PaisCotizable = {
  codigo: string;
  aereo: boolean;
  maritimo: boolean;
  /** Por ciento del seguro (el mayor de los dos modos), para la casilla. */
  seguroPorciento: number;
};

/** Los países que hoy se pueden cotizar, y en qué modo. Solo los encendidos. */
export async function paisesCotizables(): Promise<PaisCotizable[]> {
  const [aereas, maritimas] = await Promise.all([
    listarTarifas(),
    listarTarifasMaritimas(),
  ]);
  const porPais = new Map<string, PaisCotizable>();
  for (const t of aereas) {
    if (!t.activa || t.tarifaLibraCentavos <= 0) continue;
    porPais.set(t.pais, {
      codigo: t.pais,
      aereo: true,
      maritimo: false,
      seguroPorciento: t.seguroPuntosBase / 100,
    });
  }
  for (const t of maritimas) {
    if (!t.activa || t.tarifaPieCentavos <= 0) continue;
    const previo = porPais.get(t.pais);
    porPais.set(t.pais, {
      codigo: t.pais,
      aereo: previo?.aereo ?? false,
      maritimo: true,
      seguroPorciento: Math.max(
        previo?.seguroPorciento ?? 0,
        t.seguroPuntosBase / 100,
      ),
    });
  }
  return [...porPais.values()];
}
