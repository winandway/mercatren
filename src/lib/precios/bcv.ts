/**
 * EL EQUIVALENTE EN BOLÍVARES A LA TASA OFICIAL DEL BCV (5 nov 2026, Venezuela).
 *
 * En Venezuela el precio se publica en dólares, y la SUNDDE fiscaliza que los
 * comercios usen la tasa oficial del Banco Central. Mostrar debajo del precio
 * un «equivalente referencial en bolívares» es lo que recomienda la página
 * para el contador (`docs/paises/VENEZUELA-IMPUESTOS-Y-LEGAL.md`, sección 3).
 *
 * Esta parte es pura: leer la tasa de la página del BCV y hacer la cuenta.
 */

export type TasaBcv = {
  /** Bolívares por cada dólar. */
  bsPorUsd: number;
  /** AAAA-MM-DD de la «Fecha Valor» que publica el BCV. */
  fechaValor: string;
};

/** Lee la tasa del dólar y su fecha de la portada del BCV, o null. */
export function tasaDelBcv(html: string): TasaBcv | null {
  const i = html.indexOf('id="dolar"');
  if (i < 0) return null;
  const tramo = html.slice(i, i + 1200);
  const numero = /<strong[^>]*>\s*([\d.]+,\d+)\s*<\/strong>/.exec(tramo)?.[1];
  if (!numero) return null;
  const bsPorUsd = Number(numero.replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(bsPorUsd) || bsPorUsd <= 0) return null;
  const j = html.indexOf("Fecha Valor", i);
  const fecha =
    j < 0
      ? null
      : /content="(\d{4}-\d{2}-\d{2})/.exec(html.slice(j, j + 400))?.[1];
  if (!fecha) return null;
  return { bsPorUsd, fechaValor: fecha };
}

/**
 * La misma tasa oficial, republicada por DolarAPI (ve.dolarapi.com, fuente
 * «oficial» = BCV). Hace falta porque la página del BCV sirve su certificado
 * incompleto y el servidor la rechaza («unable to verify the first
 * certificate», visto el 5 nov 2026).
 */
export function tasaDeDolarApi(json: unknown): TasaBcv | null {
  if (!json || typeof json !== "object") return null;
  const j = json as {
    fuente?: unknown;
    promedio?: unknown;
    fechaActualizacion?: unknown;
  };
  if (j.fuente !== "oficial") return null;
  const bsPorUsd = Number(j.promedio);
  const fecha =
    typeof j.fechaActualizacion === "string"
      ? /^(\d{4}-\d{2}-\d{2})/.exec(j.fechaActualizacion)?.[1]
      : undefined;
  if (!Number.isFinite(bsPorUsd) || bsPorUsd <= 0 || !fecha) return null;
  return { bsPorUsd, fechaValor: fecha };
}

/** El precio en centavos de dólar, en bolívares (con dos decimales). */
export function aBolivares(centavosUsd: number, tasa: TasaBcv): number {
  return Math.round(centavosUsd * tasa.bsPorUsd) / 100;
}

/** «Bs. 2.835,45» en español (como en Venezuela); «Bs. 2,835.45» en inglés. */
export function textoBolivares(
  bolivares: number,
  idioma: "es" | "en" = "es",
): string {
  return `Bs. ${new Intl.NumberFormat(idioma === "en" ? "en-US" : "es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(bolivares)}`;
}
