import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * El envio de correos del sistema, con el servicio propio de Mercatren
 * (Cloudflare Email Sending). No hay libreria que instalar: es una llamada
 * HTTP directa.
 *
 * LAS DOS DIRECCIONES (regla del proyecto, no inventar otras):
 *
 * - `avisos@mercatren.com` SOLO ENVIA. Es la voz del sistema: avisos de
 *   compra, pagos, contrasenas. No recibe nada; responderle no llega a nadie.
 *   Cualquier buzon @mercatren.com sirve como remitente: el dominio entero
 *   esta autorizado y firmado.
 * - `mercatren@windoce.com` SOLO RECIBE. Es el buzon real y funcional donde
 *   entra el contacto de la web, y el que figura en terminos y condiciones.
 *   Va como Reply-To en cada envio: si alguien responde un aviso, la
 *   respuesta cae en el buzon de verdad.
 *
 * PROHIBIDO usar direcciones tipo soporte@mercatren.com como contacto: ese
 * buzon no existe y el mensaje se pierde.
 *
 * SOLO TRANSACCIONAL: confirmaciones, avisos y recuperacion de contrasena.
 * Nada de promociones ni envios masivos por aqui.
 *
 * Sin el token configurado no se envia nada y el sistema sigue funcionando
 * igual: el correo es un aviso, nunca un requisito. Un pago aprobado no se
 * desaprueba porque el aviso no salio.
 */

import { CORREO_CONTACTO, CORREO_REMITENTE } from "./direcciones";
import { anotarRebote, tieneRebote } from "./rebotes";

export { CORREO_CONTACTO, CORREO_REMITENTE };

/** La cuenta de Cloudflare de Mercatren. No es un secreto; el token si. */
const CUENTA = "4d9e131f2c18bc10ac4700d689d5556c";
const ENVIO = `https://api.cloudflare.com/client/v4/accounts/${CUENTA}/email/sending/send`;

type Envio = {
  a: string;
  asunto: string;
  html: string;
  /** Version en texto plano. SIEMPRE va: sin ella el correo cae en spam. */
  texto: string;
};

/**
 * Separa "Mercatren <avisos@mercatren.com>" en sus dos partes, porque el
 * servicio los pide en campos distintos.
 *
 * OJO CON LOS NOMBRES DE LOS CAMPOS: el servicio usa `email` (no `address`) y
 * `replyTo` en una sola palabra (no `reply_to`). Con los otros nombres
 * responde `invalid_request_schema` y no manda nada.
 */
function partirRemitente(remitente: string) {
  const con = remitente.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (con) return { name: con[1] || "Mercatren", email: con[2] };
  return { name: "Mercatren", email: remitente.trim() };
}

type Respuesta = {
  success?: boolean;
  errors?: { message?: string }[];
  result?: { message_id?: string; permanent_bounces?: string[] };
  permanent_bounces?: string[];
};

/**
 * Envia un correo. Nunca lanza y NUNCA reintenta en bucle: si falla, se
 * registra y la operacion que lo pidio sigue su curso.
 */
export async function enviarCorreo({ a, asunto, html, texto }: Envio) {
  const { env } = getCloudflareContext();
  const token = env.CLOUDFLARE_EMAIL_TOKEN;

  if (!token) {
    const motivo = "CLOUDFLARE_EMAIL_TOKEN no llega al sitio";
    console.warn(`[correo] ${motivo}; no se envio "${asunto}" a ${a}`);
    return { enviado: false as const, motivo };
  }

  const destino = a.trim().toLowerCase();

  // A quien rebota de forma permanente no se le vuelve a escribir: insistir
  // ensucia la reputacion del dominio y perjudica los correos que si llegan.
  if (await tieneRebote(destino)) {
    const motivo = `${destino} rebota de forma permanente; no se le vuelve a escribir`;
    console.warn(`[correo] ${motivo}`);
    return { enviado: false as const, motivo };
  }

  const de = partirRemitente(env.CORREO_REMITENTE || CORREO_REMITENTE);

  try {
    const respuesta = await fetch(ENVIO, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: { email: de.email, name: de.name },
        to: destino,
        replyTo: CORREO_CONTACTO,
        subject: asunto,
        text: texto,
        html,
      }),
    });

    const cuerpo = (await respuesta
      .json()
      .catch(() => null)) as Respuesta | null;

    const rebotes =
      cuerpo?.result?.permanent_bounces ?? cuerpo?.permanent_bounces;
    if (rebotes?.some((correo) => correo.trim().toLowerCase() === destino)) {
      await anotarRebote(destino);
      const motivo = `${destino} rebota de forma permanente; queda anotado`;
      console.warn(`[correo] ${motivo}`);
      return { enviado: false as const, motivo };
    }

    if (!respuesta.ok || !cuerpo?.success) {
      const motivo =
        cuerpo?.errors?.map((e) => e.message).join("; ") ||
        `el servicio respondió HTTP ${respuesta.status}`;
      console.error(`[correo] rechazado "${asunto}" a ${destino}: ${motivo}`);
      return { enviado: false as const, motivo };
    }

    return { enviado: true as const, id: cuerpo.result?.message_id };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "fallo de red";
    console.error(`[correo] fallo enviando "${asunto}" a ${destino}:`, e);
    return { enviado: false as const, motivo };
  }
}
