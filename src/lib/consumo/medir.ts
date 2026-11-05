import type { Medida } from "./umbrales";

/**
 * CÓMO SE MIDE EL CONSUMO DESDE EL SERVIDOR (5 nov 2026).
 *
 * El sitio no puede contarse a sí mismo: Drizzle pide casi todas las lecturas
 * por `raw()`, que no devuelve cuántas filas leyó. Así que se le pregunta a
 * Cloudflare, por su API de estadísticas (GraphQL), con una llave SOLO de
 * lectura (`CF_ANALYTICS_TOKEN`): las filas leídas y escritas de la base en
 * 24 h, el tamaño de la base y el del cubo.
 *
 * Lo puro (la consulta y cómo se lee la respuesta) está aquí y tiene pruebas;
 * guardarlo y avisar está en `vigilar.ts`.
 */
export const CUENTA = "4d9e131f2c18bc10ac4700d689d5556c";
/** La base `site-mercatren-db` (la crea YaDominios Cloud para el sitio). */
export const BASE_ID = "6e72598e-8f2f-4244-8636-b93d2692c397";
export const CUBO = "site-mercatren";
const GRAPHQL = "https://api.cloudflare.com/client/v4/graphql";

const QUERY = `query Consumo($cuenta: String!, $base: String!, $cubo: String!, $desde: Time!, $hasta: Time!, $dia: Date!) {
  viewer {
    accounts(filter: { accountTag: $cuenta }) {
      d1AnalyticsAdaptiveGroups(limit: 10000, filter: { databaseId: $base, datetimeHour_geq: $desde, datetimeHour_leq: $hasta }) {
        sum { rowsRead rowsWritten }
      }
      d1StorageAdaptiveGroups(limit: 1, filter: { databaseId: $base, date_geq: $dia }, orderBy: [date_DESC]) {
        max { databaseSizeBytes }
        dimensions { date }
      }
      r2StorageAdaptiveGroups(limit: 1, filter: { bucketName: $cubo, datetime_geq: $desde }, orderBy: [datetime_DESC]) {
        max { payloadSize metadataSize }
        dimensions { datetime }
      }
    }
  }
}`;

/** El cuerpo de la consulta para las últimas 24 h. */
export function consultaDeConsumo(ahora: Date): {
  query: string;
  variables: Record<string, string>;
} {
  const desde = new Date(ahora.getTime() - 24 * 60 * 60_000);
  const dia = new Date(ahora.getTime() - 2 * 24 * 60 * 60_000);
  return {
    query: QUERY,
    variables: {
      cuenta: CUENTA,
      base: BASE_ID,
      cubo: CUBO,
      desde: desde.toISOString().replace(/\.\d{3}Z$/, "Z"),
      hasta: ahora.toISOString().replace(/\.\d{3}Z$/, "Z"),
      dia: dia.toISOString().slice(0, 10),
    },
  };
}

type Grupo<T> = { sum?: T; max?: T };
type Respuesta = {
  data?: {
    viewer?: {
      accounts?: Array<{
        d1AnalyticsAdaptiveGroups?: Grupo<{
          rowsRead?: number;
          rowsWritten?: number;
        }>[];
        d1StorageAdaptiveGroups?: Grupo<{ databaseSizeBytes?: number }>[];
        r2StorageAdaptiveGroups?: Grupo<{
          payloadSize?: number;
          metadataSize?: number;
        }>[];
      }>;
    };
  } | null;
  errors?: Array<{ message?: string }> | null;
};

/**
 * La medida, leída de la respuesta. Las filas son la SUMA de todas las horas;
 * los tamaños, el último dato. Sin datos de algo → NaN, que la alarma marca en
 * aviso: una cifra que no se pudo leer nunca pasa por verde.
 */
export function medidaDe(respuesta: unknown): Medida | null {
  const r = respuesta as Respuesta;
  const cuenta = r?.data?.viewer?.accounts?.[0];
  if (!cuenta) return null;
  const horas = cuenta.d1AnalyticsAdaptiveGroups ?? [];
  const suma = (campo: "rowsRead" | "rowsWritten") =>
    horas.reduce((total, g) => total + (Number(g.sum?.[campo]) || 0), 0);
  const base = cuenta.d1StorageAdaptiveGroups?.[0]?.max?.databaseSizeBytes;
  const cubo = cuenta.r2StorageAdaptiveGroups?.[0]?.max;
  return {
    filasLeidas24h: suma("rowsRead"),
    filasEscritas24h: suma("rowsWritten"),
    baseBytes: typeof base === "number" ? base : Number.NaN,
    cuboBytes:
      typeof cubo?.payloadSize === "number"
        ? cubo.payloadSize + (Number(cubo.metadataSize) || 0)
        : Number.NaN,
  };
}

export type ResultadoMedida =
  | { ok: true; medida: Medida }
  | { ok: false; motivo: "sin_llave" | "error"; detalle?: string };

/** Pregunta a Cloudflare. Sin llave no se pregunta nada. */
export async function medirConsumo(
  llave: string | undefined,
  ahora: Date = new Date(),
  pedir: typeof fetch = fetch,
): Promise<ResultadoMedida> {
  if (!llave) return { ok: false, motivo: "sin_llave" };
  try {
    const r = await pedir(GRAPHQL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${llave}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(consultaDeConsumo(ahora)),
    });
    const cuerpo = (await r.json()) as Respuesta;
    if (cuerpo.errors?.length) {
      return {
        ok: false,
        motivo: "error",
        detalle: cuerpo.errors.map((e) => e.message ?? "").join(" · "),
      };
    }
    const medida = medidaDe(cuerpo);
    return medida
      ? { ok: true, medida }
      : { ok: false, motivo: "error", detalle: "respuesta sin la cuenta" };
  } catch (fallo) {
    return { ok: false, motivo: "error", detalle: String(fallo) };
  }
}
