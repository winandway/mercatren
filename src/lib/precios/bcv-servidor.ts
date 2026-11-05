import "server-only";

import { recordadoEnElBorde } from "@/lib/cachecito";
import { tasaDeDolarApi, tasaDelBcv, type TasaBcv } from "@/lib/precios/bcv";

const PORTADA_BCV = "https://www.bcv.org.ve/";
const DOLARAPI_OFICIAL = "https://ve.dolarapi.com/v1/dolares/oficial";
const CABECERAS = { "user-agent": "Mercatren/1.0 (+https://mercatren.com)" };

async function desdeElBcv(): Promise<TasaBcv | null> {
  try {
    const r = await fetch(PORTADA_BCV, {
      signal: AbortSignal.timeout(4000),
      headers: CABECERAS,
    });
    return r.ok ? tasaDelBcv(await r.text()) : null;
  } catch (fallo) {
    console.error("[bcv] la página del BCV no respondió", fallo);
    return null;
  }
}

async function desdeDolarApi(): Promise<TasaBcv | null> {
  try {
    const r = await fetch(DOLARAPI_OFICIAL, {
      signal: AbortSignal.timeout(4000),
      headers: CABECERAS,
    });
    return r.ok ? tasaDeDolarApi(await r.json()) : null;
  } catch (fallo) {
    console.error("[bcv] DolarAPI no respondió", fallo);
    return null;
  }
}
/** El BCV publica una tasa por día: seis horas en la caché del borde bastan. */
const VIDA_MS = 6 * 60 * 60 * 1000;
/** Si el BCV no responde, no se le vuelve a preguntar en diez minutos. */
const ESPERA_SI_FALLA_MS = 10 * 60 * 1000;
let noPreguntarHasta = 0;

/**
 * La tasa oficial del día, leída de la portada del BCV y guardada en la caché
 * del borde. NUNCA escribe en la base (ni por mirar ni por fallar). Si el BCV
 * no responde, devuelve null y la ficha sale sin el equivalente: un servicio
 * ajeno caído no puede tumbar la página donde se vende.
 */
export async function tasaBcvDelDia(): Promise<TasaBcv | null> {
  if (Date.now() < noPreguntarHasta) return null;
  try {
    return await recordadoEnElBorde("tasa-bcv", VIDA_MS, async () => {
      /* Primero el BCV; si su certificado (incompleto) o su página fallan, la
         misma tasa oficial republicada por DolarAPI. */
      const tasa = (await desdeElBcv()) ?? (await desdeDolarApi());
      /* Sin tasa no se guarda nada en la caché: se lanza para no recordar un
         vacío durante seis horas. */
      if (!tasa) throw new Error("sin tasa del BCV ni de DolarAPI");
      return tasa;
    });
  } catch (fallo) {
    noPreguntarHasta = Date.now() + ESPERA_SI_FALLA_MS;
    console.error("[bcv] sin tasa", fallo);
    return null;
  }
}
