import "server-only";
import {
  LLAVE_SIN_PUNTOS,
  esSinPuntos,
  esperarHasta,
  minutosParaVolver,
  sigueSinPuntos,
} from "@/lib/cj/puntos";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { configuracion } from "@/lib/db/schema";

/**
 * LA PUERTA A CJ DROPSHIPPING.
 *
 * ══ QUÉ ES ESTO Y PARA QUÉ ══
 *
 * CJ surte el catálogo de **Estados Unidos**. Es el proveedor que desbloquea
 * Google Merchant Center: una tienda con entrega real en EE. UU., que es
 * justamente lo que hoy no tenemos y por lo que el alta quedó parada en el
 * paso 4 de 5.
 *
 * ══ DOS CREDENCIALES DISTINTAS, Y CONVIENE NO CONFUNDIRLAS ══
 *
 * - **La API Key** (`CJ_API_KEY`) es la que se guarda. No caduca sola y es la
 *   que autoriza a pedir todo lo demás.
 * - **El access token** se pide con ella y **dura 15 días**. Es el que viaja en
 *   cada llamada.
 *
 * Por eso esto no es «pegar una clave y olvidarse»: el token hay que renovarlo.
 * Si caducara en silencio, el catálogo se congelaría —precios y existencias
 * viejos— sin que ninguna pantalla dijera nada, que es la peor forma de
 * romperse.
 *
 * ══ EL TOKEN SE GUARDA EN LA BASE, NO EN MEMORIA ══
 *
 * El sitio corre en el borde: cada petición puede caer en una máquina distinta
 * y una variable de módulo no sobrevive. Guardarlo en `configuracion` —donde ya
 * vive la clave de sesiones— hace que se pida una vez cada quince días y no una
 * vez por visita. CJ además limita las llamadas por minuto: pedir el token en
 * cada consulta sería gastarse ese límite en la puerta.
 *
 * ══ SI CJ NO CONTESTA, EL SITIO SIGUE ══
 *
 * Nada de esto es requisito para vender lo de Venezuela. Un fallo aquí deja el
 * catálogo de EE. UU. como estaba y se dice en pantalla; no tumba nada.
 */

const BASE = "https://developers.cjdropshipping.com/api2.0/v1";

/** Dónde se guarda el token vigente y hasta cuándo vale. */
const LLAVE_TOKEN = "cj_access_token";
const LLAVE_VENCE = "cj_access_token_vence";

/**
 * Se renueva un día ANTES de que caduque.
 *
 * Apurar hasta el último minuto significa que la renovación cae justo cuando
 * alguien está sincronizando, y si ese día CJ no contesta, el catálogo se queda
 * sin token hasta que alguien lo note.
 */
const MARGEN_MS = 24 * 60 * 60 * 1000;

export type RespuestaCj<T> =
  { ok: true; datos: T } | { ok: false; motivo: string };

/**
 * La llave, recortada.
 *
 * Al pegar una credencial en el panel de la plataforma es facilísimo arrastrar
 * un salto de línea, y CJ devuelve el mismo error que si la llave fuera falsa.
 * Recortar no cuesta nada y ahorra una tarde buscando dónde está el fallo.
 */
function apiKey(): string | undefined {
  return getCloudflareContext().env.CJ_API_KEY?.trim() || undefined;
}

export function cjConfigurado(): boolean {
  return Boolean(apiKey());
}

async function leerGuardado(clave: string): Promise<string | null> {
  const [fila] = await getDb()
    .select({ valor: configuracion.valor })
    .from(configuracion)
    .where(eq(configuracion.clave, clave))
    .limit(1)
    .catch(() => []);
  return fila?.valor ?? null;
}

async function guardar(clave: string, valor: string): Promise<void> {
  const db = getDb();
  await db
    .insert(configuracion)
    .values({ clave, valor })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor } })
    .catch((fallo) => {
      /* Si no se puede guardar, la llamada de hoy funciona igual: solo se
         volverá a pedir el token la próxima vez. Molesto, no roto. */
      console.error("[cj] no se pudo guardar el token:", fallo);
    });
}

/** Pide un token nuevo con la API Key. */
async function pedirToken(llave: string): Promise<RespuestaCj<string>> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: llave }),
    });
  } catch (fallo) {
    console.error("[cj] no se pudo hablar con CJ:", fallo);
    return { ok: false, motivo: "No se pudo conectar con CJ." };
  }

  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    result?: boolean;
    message?: string;
    data?: { accessToken?: string; accessTokenExpiryDate?: string };
  };

  const token = cuerpo.data?.accessToken;
  if (!respuesta.ok || !token) {
    /* Se devuelve el motivo que dio CJ: «no se pudo» obliga a entrar a su panel
       a adivinar, que es justo lo que esto viene a evitar. */
    return {
      ok: false,
      motivo: cuerpo.message ?? `CJ respondió ${respuesta.status}.`,
    };
  }

  /* Si CJ no manda la fecha de caducidad se asume el mínimo documentado —15
     días— menos el margen. Suponer más sería confiar en un dato que no vino. */
  const vence = cuerpo.data?.accessTokenExpiryDate
    ? Date.parse(cuerpo.data.accessTokenExpiryDate)
    : Date.now() + 15 * 24 * 60 * 60 * 1000;

  await guardar(LLAVE_TOKEN, token);
  await guardar(LLAVE_VENCE, String(Number.isFinite(vence) ? vence : 0));

  return { ok: true, datos: token };
}

