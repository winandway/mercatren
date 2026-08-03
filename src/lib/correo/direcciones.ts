/**
 * Las dos direcciones de correo de Mercatren. REGLA DEL PROYECTO:
 *
 * - `mercatren@windoce.com` es el buzon REAL Y FUNCIONAL: recibe el contacto
 *   de la web y es el que figura en terminos y condiciones. Todo "escribenos"
 *   apunta aqui.
 * - `noreply@mercatren.com` SOLO ENVIA los avisos del sistema (via Resend).
 *   No recibe nada.
 *
 * PROHIBIDO inventar direcciones tipo soporte@mercatren.com: ese buzon no
 * tiene SMTP, no recibe, y el mensaje del cliente se pierde.
 *
 * Vive aparte de enviar.ts para poder importarse desde cualquier componente
 * (el pie de pagina, los terminos) sin arrastrar el cliente de Resend.
 */

/** El buzon real: recibe. Va en la web y en los documentos. */
export const CORREO_CONTACTO = "mercatren@windoce.com";

/** El remitente del sistema: solo envia. */
export const CORREO_REMITENTE = "Mercatren <noreply@mercatren.com>";
