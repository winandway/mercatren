/**
 * EL PRESUPUESTO DE LA BASE: LA PIEZA ÚNICA QUE CUENTA Y FRENA (5 nov 2026).
 *
 * Regla de Richard «La nube no se come el dinero»: toda base pasa por una sola
 * pieza que cuenta filas leídas y escritas, con tope; si se pasa, la tarea se
 * frena, queda en el registro de errores y salta el canario. Una factura de
 * Cloudflare iba camino de 136 dólares, 97 en escrituras, con dos o tres
 * clientes: siempre fue código nuestro escribiendo de más.
 *
 * Cómo funciona: `getDb()` envuelve la base (`env.DB`) con `conPresupuesto`.
 * Cada respuesta de Cloudflare trae cuántas filas leyó y escribió (`meta`), y
 * aquí se suman por instancia, en ventanas de una hora.
 *
 * - Una sentencia que escribe más de `TOPE_ESCRITAS_POR_SENTENCIA` filas queda
 *   en el registro de errores (ya se hizo: avisa para buscar al culpable).
 * - Cuando la instancia pasa de `TOPE_ESCRITAS_POR_HORA`, las escrituras
 *   siguientes de esa hora se FRENAN antes de llegar a la base
 *   (`PresupuestoAgotado`). Leer sigue funcionando: la tienda no se cae.
 *
 * Lo que NO ve: las lecturas que Drizzle hace por `raw()` (no traen `meta`).
 * El total real de la base lo mide la alarma de cada hora con la API de
 * estadísticas de Cloudflare (`lib/consumo/`).
 */
export const TOPE_ESCRITAS_POR_SENTENCIA = 5_000;
export const TOPE_ESCRITAS_POR_HORA = 50_000;
const UNA_HORA_MS = 60 * 60_000;

export class PresupuestoAgotado extends Error {
  constructor() {
    super(
      `Presupuesto de escrituras agotado: más de ${TOPE_ESCRITAS_POR_HORA} filas en una hora en esta instancia. Ver src/lib/db/presupuesto.ts.`,
    );
    this.name = "PresupuestoAgotado";
  }
}

type Meta = { rows_read?: number; rows_written?: number } | undefined;

export class Presupuesto {
  leidas = 0;
  escritas = 0;
  desde: number;
  private avisado = false;

  constructor(
    private readonly ahora: () => number = Date.now,
    private readonly topeHora = TOPE_ESCRITAS_POR_HORA,
    private readonly topeSentencia = TOPE_ESCRITAS_POR_SENTENCIA,
  ) {
    this.desde = ahora();
  }

  private ventana(): void {
    if (this.ahora() - this.desde >= UNA_HORA_MS) {
      this.desde = this.ahora();
      this.leidas = 0;
      this.escritas = 0;
      this.avisado = false;
    }
  }

  /** ¿Queda presupuesto para escribir en esta hora? */
  puedeEscribir(): boolean {
    this.ventana();
    return this.escritas < this.topeHora;
  }

  /** Suma lo que dijo Cloudflare de una sentencia. */
  anotar(meta: Meta): void {
    this.ventana();
    const leidas = Number(meta?.rows_read) || 0;
    const escritas = Number(meta?.rows_written) || 0;
    this.leidas += leidas;
    this.escritas += escritas;
    if (escritas > this.topeSentencia) {
      console.error(
        `[presupuesto] una sentencia escribió ${escritas} filas (tope ${this.topeSentencia}): buscar al culpable.`,
      );
    }
    if (this.escritas >= this.topeHora && !this.avisado) {
      this.avisado = true;
      console.error(
        `[presupuesto] ${this.escritas} filas escritas en una hora en esta instancia: se frenan las escrituras hasta la hora siguiente.`,
      );
    }
  }

  estado() {
    this.ventana();
    return {
      leidasEstaHora: this.leidas,
      escritasEstaHora: this.escritas,
      agotado: this.escritas >= this.topeHora,
    };
  }
}

/** ¿Esta sentencia escribe? Se mira antes de mandarla, para poder frenarla. */
export function escribe(sql: string): boolean {
  return /^\s*(with\b[\s\S]*?\)\s*)?(insert|update|delete|replace)\b/i.test(
    sql,
  );
}

/** Una por instancia: la cuenta de todas las peticiones que atiende. */
export const PRESUPUESTO = new Presupuesto();

type Sentencia = {
  bind: (...valores: unknown[]) => Sentencia;
  run: (...a: unknown[]) => Promise<{ meta?: Meta }>;
  all: (...a: unknown[]) => Promise<{ meta?: Meta }>;
};
type Base = {
  prepare: (sql: string) => Sentencia;
  batch: (sentencias: Sentencia[]) => Promise<Array<{ meta?: Meta }>>;
};

/**
 * La base envuelta. Todo lo que no es preparar, ejecutar o agrupar pasa tal
 * cual a la base de verdad; las sentencias agrupadas se desenvuelven antes de
 * mandarlas, porque Cloudflare solo acepta las suyas.
 */
export function conPresupuesto<T extends object>(
  base: T,
  p: Presupuesto = PRESUPUESTO,
): T {
  const reales = new WeakMap<object, Sentencia>();

  function envolver(real: Sentencia, sql: string): Sentencia {
    const sentencia = new Proxy(real as object, {
      get(objetivo, prop) {
        if (prop === "bind") {
          return (...valores: unknown[]) =>
            envolver((objetivo as Sentencia).bind(...valores), sql);
        }
        if (prop === "run" || prop === "all") {
          return async (...a: unknown[]) => {
            if (escribe(sql) && !p.puedeEscribir()) {
              throw new PresupuestoAgotado();
            }
            const r = await (objetivo as Sentencia)[prop](...a);
            p.anotar(r?.meta);
            return r;
          };
        }
        const valor = Reflect.get(objetivo, prop, objetivo) as unknown;
        return typeof valor === "function"
          ? (valor as (...a: unknown[]) => unknown).bind(objetivo)
          : valor;
      },
    }) as Sentencia;
    reales.set(sentencia, real);
    return sentencia;
  }

  return new Proxy(base, {
    get(objetivo, prop) {
      if (prop === "prepare") {
        return (sql: string) =>
          envolver((objetivo as unknown as Base).prepare(sql), sql);
      }
      if (prop === "batch") {
        return async (sentencias: Sentencia[]) => {
          if (!p.puedeEscribir()) throw new PresupuestoAgotado();
          const r = await (objetivo as unknown as Base).batch(
            sentencias.map((s) => reales.get(s) ?? s),
          );
          for (const x of r) p.anotar(x?.meta);
          return r;
        };
      }
      const valor = Reflect.get(objetivo, prop, objetivo) as unknown;
      return typeof valor === "function"
        ? (valor as (...a: unknown[]) => unknown).bind(objetivo)
        : valor;
    },
  });
}