/**
 * El token vigente: el guardado si todavía sirve, o uno nuevo.
 */
export async function tokenDeCj(): Promise<RespuestaCj<string>> {
  const llave = apiKey();
  if (!llave) {
    return { ok: false, motivo: "Falta la variable CJ_API_KEY." };
  }

  const guardado = await leerGuardado(LLAVE_TOKEN);
  const vence = Number(await leerGuardado(LLAVE_VENCE)) || 0;

  if (guardado && vence - MARGEN_MS > Date.now()) {
    return { ok: true, datos: guardado };
  }

  return pedirToken(llave);
}

/** Anota hasta cuándo no vale la pena volver a llamar a CJ. Nunca lanza. */
async function anotarSinPuntos(motivo: string | undefined): Promise<void> {
  try {
    const { getDb } = await import("@/lib/db");
    const { configuracion } = await import("@/lib/db/schema");
    const hasta = String(esperarHasta(Date.now()));
    await getDb()
      .insert(configuracion)
      .values({ clave: LLAVE_SIN_PUNTOS, valor: hasta })
      .onConflictDoUpdate({
        target: configuracion.clave,
        set: { valor: hasta },
      });
    console.error(`[cj] sin puntos de API: ${motivo ?? ""}`);
  } catch (fallo) {
    console.error("[cj] no se pudo anotar la pausa por puntos:", fallo);
  }
}

/**
 * Una llamada a CJ con el token ya puesto.
 *
 * ══ SI NO QUEDAN PUNTOS DEL DÍA, NI SE LLAMA (3 sep 2026) ══
 *
 * CJ reparte puntos de API por día y se acaban («Insufficient API points…
 * Remaining: 0»). Pasó con la importación de 44.035 productos. Cada llamada
 * de más devuelve el mismo error y se come el tiempo del reloj sin traer
 * nada, así que se anota hasta cuándo esperar y mientras tanto se contesta
 * con el motivo de verdad. Ver `puntos.ts`.
 */
export async function llamarCj<T>(
  ruta: string,
  opciones?: { metodo?: string; cuerpo?: unknown },
): Promise<RespuestaCj<T>> {
  const pausa = await leerGuardado(LLAVE_SIN_PUNTOS);
  if (sigueSinPuntos(pausa, Date.now())) {
    return {
      ok: false,
      motivo: `CJ no tiene puntos de API para hoy. Vuelve a intentar en ${minutosParaVolver(pausa, Date.now())} min.`,
    };
  }

  const token = await tokenDeCj();
  if (!token.ok) return token;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: opciones?.metodo ?? "GET",
      headers: {
        "content-type": "application/json",
        "CJ-Access-Token": token.datos,
      },
      body: opciones?.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      cache: "no-store",
    });
  } catch (fallo) {
    console.error("[cj] no se pudo llamar a CJ:", fallo);
    return { ok: false, motivo: "No se pudo conectar con CJ." };
  }

  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    result?: boolean;
    message?: string;
    data?: T;
  };

  if (!respuesta.ok || cuerpo.result === false) {
    if (esSinPuntos(cuerpo.message)) await anotarSinPuntos(cuerpo.message);
    await anotarComoFue(false);
    return {
      ok: false,
      motivo: cuerpo.message ?? `CJ respondió ${respuesta.status}.`,
    };
  }

  await anotarComoFue(true);
  return { ok: true, datos: cuerpo.data as T };
}

/**
 * CÓMO LE FUE A ESTA LLAMADA, PARA NO TENER QUE PREGUNTARLO (5 sep 2026).
 *
 * La sonda de salud gastaba **50 puntos** en un `/product/list` solo para
 * saber si CJ está vivo — y la llamaba el vigilante cada 20 minutos Y cada
 * visita a `/datos/salud`, que es pública. Eran miles de puntos al día en
 * preguntar en vez de publicar.
 *
 * El sistema ya le habla a CJ todo el día. Se anota el resultado aquí y la
 * sonda lo lee: cero puntos, y encima más honesto — dice cómo le fue a una
 * llamada del trabajo de verdad, no a una de prueba.
 *
 * Nunca lanza ni frena la llamada: es un apunte al margen.
 */
async function anotarComoFue(ok: boolean): Promise<void> {
  try {
    const { getDb } = await import("@/lib/db");
    const { configuracion } = await import("@/lib/db/schema");
    const { LLAVE_ULTIMA_LLAMADA } = await import("@/lib/cj/puntos");
    const valor = JSON.stringify({ ok, enMs: Date.now() });
    await getDb()
      .insert(configuracion)
      .values({ clave: LLAVE_ULTIMA_LLAMADA, valor })
      .onConflictDoUpdate({
        target: configuracion.clave,
        set: { valor },
      });
  } catch {
    /* Un apunte que falla no puede tumbar una compra ni un afinado. */
  }
}
