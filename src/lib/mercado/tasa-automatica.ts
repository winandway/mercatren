import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { configuracion } from "@/lib/db/schema";
import { aplicarAjustes } from "@/lib/mercado/ajustes-tasa";

/**
 * LA TASA DEL DÓLAR EN AUTOMÁTICO, CON DOLARAPI.
 *
 * ══ POR QUÉ SE AUTOMATIZÓ (28 ago 2026) ══
 *
 * La primera versión era una casilla manual, y el dueño la tumbó con razón:
 * «una sola persona no puede estar cambiando la tasa todos los días; pasará
 * una semana sin hacerlo y nos hará perder dinero». Una tasa que depende de
 * que alguien se acuerde es una tasa vieja esperando su momento.
 *
 * La fuente es **DolarApi** (cl.dolarapi.com / co.dolarapi.com), la misma que
 * el dueño ya usa en sus otras aplicaciones. Endpoints comprobados en vivo
 * antes de escribir esto: `/v1/cotizaciones/usd` devuelve compra, venta y
 * fecha.
 *
 * ══ SE USA LA VENTA, Y ES DELIBERADO ══
 *
 * De los dos números, «venta» es lo que cuesta COMPRAR dólares — el lado que
 * nos toca cuando el peso cobrado se convierte de vuelta. Usar «compra»
 * pondría el catálogo unos pesos más barato y esa diferencia saldría del
 * margen en cada venta, en silencio.
 *
 * ══ LOS DOS AJUSTES DEL DUEÑO ══
 *
 * Encima de la tasa de la API van dos ajustes que se editan en Configuración,
 * los dos con cero por defecto:
 *
 *   final = api × (1 + porcentaje) + monto fijo
 *
 * El porcentaje protege del movimiento del día (la tasa que se usó al fijar
 * el precio no es la del día que el dinero vuelve); el monto fijo es un
 * colchón en pesos. El orden importa y queda fijado por prueba: primero el
 * porcentaje, después el fijo.
 *
 * ══ SI LA API NO CONTESTA, MANDA LA ÚLTIMA BUENA — CON FECHA Y TOPE ══
 *
 * Cada lectura buena se guarda en `configuracion`. Si DolarApi falla, se usa
 * la última guardada **hasta 7 días**: más vieja que eso, se devuelve null y
 * el candado del catálogo se cierra con su motivo — publicar con una tasa de
 * hace dos semanas es exactamente el fallo que esto existe para evitar. La
 * caída NUNCA es silenciosa: el estado (en vivo / guardada / vencida) viaja
 * con el valor y se enseña en Configuración.
 */

const FUENTES: Record<"CL" | "CO", string> = {
  CL: "https://cl.dolarapi.com/v1/cotizaciones/usd",
  CO: "https://co.dolarapi.com/v1/cotizaciones/usd",
};

/* Los mismos pisos de siempre: por debajo no es una tasa, es un dato roto.
   Y un techo simétrico: una API comprometida o rota que devuelva un millón
   multiplicaría el catálogo entero hacia arriba. */
const LIMITES: Record<"CL" | "CO", { piso: number; techo: number }> = {
  CL: { piso: 10_000, techo: 1_000_000 },
  CO: { piso: 100_000, techo: 10_000_000 },
};

/** Guardadas por país: la última tasa buena y cuándo se leyó. */
const LLAVE_ULTIMA = { CL: "tasa_clp_ultima", CO: "tasa_cop_ultima" } as const;
const LLAVE_FECHA = { CL: "tasa_clp_fecha", CO: "tasa_cop_fecha" } as const;
/** Los ajustes del dueño. */
export const LLAVE_AJUSTE_PB = {
  CL: "tasa_clp_ajuste_pb",
  CO: "tasa_cop_ajuste_pb",
} as const;
export const LLAVE_AJUSTE_FIJO = {
  CL: "tasa_clp_ajuste_fijo",
  CO: "tasa_cop_ajuste_fijo",
} as const;

/** Cuánto vale la última guardada antes de negarse a publicar. */
const VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;
/** No se le pega a la API en cada tarjeta: se recuerda un rato en memoria. */
const CACHE_MS = 90_000;

export type PaisAutomatico = "CL" | "CO";

