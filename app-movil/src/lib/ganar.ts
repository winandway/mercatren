import { API_BASE } from "./api";
import type { Idioma } from "./dinero";

/**
 * EL PLAN PRO Y PROMOCIONAR, EN LA APP (5 nov 2026, Fase 4). Direcciones,
 * tipos y reglas puras (las prueba el sitio en `tests/unit/app-movil-ganar.test.ts`).
 * Las reglas son las del servidor (`src/lib/ganar/reglas.ts`); el servidor
 * vuelve a revisar todo. NADA SE COBRA TODAVÍA.
 */
const q = (pais: string, idioma: Idioma) =>
  `pais=${encodeURIComponent(pais)}&idioma=${idioma}`;

export function urlPlan(pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/plan?${q(pais, idioma)}`;
}

export function urlPromociones(pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/promociones?${q(pais, idioma)}`;
}

export const CPC_CENTAVOS = 15;
export const PRESUPUESTO_MINIMO_CENTAVOS = 100;
export const PRESUPUESTO_MAXIMO_CENTAVOS = 5000;

export type EstadoDelPlan = {
  pro: boolean;
  hasta: number | null;
  estado: "prueba" | "activa" | "cancelada" | null;
  enPrueba: boolean;
  puedeProbar: boolean;
  cancelado: boolean;
  publicados: number;
  tope: number;
};

export type Estadisticas = {
  dias: number;
  pedidos: number;
  unidades: number;
  ventasCentavos: number;
  paraTiCentavos: number;
  masVendidos: {
    productoId: string | null;
    titulo: string;
    unidades: number;
    ventasCentavos: number;
  }[];
};

export type RespuestaPlan = {
  plan: EstadoDelPlan;
  precio: { centavos: number; moneda: string };
  topes: { sinPlan: number; pro: number };
  estadisticas: Estadisticas | null;
};

export type Promocion = {
  id: string;
  productoId: string;
  titulo: string;
  estado: "activa" | "pausada";
  presupuestoCentavos: number;
  hoy: { clics: number; gastoCentavos: number };
  ultimos30: { clics: number; gastoCentavos: number };
};

/** De lo que escribe la persona («5», «12.50») a centavos, o `null`. */
export function presupuestoACentavos(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(limpio)) return null;
  const centavos = Math.round(Number(limpio) * 100);
  if (
    centavos < PRESUPUESTO_MINIMO_CENTAVOS ||
    centavos > PRESUPUESTO_MAXIMO_CENTAVOS
  )
    return null;
  return centavos;
}

/** Cuántas personas, como mucho, pueden tocar el producto con ese presupuesto. */
export function clicsPorDia(presupuestoCentavos: number): number {
  /* La última persona puede pagar solo lo que falta para el tope: cuenta. */
  return Math.ceil(presupuestoCentavos / CPC_CENTAVOS);
}

/** ¿Qué se le enseña del plan? */
export function vistaDelPlan(
  p: EstadoDelPlan,
): "ofrecer" | "pro" | "termina" | "terminado" {
  if (p.pro) return p.cancelado ? "termina" : "pro";
  return p.puedeProbar ? "ofrecer" : "terminado";
}
