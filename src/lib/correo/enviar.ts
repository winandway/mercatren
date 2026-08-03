import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Resend } from "resend";

/**
 * El envio de correos del sistema, con Resend.
 *
 * LAS DOS DIRECCIONES (regla del proyecto, no inventar otras):
 *
 * - `noreply@mercatren.com` SOLO ENVIA. Es la voz del sistema: avisos de
 *   compra, pagos, contrasenas. No recibe nada; responderle no llega a nadie.
 * - `mercatren@windoce.com` SOLO RECIBE. Es el buzon real y funcional donde
 *   entra el contacto de la web, y el que figura en terminos y condiciones.
 *   Va como Reply-To en cada envio: si alguien responde un aviso, la
 *   respuesta cae en el buzon de verdad.
 *
 * PROHIBIDO usar direcciones tipo soporte@mercatren.com como contacto: ese
 * buzon no existe y el mensaje se pierde.
 *
 * Sin RESEND_API_KEY configurada no se envia nada y el sistema sigue
 * funcionando igual: el correo es un aviso, nunca un requisito.
 */

import { CORREO_CONTACTO, CORREO_REMITENTE } from "./direcciones";

export { CORREO_CONTACTO, CORREO_REMITENTE };

type Envio = {
  a: string;
  asunto: string;
  html: string;
  /** Version en texto plano, para clientes de correo viejos y para el spam score. */
  texto: string;
};

/**
 * Envia un correo. Nunca lanza: si falla, se registra y la operacion que lo
 * pidio sigue su curso — un pago aprobado no se desaprueba porque el aviso
 * no salio.
 */
export async function enviarCorreo({ a, asunto, html, texto }: Envio) {
  const { env } = getCloudflareContext();
  const clave = env.RESEND_API_KEY;

  if (!clave) {
    console.warn(
      `[correo] RESEND_API_KEY sin configurar; no se envio "${asunto}" a ${a}`,
    );
    return { enviado: false as const };
  }

  try {
    const resend = new Resend(clave);
    const { error } = await resend.emails.send({
      from: CORREO_REMITENTE,
      to: a,
      replyTo: CORREO_CONTACTO,
      subject: asunto,
      html,
      text: texto,
    });

    if (error) {
      console.error(
        `[correo] Resend rechazo "${asunto}" a ${a}:`,
        error.message,
      );
      return { enviado: false as const };
    }

    return { enviado: true as const };
  } catch (e) {
    console.error(`[correo] fallo enviando "${asunto}" a ${a}:`, e);
    return { enviado: false as const };
  }
}
