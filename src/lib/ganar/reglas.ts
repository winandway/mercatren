/**
 * FASE 4 · GANAR MÁS: LAS REGLAS, PURAS (5 nov 2026).
 *
 * El plan Pro y los productos promocionados, tal como los decidió el plan
 * (`docs/PLAN-UNA-SOLA-MERCATREN.md`, sección 9) y los detalles que faltaban
 * (`docs/FASE-4-GANAR-MAS.md`). Aquí no hay base ni red: solo cuentas, para
 * que cada regla tenga su prueba (`tests/unit/ganar-reglas.test.ts`).
 *
 * NADA DE ESTO COBRA. El cobro está apagado hasta el sí de Richard: el mes
 * gratis corre y lo promocionado se anota «por cobrar».
 */

/* ── El plan Pro ─────────────────────────────────────────────────────────── */

/** 9,99 dólares al mes (Etsy Plus está a 10). */
export const PRECIO_PRO_CENTAVOS = 999;
export const DIAS_DE_PRUEBA = 30;
/** Productos publicados a la vez: sin plan y con Pro. */
export const TOPE_SIN_PLAN = 100;
export const TOPE_PRO = 5000;

export type EstadoDelPlan = "prueba" | "activa" | "cancelada";

export type PlanGuardado = {
  estado: EstadoDelPlan;
  /** Hasta cuándo dura el mes gratis (ms). */
  pruebaHasta: number | null;
  /** Hasta cuándo está pagado (ms); `null` mientras no se cobra. */
  pagadoHasta: number | null;
};

const DIA = 24 * 60 * 60 * 1000;

/** Hasta cuándo tiene Pro: lo último entre el mes gratis y lo pagado. */
export function proHasta(plan: PlanGuardado | null): number | null {
  if (!plan) return null;
  const fechas = [plan.pruebaHasta, plan.pagadoHasta].filter(
    (f): f is number => typeof f === "number",
  );
  return fechas.length ? Math.max(...fechas) : null;
}

/**
 * ¿Tiene Pro ahora? Cancelar no quita lo que ya corre: se usa hasta el
 * final del mes (gratis o pagado), como en Etsy.
 */
export function tienePro(plan: PlanGuardado | null, ahora: number): boolean {
  const hasta = proHasta(plan);
  return hasta !== null && ahora < hasta;
}

/** El mes gratis es uno por tienda: si ya hubo un plan, no hay otro. */
export function puedeEmpezarPrueba(planPrevio: PlanGuardado | null): boolean {
  return planPrevio === null;
}

export function nuevaPrueba(ahora: number): PlanGuardado {
  return {
    estado: "prueba",
    pruebaHasta: ahora + DIAS_DE_PRUEBA * DIA,
    pagadoHasta: null,
  };
}

export function topeDeProductos(pro: boolean): number {
  return pro ? TOPE_PRO : TOPE_SIN_PLAN;
}

/**
 * ¿Se puede publicar uno más? Quien ya tiene más de los permitidos conserva
 * lo publicado (nadie pierde lo que vende); lo que no puede es sumar otro.
 * Editar un producto que YA está publicado nunca se frena.
 */
export function puedePublicarOtro(o: {
  publicados: number;
  pro: boolean;
  yaEstabaPublicado: boolean;
}): boolean {
  if (o.yaEstabaPublicado) return true;
  return o.publicados < topeDeProductos(o.pro);
}

/* ── Los productos promocionados ─────────────────────────────────────────── */

/** 0,15 dólares por clic. */
export const CPC_CENTAVOS = 15;
/** Presupuesto diario que elige el vendedor: de 1 a 50 dólares. */
export const PRESUPUESTO_MINIMO_CENTAVOS = 100;
export const PRESUPUESTO_MAXIMO_CENTAVOS = 5000;
/** Como mucho 2 promocionados por cada 12 productos de una lista. */
export const PROMOCIONADOS_POR_DOCENA = 2;

export function presupuestoValido(centavos: number): boolean {
  return (
    Number.isInteger(centavos) &&
    centavos >= PRESUPUESTO_MINIMO_CENTAVOS &&
    centavos <= PRESUPUESTO_MAXIMO_CENTAVOS
  );
}

