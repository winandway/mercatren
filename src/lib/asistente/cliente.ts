import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  baseDelAgente,
  motivoDelEstado,
  segundosDeEspera,
  type MotivoFallo,
  type RespuestaAgente,
} from "@/lib/asistente/sesion";

/**
 * LA PUERTA AL AGENTE OPERATIVO.
 *
 * ══ EL TOKEN NO SALE DE AQUÍ, Y ESA ES TODA LA PIEZA ══
 *
 * `AGENTE_TOKEN` identifica a la vez a la cuenta y a la EMPRESA. Quien lo
 * tenga habla con el agente como si fuera Mercatren: le puede preguntar por la
 * operación y pedirle acciones. Por eso vive en las variables del servidor y
 * **jamás** viaja al navegador — ni en el HTML, ni en una respuesta, ni en un
 * mensaje de error.
 *
 * Todo pasa por la ruta `/datos/asistente/...` de este sitio: el navegador le
 * manda el texto, el servidor le pega el token y devuelve solo lo que hay que
 * enseñar. Es el mismo patrón que el token del banco.
 *
 * ══ POR QUÉ NO ES `NEXT_PUBLIC_` ══
 *
 * Porque cualquier variable con ese prefijo termina escrita dentro del
 * JavaScript que se descarga el navegador. Un token así se lee abriendo la
 * consola.
 */

/**
 * LAS DOS VARIABLES, Y SE LLAMAN EXACTAMENTE ASÍ.
 *
 *   AGENTE_URL    la dirección base, sin barra al final
 *   AGENTE_TOKEN  el token, secreto, solo servidor
 *
 * Ninguna lleva el prefijo `NEXT_PUBLIC_`, y eso no es un descuido: cualquier
 * variable con ese prefijo termina escrita dentro del JavaScript que descarga
 * el navegador, y ahí el token se lee abriendo la consola.
 */
function base(): string | null {
  return baseDelAgente(getCloudflareContext().env.AGENTE_URL);
}

function token(): string | undefined {
  /* Se recorta: al pegar una credencial en el panel de la plataforma es
     facilísimo arrastrar un salto de línea, y el agente devuelve el mismo 401
     que si la llave fuera falsa. */
  return getCloudflareContext().env.AGENTE_TOKEN?.trim() || undefined;
}

/**
 * Hacen falta LAS DOS.
 *
 * Con una sola, la pantalla dibujaría un chat que falla en cada envío sin
 * decir por qué. Sin ninguna, el sitio funciona igual: solo no hay asistente.
 */
export function agenteConfigurado(): boolean {
  return Boolean(token() && base());
}

export type ResultadoAgente =
  | { ok: true; datos: RespuestaAgente }
  | {
      ok: false;
      motivo: MotivoFallo;
      detalle?: string;
      esperaSegundos?: number;
    };

async function llamar(
  ruta: string,
  opciones?: { metodo?: string; cuerpo?: unknown },
): Promise<ResultadoAgente> {
  const llave = token();
  const donde = base();
  if (!llave || !donde) return { ok: false, motivo: "sin_token" };

  let respuesta: Response;
  try {
    respuesta = await fetch(`${donde}${ruta}`, {
      method: opciones?.metodo ?? "GET",
      headers: {
        authorization: `Bearer ${llave}`,
        "content-type": "application/json",
      },
      body: opciones?.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      /* Una conversación no se lee de una caché. */
      cache: "no-store",
    });
  } catch (fallo) {
    console.error("[asistente] no se pudo llamar al agente:", fallo);
    return { ok: false, motivo: "sin_respuesta" };
  }

  if (!respuesta.ok) {
    const motivo = motivoDelEstado(respuesta.status);

    /**
     * SE DEVUELVE LO QUE CONTESTÓ EL AGENTE, MENOS CUANDO ES EL TOKEN.
     *
     * En un 503 su texto explica qué le falta configurar y es justo lo que hay
     * que leer. En un 401, en cambio, el cuerpo puede repetir la credencial que
     * se mandó: ahí no se reenvía nada al navegador.
     */
    const detalle =
      motivo === "token_rechazado"
        ? undefined
        : (await respuesta.text().catch(() => "")).slice(0, 500) || undefined;

    if (motivo === "token_rechazado") {
      console.error("[asistente] el agente rechazó el token");
    }

    return {
      ok: false,
      motivo,
      detalle,
      esperaSegundos:
        motivo === "demasiadas_peticiones"
          ? segundosDeEspera(respuesta.headers.get("retry-after"))
          : undefined,
    };
  }

  try {
    return { ok: true, datos: (await respuesta.json()) as RespuestaAgente };
  } catch {
    return { ok: false, motivo: "sin_respuesta" };
  }
}

/** Manda un mensaje de la persona y devuelve lo que contesta el agente. */
export function mandarMensaje(idConversacion: string, mensaje: string) {
  return llamar(`/sesion/${idConversacion}/mensaje`, {
    metodo: "POST",
    cuerpo: { mensaje },
  });
}

/** La conversación guardada, para que no empiece en blanco al recargar. */
export function traerHistorial(idConversacion: string) {
  return llamar(`/sesion/${idConversacion}/historial`);
}

/** Borra la conversación y empieza de cero. */
export function reiniciarConversacion(idConversacion: string) {
  return llamar(`/sesion/${idConversacion}/reiniciar`, { metodo: "POST" });
}

/**
 * Si el agente tiene modelo configurado.
 *
 * Es el único endpoint sin token, así que sirve para distinguir «el agente
 * está caído» de «nuestra llave no sirve» — que desde la pantalla se ven
 * exactamente igual y se diagnostican muy distinto.
 */
export async function saludDelAgente(): Promise<{
  responde: boolean;
  modeloConfigurado: boolean;
}> {
  const donde = base();
  if (!donde) return { responde: false, modeloConfigurado: false };

  try {
    const r = await fetch(`${donde}/salud`, { cache: "no-store" });
    if (!r.ok) return { responde: false, modeloConfigurado: false };
    const d = (await r.json()) as { modelo_configurado?: boolean };
    return { responde: true, modeloConfigurado: Boolean(d.modelo_configurado) };
  } catch {
    return { responde: false, modeloConfigurado: false };
  }
}
