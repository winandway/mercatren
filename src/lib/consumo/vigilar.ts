import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";

import { enviarCorreo } from "@/lib/correo/enviar";
import { getDb } from "@/lib/db";
import { configuracion } from "@/lib/db/schema";

import { medirConsumo } from "./medir";
import { debeAvisar, evaluar, type Medida, type Nivel } from "./umbrales";

/**
 * LA ALARMA DE CONSUMO, DENTRO DEL SERVIDOR (5 nov 2026, Fase 0 del plan).
 *
 * La corre el reloj de la plataforma una vez por hora (`yadominios.json` →
 * `/__scheduled` → `/datos/reloj`). Mide con `medir.ts`, pone el nivel con
 * `umbrales.ts`, guarda la última medida en `configuracion` (la lee el
 * canario `/datos/salud`) y manda un correo a soporte SOLO en aviso o
 * emergencia, sin repetirlo antes de 6 horas.
 */
export const LLAVE_CONSUMO = "consumo_ultima_medida";
export const AVISAR_A = "soporte@windoce.com";

export type UltimaMedida = {
  momento: number;
  nivel?: Nivel;
  medida?: Medida;
  detalle?: Record<string, Nivel>;
  /** Por qué no se pudo medir. */
  motivo?: string;
  avisadoEn?: number;
};

export async function ultimaMedida(): Promise<UltimaMedida | null> {
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, LLAVE_CONSUMO))
    .limit(1);
  if (!fila) return null;
  try {
    return JSON.parse(fila.valor) as UltimaMedida;
  } catch {
    return null;
  }
}

async function guardar(valor: UltimaMedida): Promise<void> {
  const texto = JSON.stringify(valor);
  await getDb()
    .insert(configuracion)
    .values({ clave: LLAVE_CONSUMO, valor: texto })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor: texto } });
}

const millones = (n: number) =>
  Number.isFinite(n) ? `${(n / 1_000_000).toFixed(1)} M` : "sin dato";

export async function vigilarConsumo(): Promise<UltimaMedida> {
  const { env } = getCloudflareContext();
  const ahora = Date.now();
  const anterior = await ultimaMedida();
  const r = await medirConsumo(env.CF_ANALYTICS_TOKEN, new Date(ahora));

  if (!r.ok) {
    const sinMedir: UltimaMedida = {
      momento: ahora,
      motivo: r.detalle ? `${r.motivo}: ${r.detalle}` : r.motivo,
      nivel: anterior?.nivel,
      avisadoEn: anterior?.avisadoEn,
    };
    await guardar(sinMedir);
    return sinMedir;
  }

  const { nivel, detalle } = evaluar(r.medida);
  const avisar = debeAvisar(anterior, nivel, ahora);
  const actual: UltimaMedida = {
    momento: ahora,
    nivel,
    medida: r.medida,
    detalle,
    avisadoEn: avisar ? ahora : anterior?.avisadoEn,
  };
  await guardar(actual);

  if (avisar) {
    const m = r.medida;
    const resumen = `Filas leídas en 24 h: ${millones(m.filasLeidas24h)}. Filas escritas: ${millones(m.filasEscritas24h)}. Base: ${millones(m.baseBytes)}B. Cubo: ${millones(m.cuboBytes)}B.`;
    const que =
      nivel === "emergencia"
        ? "EMERGENCIA: si no se explica en minutos, cerrar la tienda con TIENDA_CERRADA = true (src/lib/tienda-cerrada.ts) y publicar."
        : "AVISO: revisar qué subió (robots, un listado sin guardar, una tarea escribiendo) antes de que llegue a emergencia.";
    await enviarCorreo({
      a: AVISAR_A,
      asunto: `Mercatren: consumo en ${nivel.toUpperCase()}`,
      texto: `${que}\n\n${resumen}\n\nDetalle por cifra: ${JSON.stringify(detalle)}\nCanario: https://mercatren.com/datos/salud`,
      html: `<p><strong>${que}</strong></p><p>${resumen}</p><p>Detalle por cifra: <code>${JSON.stringify(detalle)}</code></p><p>Canario: https://mercatren.com/datos/salud</p>`,
    }).catch((fallo) => console.error("[consumo] no salió el correo:", fallo));
  }
  return actual;
}