export type TasaResuelta = {
  /** La tasa FINAL (api + ajustes), en centésimas de peso por dólar. */
  centesimas: number;
  /** La de la API sola, para enseñar el desglose. */
  apiCentesimas: number;
  ajustePb: number;
  ajusteFijoCentesimas: number;
  /** De dónde salió: en vivo, o la última guardada. */
  origen: "en_vivo" | "guardada";
  /** Cuándo se leyó de la API la tasa que se está usando. */
  leidaEn: Date;
};

const memoria = new Map<
  string,
  { hasta: number; valor: TasaResuelta | null }
>();

/** Se llama al guardar un ajuste: la próxima lectura recalcula con lo nuevo. */
export function olvidarTasaEnMemoria(pais: PaisAutomatico): void {
  memoria.delete(pais);
}

async function leerDeLaApi(pais: PaisAutomatico): Promise<number | null> {
  try {
    const control = new AbortController();
    const corte = setTimeout(() => control.abort(), 5_000);
    const respuesta = await fetch(FUENTES[pais], {
      signal: control.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(corte);
    if (!respuesta.ok) return null;

    const datos = (await respuesta.json()) as { venta?: number };
    const centesimas = Math.round(Number(datos.venta) * 100);
    const { piso, techo } = LIMITES[pais];
    /* Fuera de rango se descarta ENTERA: un dato roto de un servicio ajeno no
       puede fijar el precio de un catálogo. */
    if (
      !Number.isFinite(centesimas) ||
      centesimas < piso ||
      centesimas > techo
    ) {
      console.error(`[tasa] DolarApi ${pais} fuera de rango:`, datos.venta);
      return null;
    }
    return centesimas;
  } catch (fallo) {
    console.error(`[tasa] DolarApi ${pais} no contestó:`, fallo);
    return null;
  }
}

async function leerConfig(clave: string): Promise<number | null> {
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, clave))
    .limit(1);
  const n = Number.parseInt(fila?.valor ?? "", 10);
  return Number.isFinite(n) ? n : null;
}

async function guardarConfig(clave: string, valor: string): Promise<void> {
  await getDb()
    .insert(configuracion)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } })
    .catch(() => undefined);
}

export { aplicarAjustes } from "@/lib/mercado/ajustes-tasa";

/**
 * La tasa vigente de un país: DolarApi + los ajustes del panel.
 *
 * Devuelve null solo cuando NO HAY tasa defendible: la API no contesta y la
 * última guardada tiene más de 7 días (o nunca hubo). Ahí el catálogo se
 * niega a publicar, con el motivo — que es el comportamiento de siempre.
 */
export async function tasaAutomatica(
  pais: PaisAutomatico,
): Promise<TasaResuelta | null> {
  const enMemoria = memoria.get(pais);
  if (enMemoria && enMemoria.hasta > Date.now()) return enMemoria.valor;

  const [ajustePb, ajusteFijo] = await Promise.all([
    leerConfig(LLAVE_AJUSTE_PB[pais]).then((v) => v ?? 0),
    leerConfig(LLAVE_AJUSTE_FIJO[pais]).then((v) => v ?? 0),
  ]);

  let apiCentesimas = await leerDeLaApi(pais);
  let origen: "en_vivo" | "guardada" = "en_vivo";
  let leidaEn = new Date();

  if (apiCentesimas !== null) {
    /* La buena se guarda al momento: es lo que sostiene el respaldo. */
    await guardarConfig(LLAVE_ULTIMA[pais], String(apiCentesimas));
    await guardarConfig(LLAVE_FECHA[pais], String(Date.now()));
  } else {
    const guardada = await leerConfig(LLAVE_ULTIMA[pais]);
    const fecha = await leerConfig(LLAVE_FECHA[pais]);
    if (
      guardada !== null &&
      fecha !== null &&
      Date.now() - fecha <= VIGENCIA_MS
    ) {
      apiCentesimas = guardada;
      origen = "guardada";
      leidaEn = new Date(fecha);
    }
  }

  const valor: TasaResuelta | null =
    apiCentesimas === null
      ? null
      : {
          centesimas: aplicarAjustes(apiCentesimas, ajustePb, ajusteFijo),
          apiCentesimas,
          ajustePb,
          ajusteFijoCentesimas: ajusteFijo,
          origen,
          leidaEn,
        };

  memoria.set(pais, { hasta: Date.now() + CACHE_MS, valor });
  return valor;
}
