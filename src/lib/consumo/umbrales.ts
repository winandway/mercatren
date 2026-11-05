/**
 * LA ALARMA DE CONSUMO (5 nov 2026, Fase 0 del plan PLAN-UNA-SOLA-MERCATREN).
 *
 * En septiembre la base llegó a 134 mil millones de filas leídas en un mes
 * (109 dólares de sobrecosto, camino de 775) y nadie se enteró hasta la
 * factura. Esto mira cada hora lo que dice Cloudflare de la base y del cubo y
 * lo pone en tres niveles: verde, aviso y emergencia. En emergencia la tienda
 * se cierra con una línea (`TIENDA_CERRADA` en `lib/tienda-cerrada.ts`).
 *
 * Los topes son nuestros y se ajustan aquí, con su porqué:
 * - Filas leídas: el sobrecosto de septiembre sale de unos 25 mil millones al
 *   mes incluidos (unos 830 millones al día). El aviso salta muy por debajo,
 *   en 50 millones al día, y la emergencia en 300 millones, lejos de los 1.000
 *   millones al día en que avisa la plataforma.
 * - Filas escritas: hoy son cientos al día; un millón ya es un robot escribiendo.
 * - Tamaño: la base vacía de catálogo pesa unos 42 MB y el cubo unos 430 MB.
 *
 * Lo corre `scripts/consumo-base.ts`, que pide los datos con wrangler.
 */
export const TOPES = {
  filasLeidas24h: { aviso: 50_000_000, emergencia: 300_000_000 },
  filasEscritas24h: { aviso: 1_000_000, emergencia: 5_000_000 },
  baseBytes: { aviso: 500_000_000, emergencia: 2_000_000_000 },
  cuboBytes: { aviso: 5_000_000_000, emergencia: 20_000_000_000 },
} as const;

export type Nivel = "verde" | "aviso" | "emergencia";

export type Medida = {
  filasLeidas24h: number;
  filasEscritas24h: number;
  baseBytes: number;
  cuboBytes: number;
};

const ORDEN: Record<Nivel, number> = { verde: 0, aviso: 1, emergencia: 2 };

/** El nivel de una cifra contra su tope. */
export function nivelDe(
  valor: number,
  tope: { aviso: number; emergencia: number },
): Nivel {
  if (!Number.isFinite(valor)) return "aviso";
  if (valor >= tope.emergencia) return "emergencia";
  if (valor >= tope.aviso) return "aviso";
  return "verde";
}

/** El nivel de cada cifra y el peor de todos, que es el que manda. */
export function evaluar(m: Medida): {
  nivel: Nivel;
  detalle: Record<keyof Medida, Nivel>;
} {
  const detalle = {
    filasLeidas24h: nivelDe(m.filasLeidas24h, TOPES.filasLeidas24h),
    filasEscritas24h: nivelDe(m.filasEscritas24h, TOPES.filasEscritas24h),
    baseBytes: nivelDe(m.baseBytes, TOPES.baseBytes),
    cuboBytes: nivelDe(m.cuboBytes, TOPES.cuboBytes),
  };
  const nivel = (Object.values(detalle) as Nivel[]).reduce((peor, n) =>
    ORDEN[n] > ORDEN[peor] ? n : peor,
  );
  return { nivel, detalle };
}

/** «427 MB», «41.8 MB», «1.2 GB» → bytes. Lo que no se entiende vale NaN. */
export function bytesDe(texto: string): number {
  const m = /^\s*([\d.,]+)\s*(B|KB|MB|GB|TB)\s*$/i.exec(texto);
  if (!m) return Number.NaN;
  const numero = Number((m[1] ?? "").replace(/,/g, ""));
  const potencia = { B: 0, KB: 1, MB: 2, GB: 3, TB: 4 }[
    (m[2] ?? "B").toUpperCase() as "B" | "KB" | "MB" | "GB" | "TB"
  ];
  return numero * 1000 ** potencia;
}