/**
 * El presupuesto como lo escribe la persona («5», «12.50», «12,5») a
 * centavos, o `null` si no es un número de dólares válido entre 1 y 50.
 * Sin expresiones regulares: se recorre carácter por carácter.
 */
export function presupuestoDesdeTexto(texto: string): number | null {
  const limpio = String(texto ?? "")
    .trim()
    .replace(",", ".");
  if (limpio === "" || limpio.length > 6) return null;
  const partes = limpio.split(".");
  if (partes.length > 2) return null;
  const [entero = "", decimales = ""] = partes;
  const soloCifras = (t: string) => [...t].every((c) => c >= "0" && c <= "9");
  if (!entero || !soloCifras(entero) || !soloCifras(decimales)) return null;
  if (decimales.length > 2) return null;
  const centavos = Math.round(Number(limpio) * 100);
  return presupuestoValido(centavos) ? centavos : null;
}

/**
 * LO QUE SE COBRA POR UN CLIC, CON EL TOPE DEL DÍA.
 *
 * «Nunca se cobra más que el presupuesto»: si el clic pasaría el tope, se
 * cobra solo lo que falta para llegar a él; si ya se llegó, el clic es gratis.
 */
export function cargoDelClic(o: {
  gastadoHoyCentavos: number;
  presupuestoCentavos: number;
  cpcCentavos?: number;
}): number {
  const cpc = o.cpcCentavos ?? CPC_CENTAVOS;
  const queda = o.presupuestoCentavos - o.gastadoHoyCentavos;
  return Math.max(0, Math.min(cpc, queda));
}

/** ¿Sigue saliendo hoy? Solo mientras le quede presupuesto. */
export function sigueSaliendoHoy(o: {
  gastadoHoyCentavos: number;
  presupuestoCentavos: number;
}): boolean {
  return o.gastadoHoyCentavos < o.presupuestoCentavos;
}

/** El día del gasto, en UTC (el presupuesto se reinicia a medianoche UTC). */
export function diaDelGasto(ahora: number): string {
  return new Date(ahora).toISOString().slice(0, 10);
}

/**
 * Los robots no hacen clics que se cobren. Lista corta y conocida: lo que no
 * dice ser un navegador o una app no paga.
 */
const ROBOT =
  /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|httpclient|headless|lighthouse|monitor|vigilante/i;

export function esRobot(agente: string | null | undefined): boolean {
  if (!agente || agente.trim().length < 8) return true;
  return ROBOT.test(agente);
}

/**
 * Mezcla los promocionados en una lista: como mucho 2 por cada 12, en los
 * puestos 1 y 7 de cada docena, marcados `enPuestoPagado` (la marca no pisa
 * nada del producto: los datos del clic viajan aparte). Si un promocionado ya
 * estaba en la lista normal, SUBE a su puesto patrocinado (no sale dos
 * veces): para eso paga el vendedor.
 */
export function mezclarPromocionados<T extends { id: string }>(
  lista: T[],
  promocionados: T[],
): (T & { enPuestoPagado?: true })[] {
  const promos = promocionados.filter(
    (p, i) => promocionados.findIndex((q) => q.id === p.id) === i,
  );
  const pagados = new Set(promos.map((p) => p.id));
  const normales = lista.filter((p) => !pagados.has(p.id));
  const salida: (T & { enPuestoPagado?: true })[] = [];
  let i = 0;
  let usados = 0;
  while (i < normales.length || usados < promos.length) {
    const puesto = salida.length % 12;
    if ((puesto === 0 || puesto === 6) && usados < promos.length) {
      salida.push({ ...promos[usados]!, enPuestoPagado: true });
      usados++;
    } else if (i < normales.length) {
      salida.push(normales[i]!);
      i++;
    } else {
      break;
    }
  }
  return salida;
}

/**
 * El directorio de tiendas con las de Pro primero (el beneficio «tienda
 * destacada»), sin cambiar el orden de las demás entre sí.
 */
export function proPrimero<T extends { slug: string }>(
  lista: T[],
  conPro: Set<string>,
): (T & { pro: boolean })[] {
  const marcadas = lista.map((t) => ({ ...t, pro: conPro.has(t.slug) }));
  return [...marcadas.filter((t) => t.pro), ...marcadas.filter((t) => !t.pro)];
}
